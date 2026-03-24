const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron")
const path = require("path")
const fs = require("fs")
const os = require("os")
const express = require("express")
const QRCode = require("qrcode")
const kairu = require("./kairu-sdk")
const { TEMPLATES } = require("./templates")
const Database = require("./database")
const { analyzeChecklist, generateSystemPrompt, extractScore } = require("./ai-engine")
const WhatsAppManager = require("./whatsapp")

const PRODUCT = "kairu-checklist"
const WEB_PORT = 3334

const configPath = path.join(app.getPath("userData"), "config.json")
const photosDir = path.join(app.getPath("userData"), "fotos")
const waSessionDir = path.join(app.getPath("userData"), "wa-session")
const db = new Database(path.join(app.getPath("userData"), "data"))
const wa = new WhatsAppManager(waSessionDir)

// Garantir pasta de fotos
if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true })

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) return JSON.parse(fs.readFileSync(configPath, "utf-8"))
    } catch (e) {}
    return {
        nomeEmpresa: "", cnpj: "", cidade: "", estado: "",
        tipoCozinha: "", email: "", telefone: "",
        termosAceitos: false, licenseKey: "",
        apiProvider: "gemini", apiKey: "",
        whatsappGrupoId: "", whatsappGrupoNome: "",
    }
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

function getLocalIP() {
    const interfaces = os.networkInterfaces()
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) return iface.address
        }
    }
    return "127.0.0.1"
}

// ═══════════════════════════════════════════
//  SERVIDOR WEB LOCAL — INTERFACE MOBILE
//  Esta é a interface PRINCIPAL onde o
//  funcionário preenche o checklist.
// ═══════════════════════════════════════════
function startWebServer() {
    const webApp = express()
    webApp.use(express.json({ limit: "50mb" })) // Limite alto para fotos

    // Servir mobile.html como página principal
    webApp.get("/", (req, res) => res.sendFile(path.join(__dirname, "mobile.html")))
    webApp.use(express.static(__dirname))

    // Servir fotos salvas
    webApp.use("/fotos", express.static(photosDir))

    // API: listar checklists disponíveis
    webApp.get("/api/checklists", (req, res) => {
        res.json(db.getChecklists())
    })

    // API: buscar 1 checklist
    webApp.get("/api/checklist/:id", (req, res) => {
        const cl = db.getChecklist(req.params.id)
        if (!cl) return res.status(404).json({ error: "Checklist não encontrado" })
        res.json(cl)
    })

    // API: upload de foto (base64 do celular → arquivo no PC)
    webApp.post("/api/foto", (req, res) => {
        try {
            const { base64, checklistId, itemId } = req.body
            if (!base64) return res.status(400).json({ error: "Foto vazia" })

            // Remover header data:image/jpeg;base64,
            const raw = base64.replace(/^data:image\/\w+;base64,/, "")
            const buffer = Buffer.from(raw, "base64")

            const timestamp = Date.now()
            const filename = `${checklistId || "foto"}_${itemId || "item"}_${timestamp}.jpg`
            const filepath = path.join(photosDir, filename)

            fs.writeFileSync(filepath, buffer)

            res.json({ ok: true, filename, path: `/fotos/${filename}` })
        } catch (e) {
            res.status(500).json({ error: e.message })
        }
    })

    // API: enviar preenchimento completo (do mobile)
    webApp.post("/api/preencher", async (req, res) => {
        try {
            const { checklistId, preenchidoPor, itens, observacaoGeral, fotos } = req.body
            const checklist = db.getChecklist(checklistId)
            if (!checklist) return res.status(404).json({ error: "Checklist não encontrado" })

            const preenchimento = db.savePreenchimento({
                checklistId, preenchidoPor,
                itens, observacaoGeral, fotos: fotos || [],
                checklistNome: checklist.nome,
            })

            // Notificar desktop que tem preenchimento novo
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.executeJavaScript(
                    `if(typeof onNewPreenchimento==="function")onNewPreenchimento(${JSON.stringify(preenchimento)})`
                )
            }

            // Analisar TODOS com IA automaticamente (se configurada)
            const config = loadConfig()
            if (config.apiKey) {
                try {
                    // Coletar caminhos das fotos para análise visual
                    const photosPaths = (fotos || []).map(f => {
                        const filename = typeof f === "string" ? f : f.filename || f
                        const itemId = typeof f === "object" ? f.itemId : null
                        return { path: path.join(photosDir, filename), label: filename, itemId }
                    }).filter(p => fs.existsSync(p.path))

                    const feedback = await analyzeChecklist(config, checklist, { preenchidoPor, itens, observacaoGeral }, photosPaths)
                    const score = extractScore(feedback)
                    db.updatePreenchimento(preenchimento.id, { feedback, score })
                    preenchimento.feedback = feedback
                    preenchimento.score = score

                    // Enviar WhatsApp pro grupo (se configurado e conectado)
                    const config2 = loadConfig()
                    if (config2.whatsappGrupoId && wa.status === "connected") {
                        try {
                            const cl2 = db.getChecklist(checklistId)
                            const isProStatus = kairu.isPro(config2, app.getPath("userData"))
                            await wa.sendFeedback(config2.whatsappGrupoId, cl2.nome, preenchidoPor, feedback, score, isProStatus)
                            db.updatePreenchimento(preenchimento.id, { whatsappEnviado: true })
                        } catch (e) { console.log("WhatsApp falhou:", e.message) }
                    }
                } catch (e) { console.log("IA falhou:", e.message) }
            }

            res.json(preenchimento)
        } catch (e) {
            res.status(500).json({ error: e.message })
        }
    })

    // API: listar preenchimentos
    webApp.get("/api/preenchimentos", (req, res) => {
        const checklistId = req.query.checklistId
        res.json(db.getPreenchimentos(checklistId))
    })

    // API: listar fotos
    webApp.get("/api/fotos", (req, res) => {
        try {
            const files = fs.readdirSync(photosDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f))
            res.json(files.map(f => ({
                filename: f,
                url: `/fotos/${f}`,
                size: fs.statSync(path.join(photosDir, f)).size,
                date: fs.statSync(path.join(photosDir, f)).mtime,
            })))
        } catch (e) { res.json([]) }
    })

    webApp.listen(WEB_PORT, "0.0.0.0", () => {
        console.log(`📋 Checklist mobile em http://${getLocalIP()}:${WEB_PORT}`)
    })
}

