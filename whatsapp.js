// ═══════════════════════════════════════════════════════════════
//  KAIRU CHECKLIST — WhatsApp Nativo (Baileys)
//  Conecta direto ao WhatsApp sem precisar de Evolution API.
//  A sessão fica salva localmente no PC.
// ═══════════════════════════════════════════════════════════════

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const pino = require("pino")
const path = require("path")
const fs = require("fs")

class WhatsAppManager {
    constructor(sessionDir) {
        this.sessionDir = sessionDir
        this.sock = null
        this.qrCallback = null    // Chamado quando um QR é gerado
        this.statusCallback = null // Chamado quando muda o status
        this.status = "disconnected" // disconnected | connecting | connected
        this.qrCode = null
        this.retries = 0
        this.maxRetries = 3

        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })
    }

    /**
     * Conectar ao WhatsApp.
     * Gera QR code ou restaura sessão salva.
     */
    async connect() {
        if (this.status === "connected" && this.sock) return

        this.setStatus("connecting")

        try {
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir)
            const { version } = await fetchLatestBaileysVersion()

            this.sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: false,
                browser: ["Kairu Checklist", "Desktop", "1.0.0"],
                logger: pino({ level: "silent" }),
            })

            // QR Code gerado
            this.sock.ev.on("connection.update", (update) => {
                const { connection, lastDisconnect, qr } = update

                if (qr) {
                    this.qrCode = qr
                    this.setStatus("qr")
                    if (this.qrCallback) this.qrCallback(qr)
                }

                if (connection === "open") {
                    this.qrCode = null
                    this.retries = 0
                    this.setStatus("connected")
                    console.log("📱 WhatsApp conectado!")
                }

                if (connection === "close") {
                    const statusCode = lastDisconnect?.error?.output?.statusCode
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut

                    if (shouldReconnect && this.retries < this.maxRetries) {
                        this.retries++
                        console.log(`📱 Reconectando... (tentativa ${this.retries})`)
                        setTimeout(() => this.connect(), 3000)
                    } else {
                        this.setStatus("disconnected")
                        if (statusCode === DisconnectReason.loggedOut) {
                            // Limpar sessão
                            this.clearSession()
                        }
                    }
                }
            })

            // Salvar credenciais quando atualizar
            this.sock.ev.on("creds.update", saveCreds)

        } catch (e) {
            console.error("WhatsApp connect error:", e.message)
            this.setStatus("disconnected")
        }
    }

    /**
     * Desconectar do WhatsApp.
     */
    async disconnect() {
        if (this.sock) {
            await this.sock.logout().catch(() => {})
            this.sock = null
        }
        this.clearSession()
        this.setStatus("disconnected")
    }

    /**
     * Limpar sessão salva.
     */
    clearSession() {
        try {
            const files = fs.readdirSync(this.sessionDir)
            for (const file of files) {
                fs.unlinkSync(path.join(this.sessionDir, file))
            }
        } catch (e) {}
    }

    /**
     * Atualizar status e notificar callback.
     */
    setStatus(status) {
        this.status = status
        if (this.statusCallback) this.statusCallback(status)
    }

    /**
     * Listar todos os grupos do WhatsApp.
     */
    async listGroups() {
        if (!this.sock || this.status !== "connected") {
            throw new Error("WhatsApp não conectado")
        }

        const groups = await this.sock.groupFetchAllParticipating()
        return Object.values(groups).map(g => ({
            id: g.id,
            nome: g.subject || "Sem nome",
            participantes: g.participants?.length || 0,
            descricao: g.desc || "",
            criacao: g.creation ? new Date(g.creation * 1000).toISOString() : null,
        }))
    }

    /**
     * Enviar mensagem de texto para um grupo ou número.
     */
    async sendMessage(jid, text) {
        if (!this.sock || this.status !== "connected") {
            throw new Error("WhatsApp não conectado")
        }
        await this.sock.sendMessage(jid, { text })
        return true
    }

    /**
     * Enviar link do checklist para o grupo.
     */
    async sendChecklistLink(groupId, localIP, port, suffix = '', customMessage = '', checklistName = '') {
        if (!groupId) throw new Error("Grupo não selecionado")

        const url = `http://${localIP}:${port}${suffix}`
        const now = new Date()
        const hora = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

        if (customMessage) {
            const message = customMessage
                .replace(/\{link\}/g, url)
                .replace(/\{horario\}/g, hora)
                .replace(/\{nome\}/g, checklistName || 'Checklist')
            return this.sendMessage(groupId, message)
        }

        // Mensagem padrão: texto + link separado pra ficar clicável
        const texto = `📋 *${checklistName || 'CHECKLIST DO DIA'}* — ${hora}\n\nPreencha o checklist abaixo 👇`
        await this.sendMessage(groupId, texto)
        // Link sozinho: WhatsApp torna clicável
        await this.sendMessage(groupId, url)
        return true
    }

    /**
     * Enviar resultado/feedback para o grupo.
     */
    async sendFeedback(groupId, checklistNome, preenchidoPor, feedback, score) {
        if (!groupId) throw new Error("Grupo não selecionado")

        const now = new Date()
        const data = now.toLocaleDateString("pt-BR")
        const hora = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        const emoji = score >= 8 ? "🟢" : score >= 5 ? "🟡" : "🔴"

        let msg = `═══════════════════\n`
        msg += `📊 *RESULTADO DO CHECKLIST*\n`
        msg += `═══════════════════\n\n`
        msg += `📋 *${checklistNome}*\n`
        msg += `📅 ${data} às ${hora}\n`
        msg += `👤 Por: *${preenchidoPor || "Não informado"}*\n`
        if (score != null) msg += `${emoji} *Nota: ${score}/10*\n`
        msg += `\n────────────────────\n\n`
        msg += feedback
        msg += `\n\n────────────────────`
        msg += `\n_Kairu Checklist · Análise por IA_`

        return this.sendMessage(groupId, msg)
    }

    /**
     * Retornar estado atual.
     */
    getState() {
        return {
            status: this.status,
            qr: this.qrCode,
            hasSession: fs.readdirSync(this.sessionDir).length > 0,
        }
    }
}

module.exports = WhatsAppManager
