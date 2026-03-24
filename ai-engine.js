// ═══════════════════════════════════════════════════════════════
//  KAIRU CHECKLIST — Motor de IA
//  Suporta Gemini (Google) e OpenAI (GPT).
//  Gera system prompts a partir de descrição simples.
//  Analisa checklists preenchidos.
// ═══════════════════════════════════════════════════════════════

/**
 * Gera um System Prompt profissional a partir de uma descrição básica.
 * Ex: "Verificar se a cozinha está limpa" → prompt completo de auditor
 */
function generateSystemPrompt(descricaoBasica, contexto = {}) {
    const nome = contexto.nomeChecklist || "Checklist"
    const tipo = contexto.tipoCozinha || "restaurante"
    const itens = contexto.itens || []

    const itensStr = itens.length > 0
        ? `\n\nITENS DO CHECKLIST:\n${itens.map((it, i) => `${i + 1}. ${it.texto} (${it.tipo}${it.obrigatorio ? ' - OBRIGATÓRIO' : ''})`).join("\n")}`
        : ""

    return `Você é um auditor especialista em operações de ${tipo}, com profundo conhecimento em segurança alimentar (ANVISA RDC 216), boas práticas de fabricação (BPF) e APPCC.

CONTEXTO:
Você está analisando o checklist "${nome}" de um ${tipo}.
A tarefa deste checklist é: ${descricaoBasica}
${itensStr}

REGRAS DE ANÁLISE:

1. CLASSIFICAÇÃO DE GRAVIDADE:
   🟢 CONFORME — Item atende ao padrão esperado
   🟡 ATENÇÃO — Item precisa de melhoria, mas não é urgente
   🔴 CRÍTICO — Item apresenta risco imediato (saúde, segurança, legal)

2. CRITÉRIOS ESPECÍFICOS:
   - Temperaturas fora da faixa segura = CRÍTICO
   - Itens obrigatórios não realizados = mínimo ATENÇÃO, pode ser CRÍTICO dependendo do impacto
   - Questões de segurança (gás, elétrica, incêndio) = SEMPRE CRÍTICO se não conforme
   - Higiene de manipulador = CRÍTICO por risco de contaminação

3. SCORING:
   - 10/10 = Todos os itens conformes, sem ressalvas
   - 7-9/10 = Itens de atenção, mas operação segura
   - 4-6/10 = Itens críticos que precisam de ação em até 24h
   - 0-3/10 = Riscos graves, operação deve ser interrompida

FORMATO OBRIGATÓRIO DA RESPOSTA:

📊 **NOTA GERAL: X/10**

✅ **CONFORME:**
- [liste os itens que estão ok]

⚠️ **ATENÇÃO:**
- [liste os itens que precisam de melhoria]
- [para cada um, explique O QUE fazer]

🚨 **CRÍTICO:** (se houver)
- [liste os itens críticos]
- [para cada um, explique a URGÊNCIA e AÇÃO IMEDIATA]

💡 **RECOMENDAÇÕES:**
- [dicas práticas e objetivas]
- [priorize ações por impacto]

📝 **RESUMO PARA O GESTOR:**
[1-2 frases resumindo a situação geral em linguagem simples]

IMPORTANTE: 
- Seja direto e prático. O gestor é uma pessoa ocupada.
- Use linguagem simples, evite jargões técnicos.
- Sempre sugira a AÇÃO CORRETIVA, não apenas o problema.
- Se tudo estiver ok, parabenize a equipe.`
}

/**
 * Monta a mensagem do usuário (o checklist preenchido) para enviar à IA.
 */
function buildUserMessage(checklist, respostas) {
    let msg = `📋 CHECKLIST: ${checklist.nome}\n`
    msg += `📅 Data: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}\n`
    msg += `👤 Preenchido por: ${respostas.preenchidoPor || "Não informado"}\n\n`
    msg += `RESPOSTAS:\n`

    for (const item of checklist.items) {
        const resp = respostas.itens?.[item.id]
        let valorStr = "Não preenchido"

        if (resp !== undefined && resp !== null && resp !== "") {
            switch (item.tipo) {
                case "checkbox":
                    valorStr = resp ? "✅ SIM" : "❌ NÃO"
                    break
                case "temperatura":
                    valorStr = `${resp}°C`
                    if (item.min !== undefined && item.max !== undefined) {
                        const temp = parseFloat(resp)
                        if (temp < item.min || temp > item.max) {
                            valorStr += ` ⚠️ FORA DA FAIXA (esperado: ${item.min}°C a ${item.max}°C)`
                        }
                    }
                    break
                case "numero":
                    valorStr = `${item.prefixo || ""}${resp}`
                    break
                default:
                    valorStr = String(resp)
            }
        }

        const obrig = item.obrigatorio ? " *" : ""
        msg += `${item.texto}${obrig}: ${valorStr}\n`
    }

    if (respostas.observacaoGeral) {
        msg += `\nOBSERVAÇÃO GERAL: ${respostas.observacaoGeral}\n`
    }

    return msg
}

/**
 * Chama a API do Google Gemini para análise.
 */
async function callGemini(apiKey, systemPrompt, userMessage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    const body = {
        system_instruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: [
            { role: "user", parts: [{ text: userMessage }] }
        ],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
        }
    }

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Gemini API Error: ${res.status} — ${err}`)
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta da IA"
}

/**
 * Chama a API da OpenAI para análise.
 */
async function callOpenAI(apiKey, systemPrompt, userMessage) {
    const url = "https://api.openai.com/v1/chat/completions"

    const body = {
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 2048,
    }

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`OpenAI API Error: ${res.status} — ${err}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || "Sem resposta da IA"
}

