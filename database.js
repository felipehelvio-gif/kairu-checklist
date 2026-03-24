// ═══════════════════════════════════════════════════════════════
//  KAIRU CHECKLIST — Banco de Dados Local (SQLite via JSON)
//  Armazena checklists, preenchimentos e histórico localmente.
//  Simples, robusto, 100% offline.
// ═══════════════════════════════════════════════════════════════

const fs = require("fs")
const path = require("path")

class Database {
    constructor(dbDir) {
        this.dbDir = dbDir
        this.files = {
            checklists: path.join(dbDir, "checklists.json"),
            preenchimentos: path.join(dbDir, "preenchimentos.json"),
        }

        // Garantir que diretório existe
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true })
        }
    }

    // ─── Helpers ───
    _read(file) {
        try {
            if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8"))
        } catch (e) { console.error("DB read error:", e) }
        return []
    }

    _write(file, data) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2))
    }

    _generateId() {
        return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 8)
    }

    // ═══════════════════════════════════
    //  CHECKLISTS (templates customizados)
    // ═══════════════════════════════════

    getChecklists() {
        return this._read(this.files.checklists)
    }

    getChecklist(id) {
        return this.getChecklists().find(c => c.id === id)
    }

    saveChecklist(checklist) {
        const all = this.getChecklists()
        const existing = all.findIndex(c => c.id === checklist.id)

        if (existing >= 0) {
            // Atualizar
            all[existing] = { ...all[existing], ...checklist, updatedAt: new Date().toISOString() }
        } else {
            // Criar
            all.push({
                ...checklist,
                id: checklist.id || this._generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
        }

        this._write(this.files.checklists, all)
        return checklist
    }

    deleteChecklist(id) {
        const all = this.getChecklists().filter(c => c.id !== id)
        this._write(this.files.checklists, all)
    }

    // Importar templates padrão (se não existirem)
    importTemplates(templates) {
        const existing = this.getChecklists()
        const existingIds = new Set(existing.map(c => c.id))

        let imported = 0
        for (const tpl of templates) {
            if (!existingIds.has(tpl.id)) {
                existing.push({
                    ...tpl,
                    fromTemplate: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                })
                imported++
            }
        }

        if (imported > 0) {
            this._write(this.files.checklists, existing)
        }
        return imported
    }

    // ═══════════════════════════════════
    //  PREENCHIMENTOS (respostas)
    // ═══════════════════════════════════

    getPreenchimentos(checklistId) {
        const all = this._read(this.files.preenchimentos)
        if (checklistId) return all.filter(p => p.checklistId === checklistId)
        return all
    }

    getPreenchimento(id) {
        return this._read(this.files.preenchimentos).find(p => p.id === id)
    }

    savePreenchimento(data) {
        const all = this._read(this.files.preenchimentos)
        const preenchimento = {
            ...data,
            id: data.id || this._generateId(),
            createdAt: data.createdAt || new Date().toISOString(),
        }
        all.push(preenchimento)

        // Manter últimos 500 preenchimentos (limpar antigos)
        if (all.length > 500) {
            all.splice(0, all.length - 500)
        }

        this._write(this.files.preenchimentos, all)
        return preenchimento
    }

    // Atualizar preenchimento (adicionar feedback IA, score, etc.)
    updatePreenchimento(id, updates) {
        const all = this._read(this.files.preenchimentos)
        const idx = all.findIndex(p => p.id === id)
        if (idx >= 0) {
            all[idx] = { ...all[idx], ...updates }
            this._write(this.files.preenchimentos, all)
            return all[idx]
        }
        return null
    }

    // ═══════════════════════════════════
    //  ESTATÍSTICAS
    // ═══════════════════════════════════

    getStats(checklistId) {
        const preenchimentos = this.getPreenchimentos(checklistId)
        if (preenchimentos.length === 0) return { total: 0 }

        const scores = preenchimentos.filter(p => p.score != null).map(p => p.score)
        const mediaScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null

        // Últimos 7 dias
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentes = preenchimentos.filter(p => new Date(p.createdAt) >= sevenDaysAgo)

        return {
            total: preenchimentos.length,
            comFeedback: preenchimentos.filter(p => p.feedback).length,
            mediaScore,
            ultimos7dias: recentes.length,
            ultimoPreenchimento: preenchimentos[preenchimentos.length - 1]?.createdAt,
        }
    }
}

module.exports = Database