// ═══════════════════════════════════════════
//  ELECTRON — Desktop (Configurador + Viewer)
// ═══════════════════════════════════════════
let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1250, height: 850, minWidth: 1000, minHeight: 700,
        title: "Kairu Checklist",
        icon: path.join(__dirname, "assets", "icon.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true, nodeIntegration: false,
        },
    })
    mainWindow.loadFile("index.html")
    if (process.argv.includes("--dev")) mainWindow.webContents.openDevTools()
}

app.whenReady().then(async () => {
    const { autoUpdater } = require("electron-updater")
    try {
        autoUpdater.checkForUpdatesAndNotify()
    } catch (e) { console.log('Auto-update config não encontrada (ambiente de dev)') }

    createWindow()
    startWebServer()

    const config = loadConfig()
    kairu.getInstallId(config)
    saveConfig(config)
    kairu.sendTelemetry(config, PRODUCT)
    kairu.startHeartbeat(config, PRODUCT)

    const banner = await kairu.fetchBanner(config, PRODUCT)
    const versionStatus = await kairu.checkVersion(config, PRODUCT, app.getVersion())
    const configDir = app.getPath("userData")
    const proStatus = kairu.isPro(config, configDir)
    const firstRun = kairu.isFirstRun(config)

    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.webContents.executeJavaScript(`
            window.__installId = "${config.installId || ''}";
            window.__isPro = ${proStatus};
            window.__isFirstRun = ${firstRun};
            window.__localIP = "${getLocalIP()}";
            window.__webPort = ${WEB_PORT};
            window.__photosDir = "${photosDir.replace(/\\/g, '\\\\')}";
            window.__versionStatus = ${JSON.stringify(versionStatus)};
            ${banner ? `window.__kairuBanner = ${JSON.stringify(banner)};` : ''}
            
            if (window.__versionStatus && window.__versionStatus.blocked) {
                if (typeof showVersionBlock === "function") showVersionBlock();
            } else {
                if (${firstRun} && typeof showRegistrationModal === "function") showRegistrationModal();
                if (typeof showKairuBanner === "function" && !${proStatus}) showKairuBanner();
                if (typeof initApp === "function") initApp();
            }
        `)
    })

    // Auto-reconectar WhatsApp se já tem sessão
    if (fs.readdirSync(waSessionDir).length > 0) {
        console.log("📱 Reconectando WhatsApp (sessão salva)...")
        // Registrar callbacks ANTES de conectar
        wa.statusCallback = (status) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.executeJavaScript(
                    `if(typeof onWAStatus==="function")onWAStatus("${status}")`
                )
            }
        }
        wa.qrCallback = async (qr) => {
            const dataUrl = await QRCode.toDataURL(qr, {
                width: 280, margin: 2, color: { dark: "#25D366", light: "#141414" },
            })
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.executeJavaScript(
                    `if(typeof onWAQR==="function")onWAQR("${dataUrl}")`
                )
            }
        }
        wa.connect().catch(() => {})
    }

    // ═══ SCHEDULER — Envio automático de links ═══
    const sentToday = new Set() // Evita enviar 2x no mesmo minuto
    setInterval(() => {
        const now = new Date()
        const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
        const today = now.toISOString().slice(0, 10)

        if (wa.status !== "connected") return
        const cfg = loadConfig()
        if (!cfg.whatsappGrupoId) return

        const checklists = db.getChecklists()
        for (const cl of checklists) {
            if (!cl.horarios || !Array.isArray(cl.horarios)) continue
            for (const horario of cl.horarios) {
                const key = `${today}_${cl.id}_${horario}`
                if (sentToday.has(key)) continue
                if (horario === hhmm) {
                    sentToday.add(key)
                    console.log(`⏰ Enviando checklist "${cl.nome}" (${horario})`)
                    wa.sendChecklistLink(cfg.whatsappGrupoId, getLocalIP(), WEB_PORT, `/?id=${cl.id}`, cl.mensagemWA || '', cl.nome)
                        .then(() => {
                            if (mainWindow && !mainWindow.isDestroyed()) {
                                mainWindow.webContents.executeJavaScript(
                                    `if(typeof onScheduledSend==="function")onScheduledSend("${cl.nome}","${horario}")`
                                )
                            }
                        })
                        .catch(e => console.log("Scheduler falhou:", e.message))
                }
            }
        }
    }, 60000) // Verifica a cada 60 segundos
})

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit() })

