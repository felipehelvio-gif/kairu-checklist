const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("api", {
    // Config
    loadConfig: () => ipcRenderer.invoke("load-config"),
    saveConfig: (data) => ipcRenderer.invoke("save-config", data),

    // Checklists (CRUD — desktop configura)
    getChecklists: () => ipcRenderer.invoke("get-checklists"),
    getChecklist: (id) => ipcRenderer.invoke("get-checklist", id),
    saveChecklist: (data) => ipcRenderer.invoke("save-checklist", data),
    deleteChecklist: (id) => ipcRenderer.invoke("delete-checklist", id),

    // Preenchimentos (leitura — preenchimento é feito no MOBILE)
    getPreenchimentos: (checklistId) => ipcRenderer.invoke("get-preenchimentos", checklistId),
    getStats: (checklistId) => ipcRenderer.invoke("get-stats", checklistId),

    // IA
    analyzeChecklist: (preenchimentoId) => ipcRenderer.invoke("analyze-checklist", preenchimentoId),
    generatePrompt: (descricao, contexto) => ipcRenderer.invoke("generate-prompt", descricao, contexto),

    // WhatsApp Nativo (Baileys — roda dentro do Electron)
    waConnect: () => ipcRenderer.invoke("wa-connect"),
    waDisconnect: () => ipcRenderer.invoke("wa-disconnect"),
    waStatus: () => ipcRenderer.invoke("wa-status"),
    waListGroups: () => ipcRenderer.invoke("wa-list-groups"),
    waSendLink: (checklistId) => ipcRenderer.invoke("wa-send-link", checklistId),
    waSendResult: (preenchimentoId) => ipcRenderer.invoke("wa-send-result", preenchimentoId),

    // Fotos
    getFotos: () => ipcRenderer.invoke("get-fotos"),
    openFotosDir: () => ipcRenderer.invoke("open-fotos-dir"),

    // Rede + QR Code
    getNetworkInfo: () => ipcRenderer.invoke("get-network-info"),
    generateQRCode: () => ipcRenderer.invoke("generate-qrcode"),

    // Licença
    validateLicense: (key) => ipcRenderer.invoke("validate-license", key),
    checkProStatus: () => ipcRenderer.invoke("check-pro-status"),

    // Registro
    saveRegistration: (data) => ipcRenderer.invoke("save-registration", data),
    trackBanner: (bannerId, type) => ipcRenderer.invoke("track-banner", bannerId, type),

    // Sistema
    openExternal: (url) => ipcRenderer.invoke("open-external", url),
})
