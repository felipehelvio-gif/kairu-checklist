// ═══════════════════════════════════════════════════════════════
//  KAIRU SDK — Módulo compartilhado para todos os apps Electron
//  Telemetria · Heartbeat · Banner · Licença · Registro
//  by Kairu Labs — "Inteligência que opera."
// ═══════════════════════════════════════════════════════════════

const KAIRU_API = "https://portal.kairulabs.com.br/api"
const fs = require("fs")
const path = require("path")
const os = require("os")

// ═══════════════════════════════════════════
//  ID DE INSTALAÇÃO
// ═══════════════════════════════════════════

function getInstallId(config) {
    if (config.installId) return config.installId
    config.installId = "KL-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 8)
    return config.installId
}

// ═══════════════════════════════════════════
//  TELEMETRIA
// ═══════════════════════════════════════════

async function sendTelemetry(config, product = "kairu-etiquetas") {
    try {
        const data = {
            installId: getInstallId(config),
            product,
            version: config.version || "1.0.0",
            platform: process.platform,
            arch: process.arch,
            osVersion: os.release(),
            hostname: os.hostname(),
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
            timestamp: new Date().toISOString(),
            usage: {
                nomeEmpresa: config.nomeEmpresa || null,
                cnpj: config.cnpj || null,
                hasLogo: !!config.logoBase64,
                labelSize: config.labelSize || null,
                showTime: config.showTime ?? true,
                totalProdutos: (config.products || []).length,
                printerConfigured: !!config.printerName,
                // Campos de segmentação
                cidade: config.cidade || null,
                estado: config.estado || null,
                tipoCozinha: config.tipoCozinha || null,
                email: config.email || null,
                telefone: config.telefone || null,
            }
        }

        await fetch(`${KAIRU_API}/v1/telemetry`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        })
        console.log("📊 Telemetria enviada")
    } catch (e) {
        console.log("📊 Telemetria offline (ok)")
    }
}

// ═══════════════════════════════════════════
//  HEARTBEAT
// ═══════════════════════════════════════════

function startHeartbeat(config, product = "kairu-etiquetas") {
    const beat = async () => {
        try {
            await fetch(`${KAIRU_API}/v1/heartbeat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    installId: getInstallId(config),
                    product,
                    timestamp: new Date().toISOString(),
                })
            })
        } catch (e) { /* silencioso */ }
    }
    beat()
    setInterval(beat, 4 * 60 * 60 * 1000) // 4h
}

// ═══════════════════════════════════════════
//  BANNER REMOTO
// ═══════════════════════════════════════════

async function fetchBanner(config, product = "kairu-etiquetas") {
    try {
        const installId = getInstallId(config)
        const res = await fetch(
            `${KAIRU_API}/v1/banner?product=${product}&installId=${installId}`,
            { headers: { "Accept": "application/json" } }
        )
        if (!res.ok) return null
        const data = await res.json()
        return data.active ? data : null
    } catch (e) {
        return null
    }
}

// Tracking de impressão/clique de banner
async function trackBanner(config, bannerId, type = "impression") {
    try {
        await fetch(`${KAIRU_API}/v1/banner/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bannerId,
                type, // "impression" ou "click"
                installId: getInstallId(config),
            }),
        })
    } catch (e) { /* silencioso */ }
}

// ═══════════════════════════════════════════
//  LICENÇAS
// ═══════════════════════════════════════════

// Cache local da validação (funciona offline por 30 dias)
function getLicenseCachePath(configDir) {
    return path.join(configDir, "license-cache.json")
}

function loadLicenseCache(configDir) {
    try {
        const cachePath = getLicenseCachePath(configDir)
        if (fs.existsSync(cachePath)) {
            const cache = JSON.parse(fs.readFileSync(cachePath, "utf-8"))
            const cacheDate = new Date(cache.cachedAt)
            const now = new Date()
            const diffDays = (now - cacheDate) / (1000 * 60 * 60 * 24)
            if (diffDays <= 30) return cache // cache válido por 30 dias
        }
    } catch (e) {}
    return null
}

function saveLicenseCache(configDir, data) {
    try {
        const cachePath = getLicenseCachePath(configDir)
        fs.writeFileSync(cachePath, JSON.stringify({
            ...data,
            cachedAt: new Date().toISOString(),
        }))
    } catch (e) {}
}

async function validateLicense(config, product = "kairu-etiquetas", configDir) {
    const key = config.licenseKey
    if (!key) return { valid: false, reason: "no_key" }

    // Tentar validar online
    try {
        const installId = getInstallId(config)
        const res = await fetch(
            `${KAIRU_API}/v1/license/validate?key=${encodeURIComponent(key)}&product=${product}&installId=${installId}`
        )
        const data = await res.json()

        if (data.valid) {
            // Cachear resultado
            saveLicenseCache(configDir, { valid: true, key, product, ...data })
        }

        return data
    } catch (e) {
        // Offline: usar cache local
        const cache = loadLicenseCache(configDir)
        if (cache && cache.valid && cache.key === key) {
            return { ...cache, fromCache: true }
        }
        return { valid: false, reason: "offline_no_cache" }
    }
}

// Verificar se o app está em modo Pro (chave validada)
function isPro(config, configDir) {
    if (!config.licenseKey) return false
    const cache = loadLicenseCache(configDir)
    return cache?.valid && cache?.key === config.licenseKey
}

// ═══════════════════════════════════════════
//  PRÉ-CADASTRO
// ═══════════════════════════════════════════

async function sendRegistration(config, product = "kairu-etiquetas") {
    try {
        await fetch(`${KAIRU_API}/v1/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                installId: getInstallId(config),
                product,
                nomeEmpresa: config.nomeEmpresa || null,
                cnpj: config.cnpj || null,
                cidade: config.cidade || null,
                estado: config.estado || null,
                tipoCozinha: config.tipoCozinha || null,
                email: config.email || null,
                telefone: config.telefone || null,
                termosAceitos: config.termosAceitos || false,
                source: "app",
            }),
        })
        console.log("📋 Pré-cadastro enviado")
    } catch (e) {
        console.log("📋 Pré-cadastro offline (ok)")
    }
}

// ═══════════════════════════════════════════
//  VERIFICAR SE É PRIMEIRO USO
// ═══════════════════════════════════════════

function isFirstRun(config) {
    return !config.termosAceitos
}

// ═══════════════════════════════════════════
//  VERSION BLOCK (KILLSWITCH)
// ═══════════════════════════════════════════

async function checkVersion(config, product = "kairu-etiquetas", version = "1.0.0") {
    try {
        const installId = getInstallId(config)
        const res = await fetch(
            `${KAIRU_API}/v1/version-check?product=${product}&version=${version}&installId=${installId}`
        )
        if (!res.ok) return { blocked: false }
        const data = await res.json()
        return data // Ex: { blocked: true, reason: "Atualização obrigatória" }
    } catch (e) {
        return { blocked: false }
    }
}

// ═══════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════

module.exports = {
    KAIRU_API,
    getInstallId,
    sendTelemetry,
    startHeartbeat,
    fetchBanner,
    trackBanner,
    validateLicense,
    isPro,
    sendRegistration,
    isFirstRun,
    checkVersion,
}