/**
 * Analisa um checklist preenchido usando a IA configurada.
 * Inclui análise de fotos se houver.
 */
async function analyzeChecklist(config, checklist, respostas, photosPaths = []) {
    const { apiProvider } = config
    const aiKeys = config.aiKeys || []
    
    // Preferência 1: Chaves específicas deste checklist (busca pelo apiKeyId). Preferência 2: Pool global
    let keys = []
    
    if (checklist.apiKeyId) {
        const found = aiKeys.find(k => k.id === checklist.apiKeyId)
        if (found) keys = [found.key]
    }
    
    if (keys.length === 0) {
        keys = aiKeys.map(k => k.key)
    }

    if (keys.length === 0) throw new Error("Nenhuma chave de IA configurada! Adicione em 'Chaves Inteligentes'")
    const selectedKey = keys[Math.floor(Math.random() * keys.length)]
    console.log(`[IA] Usando chave ${selectedKey.substring(0, 8)}... (${keys.length} disponíveis neste contexto)`)

    const systemPrompt = generateSystemPrompt(
        checklist.descricao,
        {
            nomeChecklist: checklist.nome,
            tipoCozinha: config.tipoCozinha || "restaurante",
            itens: checklist.items,
        }
    )

    const userMessage = buildUserMessage(checklist, respostas)

    // Se tem fotos, usar API de visão
    if (photosPaths.length > 0) {
        const fs = require("fs")
        const path = require("path")

        // Montar as imagens em base64
        const images = []
        for (const p of photosPaths) {
            try {
                const fullPath = typeof p === "string" ? p : p.path
                if (fs.existsSync(fullPath)) {
                    const ext = path.extname(fullPath).toLowerCase().replace(".", "")
                    const mimeType = ext === "png" ? "image/png" : "image/jpeg"
                    const base64 = fs.readFileSync(fullPath).toString("base64")
                    images.push({ base64, mimeType, label: p.label || path.basename(fullPath), itemId: p.itemId })
                }
            } catch (e) { console.log("Erro lendo foto:", e.message) }
        }

        if (images.length > 0) {
            let specificPhotoInstructions = ""
            for (let i = 0; i < images.length; i++) {
                if (images[i].itemId) {
                    const item = (checklist.items || []).find(it => it.id === images[i].itemId)
                    if (item && item.prompt) {
                        specificPhotoInstructions += `- Foto ${i+1} ("${item.texto}"): ${item.prompt}\n`
                    }
                }
            }

            const photoPrompt = systemPrompt + `\n\nALÉM DAS RESPOSTAS, ANALISE AS ${images.length} FOTO(S) ENVIADAS.
Para cada foto:
- Identifique o que está na imagem
- Avalie organização, limpeza, conformidade
- Aponte problemas visuais (sujeira, desordem, equipamento danificado, etc.)
- Inclua a análise das fotos no score final

${specificPhotoInstructions ? `📌 ATENÇÃO ÀS INSTRUÇÕES ESPECÍFICAS CONFIGURADAS:\n${specificPhotoInstructions}\n` : ''}
FORMATO ADICIONAL PARA FOTOS:
📷 **ANÁLISE DAS FOTOS:**
- Foto 1: [o que foi observado]
- Foto 2: [o que foi observado]
...`

            if (apiProvider === "openai") {
                return callOpenAIVision(selectedKey, photoPrompt, userMessage, images)
            } else {
                return callGeminiVision(selectedKey, photoPrompt, userMessage, images)
            }
        }
    }

    // Sem fotos — análise só de texto
    if (apiProvider === "openai") {
        return callOpenAI(selectedKey, systemPrompt, userMessage)
    } else {
        return callGemini(selectedKey, systemPrompt, userMessage)
    }
}

/**
 * Chama Gemini com imagens (visão computacional).
 */
async function callGeminiVision(apiKey, systemPrompt, userMessage, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    const parts = [{ text: userMessage }]
    for (const img of images) {
        parts.push({
            inline_data: { mime_type: img.mimeType, data: img.base64 }
        })
        parts.push({ text: `[Foto: ${img.label}]` })
    }

    const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 3000 },
    }

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Gemini Vision Error: ${res.status} — ${err}`)
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta da IA"
}

/**
 * Chama OpenAI com imagens (GPT-4 Vision).
 */
async function callOpenAIVision(apiKey, systemPrompt, userMessage, images) {
    const url = "https://api.openai.com/v1/chat/completions"

    const content = [{ type: "text", text: userMessage }]
    for (const img of images) {
        content.push({
            type: "image_url",
            image_url: { url: `data:${img.mimeType};base64,${img.base64}`, detail: "low" },
        })
    }

    const body = {
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content },
        ],
        temperature: 0.3,
        max_tokens: 3000,
    }

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`OpenAI Vision Error: ${res.status} — ${err}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || "Sem resposta da IA"
}

/**
 * Extrai a nota numérica do feedback da IA.
 */
function extractScore(feedback) {
    const match = feedback.match(/(?:nota|score|avaliação)[:\s]*(\d+(?:[.,]\d+)?)\s*\/\s*10/i)
    if (match) return parseFloat(match[1].replace(",", "."))
    const fallback = feedback.match(/(\d+(?:[.,]\d+)?)\s*\/\s*10/)
    if (fallback) return parseFloat(fallback[1].replace(",", "."))
    return null
}

module.exports = {
    generateSystemPrompt,
    buildUserMessage,
    callGemini,
    callOpenAI,
    callGeminiVision,
    callOpenAIVision,
    analyzeChecklist,
    extractScore,
}