// ═══════════════════════════════════════════
//  IPC HANDLERS — Desktop (Configurador)
// ═══════════════════════════════════════════

ipcMain.handle("load-config", () => loadConfig())
ipcMain.handle("save-config", (_e, data) => { saveConfig(data); return true })

// Checklists CRUD
ipcMain.handle("get-checklists", () => db.getChecklists())
ipcMain.handle("get-checklist", (_e, id) => db.getChecklist(id))
ipcMain.handle("save-checklist", (_e, data) => db.saveChecklist(data))
ipcMain.handle("delete-checklist", (_e, id) => { db.deleteChecklist(id); return true })

// Preenchimentos (leitura — preenchimento é feito pelo mobile)
ipcMain.handle("get-preenchimentos", (_e, checklistId) => db.getPreenchimentos(checklistId))
ipcMain.handle("get-stats", (_e, checklistId) => db.getStats(checklistId))

// IA
ipcMain.handle("analyze-checklist", async (_e, preenchimentoId) => {
    const preenchimento = db.getPreenchimento(preenchimentoId)
    if (!preenchimento) throw new Error("Preenchimento não encontrado")
    const checklist = db.getChecklist(preenchimento.checklistId)
    if (!checklist) throw new Error("Checklist não encontrado")
    const config = loadConfig()
    if (!config.apiKey) throw new Error("Configure sua chave de API em Configurações → IA")
    
    const photosPaths = (preenchimento.fotos || []).map(f => {
        const filename = typeof f === "string" ? f : f.filename || f
        const itemId = typeof f === "object" ? f.itemId : null
        return { path: path.join(photosDir, filename), label: filename, itemId }
    }).filter(p => fs.existsSync(p.path))

    const feedback = await analyzeChecklist(config, checklist, preenchimento, photosPaths)
    const score = extractScore(feedback)
    db.updatePreenchimento(preenchimentoId, { feedback, score })
    return { feedback, score }
})

