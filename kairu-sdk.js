// ═══════════════════════════════════════════════════════════════
//  KAIRU SDK — Módulo compartilhado para todos os apps Electron
//  Telemetria · Heartbeat · Banner · Registro
//  by Kairu Labs — "Inteligência que opera."
// ═══════════════════════════════════════════════════════════════

const KAIRU_API = "https://portal.kairulabs.com.br/api"
const fs = require("fs")
const path = require("path")
const os = require("os")
const crypto = require("crypto")

// ═══════════════════════════════════════════
//  ID DE INSTALAÇÃO
// ═══════════════════════════════════════════

function getInstallId(config) {
    if (config.installId) return config.installId
    config.installId = "KL-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 8)
    return config.installId
}

// ═══════════════════════════════════════════
//  DEVICE ID (hash de hardware)
// ═══════════════════════════════════════════

function getDeviceId() {
    try {
        const raw = os.hostname() + os.platform() + os.arch() +
                    JSON.stringify(os.cpus()[0]?.model || "") + os.totalmem()
        return crypto.createHash("sha256").update(raw).digest("hex").substring(0, 16)
    } catch (e) {
        return "unknown"
    }
}

// ═══════════════════════════════════════════
//  TELEMETRIA
// ═══════════════════════════════════════════

async function sendTelemetry(config, product = "kairu-auditor") {
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

function startHeartbeat(config, product = "kairu-auditor") {
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

async function fetchBanner(config, product = "kairu-auditor") {
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
                type,
                installId: getInstallId(config),
            }),
        })
    } catch (e) { /* silencioso */ }
}

// ═══════════════════════════════════════════
//  PRÉ-CADASTRO
// ═══════════════════════════════════════════

async function sendRegistration(config, product = "kairu-auditor") {
    try {
        await fetch(`${KAIRU_API}/v1/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                installId: getInstallId(config),
                product,
                deviceId: getDeviceId(),
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
//  EXPORTS
// ═══════════════════════════════════════════

module.exports = {
    KAIRU_API,
    getInstallId,
    getDeviceId,
    sendTelemetry,
    startHeartbeat,
    fetchBanner,
    trackBanner,
    sendRegistration,
    isFirstRun,
}