ipcMain.handle("generate-prompt", (_e, descricao, contexto) => {
    return generateSystemPrompt(descricao, contexto)
})

// WhatsApp Nativo (Baileys)
ipcMain.handle("wa-connect", async () => {
    // Registrar callbacks para notificar o frontend
    wa.statusCallback = (status) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.executeJavaScript(
                `if(typeof onWAStatus==="function")onWAStatus("${status}")`
            )
        }
    }
    wa.qrCallback = async (qr) => {
        // Gerar QR Code como data URL e enviar pro frontend
        const dataUrl = await QRCode.toDataURL(qr, {
            width: 280, margin: 2, color: { dark: "#25D366", light: "#141414" },
        })
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.executeJavaScript(
                `if(typeof onWAQR==="function")onWAQR("${dataUrl}")`
            )
        }
    }
    await wa.connect()
    return wa.getState()
})

ipcMain.handle("wa-disconnect", async () => {
    await wa.disconnect()
    return true
})

ipcMain.handle("wa-status", () => wa.getState())

ipcMain.handle("wa-list-groups", async () => {
    return wa.listGroups()
})

ipcMain.handle("wa-send-link", async (_e, checklistId) => {
    const config = loadConfig()
    if (!config.whatsappGrupoId) throw new Error("Nenhum grupo selecionado")
    const suffix = checklistId ? `/?id=${checklistId}` : ''
    const cl = checklistId ? db.getChecklist(checklistId) : null
    await wa.sendChecklistLink(config.whatsappGrupoId, getLocalIP(), WEB_PORT, suffix, cl?.mensagemWA || '', cl?.nome || '')
    return true
})

ipcMain.handle("wa-send-result", async (_e, preenchimentoId) => {
    const p = db.getPreenchimento(preenchimentoId)
    if (!p?.feedback) throw new Error("Sem feedback da IA")
    const cl = db.getChecklist(p.checklistId)
    const config = loadConfig()
    if (!config.whatsappGrupoId) throw new Error("Grupo não configurado")
    const isProStatus = kairu.isPro(config, app.getPath("userData"))
    await wa.sendFeedback(config.whatsappGrupoId, cl.nome, p.preenchidoPor, p.feedback, p.score, isProStatus)
    db.updatePreenchimento(preenchimentoId, { whatsappEnviado: true })
    return true
})

// Fotos
ipcMain.handle("get-fotos", () => {
    try {
        return fs.readdirSync(photosDir)
            .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
            .map(f => ({
                filename: f, url: `file://${path.join(photosDir, f)}`,
                size: fs.statSync(path.join(photosDir, f)).size,
                date: fs.statSync(path.join(photosDir, f)).mtime,
            }))
    } catch (e) { return [] }
})

ipcMain.handle("open-fotos-dir", () => {
    require("electron").shell.openPath(photosDir)
    return true
})

// Rede + QR Code
ipcMain.handle("get-network-info", () => ({ ip: getLocalIP(), port: WEB_PORT }))

ipcMain.handle("generate-qrcode", async () => {
    const url = `http://${getLocalIP()}:${WEB_PORT}`
    const dataUrl = await QRCode.toDataURL(url, {
        width: 280, margin: 2,
        color: { dark: "#FF6B2B", light: "#141414" },
    })
    return { url, dataUrl }
})

// Licença
ipcMain.handle("validate-license", async (_e, key) => { const c = loadConfig(); c.licenseKey = key; saveConfig(c); return kairu.validateLicense(c, PRODUCT, app.getPath("userData")) })
ipcMain.handle("check-pro-status", () => kairu.isPro(loadConfig(), app.getPath("userData")))
ipcMain.handle("save-registration", async (_e, data) => { const c = loadConfig(); Object.assign(c, data, { termosAceitos: true }); saveConfig(c); await kairu.sendRegistration(c, PRODUCT); return true })
ipcMain.handle("track-banner", async (_e, bannerId, type) => { await kairu.trackBanner(loadConfig(), bannerId, type); return true })
ipcMain.handle("open-external", (_e, url) => shell.openExternal(url))
