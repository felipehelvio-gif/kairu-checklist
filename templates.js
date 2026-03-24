// ═══════════════════════════════════════════════════════════════
//  KAIRU CHECKLIST — Templates Pré-Prontos
//  Templates profissionais baseados em normas ANVISA/APPCC
//  O restaurante pode usar como está ou personalizar.
// ═══════════════════════════════════════════════════════════════

const TEMPLATES = [

    // ══════════════════════════════════════
    //  🌅 ABERTURA DA LOJA
    // ══════════════════════════════════════
    {
        id: "abertura",
        nome: "🌅 Abertura da Loja",
        descricao: "Verificações essenciais antes de abrir o restaurante. Garante que tudo está pronto para a operação.",
        categoria: "operacional",
        frequencia: "diario",
        icone: "🌅",
        items: [
            { id: "ab01", texto: "Luzes e equipamentos ligados", tipo: "checkbox", obrigatorio: true },
            { id: "ab02", texto: "Ar condicionado/ventilação funcionando", tipo: "checkbox", obrigatorio: true },
            { id: "ab03", texto: "Temperatura da câmara fria", tipo: "temperatura", obrigatorio: true, unidade: "°C", min: -18, max: 5 },
            { id: "ab04", texto: "Temperatura do balcão refrigerado", tipo: "temperatura", obrigatorio: true, unidade: "°C", min: 0, max: 7 },
            { id: "ab05", texto: "Estoque mínimo verificado", tipo: "checkbox", obrigatorio: true },
            { id: "ab06", texto: "Área de atendimento limpa e organizada", tipo: "checkbox", obrigatorio: true },
            { id: "ab07", texto: "Banheiros limpos e abastecidos", tipo: "checkbox", obrigatorio: true },
            { id: "ab08", texto: "Caixa conferido e aberto", tipo: "checkbox", obrigatorio: true },
            { id: "ab09", texto: "Cardápio/preços atualizados", tipo: "checkbox", obrigatorio: false },
            { id: "ab10", texto: "Funcionários uniformizados e com EPI", tipo: "checkbox", obrigatorio: true },
            { id: "ab11", texto: "Observações da abertura", tipo: "texto", obrigatorio: false },
        ],
        systemPrompt: `Você é um auditor de operações de restaurante especialista em food service.
Analise o checklist de ABERTURA da loja preenchido pelo funcionário.

REGRAS DE ANÁLISE:
- Temperaturas da câmara fria devem estar entre -18°C e -5°C. Acima disso é CRÍTICO.
- Temperaturas do balcão refrigerado devem estar entre 0°C e 7°C. Acima de 10°C é CRÍTICO.
- Itens obrigatórios não marcados são problemas que precisam de ação imediata.
- Dê uma nota de 0 a 10 para a abertura.
- Se houver itens críticos, destaque em VERMELHO.

FORMATO DA RESPOSTA:
📊 Nota: X/10
✅ Pontos positivos (liste)
⚠️ Pontos de atenção (liste)
🚨 Itens críticos (se houver)
💡 Recomendações`
    },

    // ══════════════════════════════════════
    //  🌙 FECHAMENTO DA LOJA
    // ══════════════════════════════════════
    {
        id: "fechamento",
        nome: "🌙 Fechamento da Loja",
        descricao: "Verificações no fim do expediente. Garante segurança, higiene e organização para o próximo dia.",
        categoria: "operacional",
        frequencia: "diario",
        icone: "🌙",
        items: [
            { id: "fe01", texto: "Cozinha limpa e higienizada", tipo: "checkbox", obrigatorio: true },
            { id: "fe02", texto: "Equipamentos desligados (fogão, forno, chapa)", tipo: "checkbox", obrigatorio: true },
            { id: "fe03", texto: "Alimentos armazenados e etiquetados corretamente", tipo: "checkbox", obrigatorio: true },
            { id: "fe04", texto: "Temperatura final da câmara fria", tipo: "temperatura", obrigatorio: true, unidade: "°C", min: -18, max: 5 },
            { id: "fe05", texto: "Lixeiras esvaziadas", tipo: "checkbox", obrigatorio: true },
            { id: "fe06", texto: "Piso lavado", tipo: "checkbox", obrigatorio: true },
            { id: "fe07", texto: "Portas e janelas trancadas", tipo: "checkbox", obrigatorio: true },
            { id: "fe08", texto: "Gás desligado", tipo: "checkbox", obrigatorio: true },
            { id: "fe09", texto: "Caixa fechado e conferido", tipo: "checkbox", obrigatorio: true },
            { id: "fe10", texto: "Alarme ativado", tipo: "checkbox", obrigatorio: false },
            { id: "fe11", texto: "Valor do caixa do dia", tipo: "numero", obrigatorio: false, prefixo: "R$" },
            { id: "fe12", texto: "Observações do fechamento", tipo: "texto", obrigatorio: false },
        ],
        systemPrompt: `Você é um auditor de operações de restaurante.
Analise o checklist de FECHAMENTO da loja.

REGRAS:
- Segurança é PRIORIDADE: gás, portas, alarme. Itens não marcados são CRÍTICOS.
- Temperatura da câmara fria no fechamento deve estar adequada.
- Alimentos não etiquetados = risco ANVISA.
- Dê nota de 0 a 10.

FORMATO:
📊 Nota: X/10
✅ Feito corretamente
⚠️ Atenção necessária
🚨 Riscos de segurança
💡 Recomendações para amanhã`
    },

    // ══════════════════════════════════════
    //  🧹 LIMPEZA E HIGIENE
    // ══════════════════════════════════════
    {
        id: "limpeza",
        nome: "🧹 Limpeza e Higiene",
        descricao: "Controle de limpeza de todas as áreas. Baseado nas boas práticas da ANVISA RDC 216.",
        categoria: "higiene",
        frequencia: "diario",
        icone: "🧹",
        items: [
            { id: "li01", texto: "Bancadas e superfícies higienizadas", tipo: "checkbox", obrigatorio: true },
            { id: "li02", texto: "Utensílios lavados e guardados", tipo: "checkbox", obrigatorio: true },
            { id: "li03", texto: "Piso da cozinha limpo (sem gordura)", tipo: "checkbox", obrigatorio: true },
            { id: "li04", texto: "Coifas e exaustores limpos", tipo: "checkbox", obrigatorio: false },
            { id: "li05", texto: "Áreas de armazenamento organizadas", tipo: "checkbox", obrigatorio: true },
            { id: "li06", texto: "Lixeiras limpas e com tampa", tipo: "checkbox", obrigatorio: true },
            { id: "li07", texto: "Banheiros limpos e abastecidos", tipo: "checkbox", obrigatorio: true },
            { id: "li08", texto: "Sabonete e papel toalha repostos", tipo: "checkbox", obrigatorio: true },
            { id: "li09", texto: "Área externa/calçada varrida", tipo: "checkbox", obrigatorio: false },
            { id: "li10", texto: "Pragas ou vestígios encontrados?", tipo: "checkbox", obrigatorio: true },
            { id: "li11", texto: "Produtos de limpeza dentro da validade", tipo: "checkbox", obrigatorio: false },
            { id: "li12", texto: "Foto da cozinha após limpeza", tipo: "foto", obrigatorio: false },
        ],
        systemPrompt: `Você é um consultor de segurança alimentar e higiene baseado na ANVISA RDC 216.
Analise o checklist de LIMPEZA E HIGIENE.

REGRAS CRÍTICAS:
- Presença de pragas = INTERDIÇÃO. Nota máxima 3/10.
- Superfícies não higienizadas = risco de contaminação cruzada.
- Lixeiras sem tampa = atrai pragas.
- Produtos de limpeza vencidos = ineficácia + risco.

FORMATO:
📊 Nota de higiene: X/10
🏥 Conformidade ANVISA: (conforme/parcial/não conforme)
✅ Itens ok
⚠️ Precisa melhorar
🚨 Crítico (risco sanitário)
💡 Dicas de higiene`
    },

    // ══════════════════════════════════════
    //  🌡️ CONTROLE DE TEMPERATURA
    // ══════════════════════════════════════
    {
        id: "temperatura",
        nome: "🌡️ Controle de Temperatura",
        descricao: "Registro obrigatório de temperaturas. Exigido pela vigilância sanitária (APPCC).",
        categoria: "seguranca_alimentar",
        frequencia: "diario",
        icone: "🌡️",
        items: [
            { id: "te01", texto: "Câmara fria — Congelados", tipo: "temperatura", obrigatorio: true, unidade: "°C", min: -18, max: -12 },
            { id: "te02", texto: "Câmara fria — Resfriados", tipo: "temperatura", obrigatorio: true, unidade: "°C", min: 0, max: 5 },
            { id: "te03", texto: "Balcão refrigerado", tipo: "temperatura", obrigatorio: true, unidade: "°C", min: 0, max: 7 },
            { id: "te04", texto: "Freezer vertical", tipo: "temperatura", obrigatorio: false, unidade: "°C", min: -18, max: -12 },
            { id: "te05", texto: "Geladeira de bebidas", tipo: "temperatura", obrigatorio: false, unidade: "°C", min: 2, max: 8 },
            { id: "te06", texto: "Pass-through quente", tipo: "temperatura", obrigatorio: false, unidade: "°C", min: 60, max: 100 },
            { id: "te07", texto: "Alimento pronto para servir (amostra)", tipo: "temperatura", obrigatorio: false, unidade: "°C", min: 60, max: 100 },
            { id: "te08", texto: "Equipamento com defeito?", tipo: "checkbox", obrigatorio: true },
            { id: "te09", texto: "Qual equipamento com problema?", tipo: "texto", obrigatorio: false },
        ],
        systemPrompt: `Você é um técnico em APPCC e segurança alimentar.
Analise os REGISTROS DE TEMPERATURA do restaurante.

REGRAS RÍGIDAS (ANVISA):
- Congelados: DEVEM estar entre -18°C e -12°C. Acima = PERIGO.
- Resfriados: DEVEM estar entre 0°C e 5°C. Acima de 7°C = CRÍTICO.
- Balcão refrigerado: Até 7°C é aceitável. Acima de 10°C = DESCARTE.
- Alimentos quentes: MÍNIMO 60°C. Abaixo = zona de perigo bacteriano.
- Se houver equipamento com defeito, isso é URGENTE.

FORMATO:
📊 Conformidade: X/10
🌡️ Status por equipamento:
  - [nome]: [temp]°C → ✅ OK / ⚠️ Atenção / 🚨 CRÍTICO
📋 Ação necessária (se houver)
⏰ Prazo para correção`
    },

    // ══════════════════════════════════════
    //  📦 RECEBIMENTO DE MERCADORIAS
    // ══════════════════════════════════════
    {
        id: "recebimento",
        nome: "📦 Recebimento de Mercadorias",
        descricao: "Verificação de qualidade e temperatura no ato do recebimento. Previne problemas antes de guardar.",
        categoria: "seguranca_alimentar",
        frequencia: "conforme_necessidade",
        icone: "📦",
        items: [
            { id: "rc01", texto: "Fornecedor", tipo: "texto", obrigatorio: true },
            { id: "rc02", texto: "Nota fiscal conferida", tipo: "checkbox", obrigatorio: true },
            { id: "rc03", texto: "Embalagens íntegras (sem amassados, furos)", tipo: "checkbox", obrigatorio: true },
            { id: "rc04", texto: "Temperatura dos refrigerados na entrega", tipo: "temperatura", obrigatorio: true, unidade: "°C", min: 0, max: 7 },
            { id: "rc05", texto: "Temperatura dos congelados na entrega", tipo: "temperatura", obrigatorio: false, unidade: "°C", min: -18, max: -8 },
            { id: "rc06", texto: "Validade dos produtos verificada", tipo: "checkbox", obrigatorio: true },
            { id: "rc07", texto: "Produto com aparência/odor inadequado?", tipo: "checkbox", obrigatorio: true },
            { id: "rc08", texto: "Veículo de entrega em boas condições?", tipo: "checkbox", obrigatorio: false },
            { id: "rc09", texto: "Produtos armazenados imediatamente após conferência", tipo: "checkbox", obrigatorio: true },
            { id: "rc10", texto: "Observações / Produtos devolvidos", tipo: "texto", obrigatorio: false },
        ],
        systemPrompt: `Você é um especialista em controle de qualidade de alimentos e recebimento de mercadorias.
Analise o checklist de RECEBIMENTO DE MERCADORIA.

REGRAS:
- Temperatura de refrigerados na entrega: máximo 7°C. Acima = DEVOLVER.
- Temperatura de congelados: máximo -8°C. Se parcialmente descongelado = DEVOLVER.
- Embalagens danificadas = NÃO ACEITAR.
- Sem nota fiscal = NÃO ACEITAR.
- Produto com odor/aparência ruim = DEVOLVER E REGISTRAR.

FORMATO:
📊 Avaliação: X/10
📦 Fornecedor: [nome]
✅ Recebimento ok
⚠️ Pontos de atenção
🚨 Produtos para devolver
💡 Orientações`
    },

    // ══════════════════════════════════════
    //  👤 APRESENTAÇÃO PESSOAL
    // ══════════════════════════════════════
    {
        id: "apresentacao_pessoal",
        nome: "👤 Apresentação Pessoal",
        descricao: "Verificação de higiene e apresentação da equipe. Obrigatório pela ANVISA para manipuladores de alimentos.",
        categoria: "higiene",
        frequencia: "diario",
        icone: "👤",
        items: [
            { id: "ap01", texto: "Uniforme limpo e completo", tipo: "checkbox", obrigatorio: true },
            { id: "ap02", texto: "Touca/rede de cabelo", tipo: "checkbox", obrigatorio: true },
            { id: "ap03", texto: "Unhas curtas, limpas e sem esmalte", tipo: "checkbox", obrigatorio: true },
            { id: "ap04", texto: "Sem adornos (anéis, pulseiras, relógio)", tipo: "checkbox", obrigatorio: true },
            { id: "ap05", texto: "Barba feita ou protegida", tipo: "checkbox", obrigatorio: false },
            { id: "ap06", texto: "Mãos lavadas corretamente", tipo: "checkbox", obrigatorio: true },
            { id: "ap07", texto: "Sem ferimentos expostos nas mãos", tipo: "checkbox", obrigatorio: true },
            { id: "ap08", texto: "Funcionário com sintomas de doença?", tipo: "checkbox", obrigatorio: true },
            { id: "ap09", texto: "Qual funcionário com problema?", tipo: "texto", obrigatorio: false },
        ],
        systemPrompt: `Você é um auditor de boas práticas de manipulação de alimentos (ANVISA RDC 216).
Analise o checklist de APRESENTAÇÃO PESSOAL.

REGRAS:
- Funcionário com doença transmissível NÃO PODE manipular alimentos. AFASTAR imediatamente.
- Ferimentos nas mãos: cobrir com luva OU afastar da manipulação.
- Adornos são PROIBIDOS na área de produção.
- Touca é OBRIGATÓRIA para todos na cozinha.

FORMATO:
📊 Nota: X/10
👤 Equipe: (apta/parcialmente apta/inapta)
✅ Conforme
⚠️ Corrigir
🚨 Afastar (se aplicável)
💡 Orientações de higiene pessoal`
    },

    // ══════════════════════════════════════
    //  ⚡ CHECKLIST RÁPIDO DE DELIVERY
    // ══════════════════════════════════════
    {
        id: "delivery",
        nome: "⚡ Checklist de Delivery",
        descricao: "Verificação rápida antes de cada saída de delivery. Garante qualidade na entrega.",
        categoria: "operacional",
        frequencia: "por_pedido",
        icone: "⚡",
        items: [
            { id: "dl01", texto: "Pedido conferido com o ticket", tipo: "checkbox", obrigatorio: true },
            { id: "dl02", texto: "Todos os itens incluídos", tipo: "checkbox", obrigatorio: true },
            { id: "dl03", texto: "Embalagens lacradas corretamente", tipo: "checkbox", obrigatorio: true },
            { id: "dl04", texto: "Talheres/guardanapos incluídos", tipo: "checkbox", obrigatorio: false },
            { id: "dl05", texto: "Molhos/acompanhamentos separados", tipo: "checkbox", obrigatorio: false },
            { id: "dl06", texto: "Bag térmica em boas condições", tipo: "checkbox", obrigatorio: true },
            { id: "dl07", texto: "Nota fiscal/cupom na sacola", tipo: "checkbox", obrigatorio: true },
            { id: "dl08", texto: "Número do pedido", tipo: "texto", obrigatorio: true },
        ],
        systemPrompt: `Você é um gestor de qualidade de delivery.
Analise o checklist de SAÍDA DE DELIVERY.

Itens não conferidos aumentam reclamação e cancelamento no iFood.
Pedido sem nota fiscal = multa.
Embalagem sem lacre = risco de reclamação por adulteração.

FORMATO:
📊 Nota: X/10
📦 Pedido: [número]
✅ Pronto para sair
⚠️ Verificar antes
🚨 NÃO ENVIAR sem corrigir`
    },

    // ══════════════════════════════════════
    //  🔧 MANUTENÇÃO DE EQUIPAMENTOS
    // ══════════════════════════════════════
    {
        id: "manutencao",
        nome: "🔧 Manutenção Preventiva",
        descricao: "Checklist semanal/mensal de equipamentos. Previne quebras e paradas não programadas.",
        categoria: "manutencao",
        frequencia: "semanal",
        icone: "🔧",
        items: [
            { id: "mn01", texto: "Fogão — chamas regulares, sem vazamento", tipo: "checkbox", obrigatorio: true },
            { id: "mn02", texto: "Forno — temperatura calibrada", tipo: "checkbox", obrigatorio: true },
            { id: "mn03", texto: "Geladeiras — borrachas em bom estado", tipo: "checkbox", obrigatorio: true },
            { id: "mn04", texto: "Freezer — sem excesso de gelo", tipo: "checkbox", obrigatorio: true },
            { id: "mn05", texto: "Coifa — filtros limpos", tipo: "checkbox", obrigatorio: true },
            { id: "mn06", texto: "Máquina de lavar louça — funcionando", tipo: "checkbox", obrigatorio: false },
            { id: "mn07", texto: "Extintores — dentro da validade", tipo: "checkbox", obrigatorio: true },
            { id: "mn08", texto: "Quadro elétrico — sem fios expostos", tipo: "checkbox", obrigatorio: true },
            { id: "mn09", texto: "Equipamento que precisa de reparo", tipo: "texto", obrigatorio: false },
            { id: "mn10", texto: "Prioridade do reparo", tipo: "selecao", obrigatorio: false, opcoes: ["Baixa", "Média", "Alta", "Urgente"] },
        ],
        systemPrompt: `Você é um técnico de manutenção preventiva de restaurantes.
Analise o checklist de MANUTENÇÃO PREVENTIVA.

REGRAS:
- Vazamento de gás = PARAR TUDO. Chamar técnico IMEDIATO.
- Extintores vencidos = MULTA da vigilância sanitária e bombeiros.
- Fios expostos = RISCO DE INCÊNDIO.
- Excesso de gelo no freezer = compressor forçando = quebra iminente.

FORMATO:
📊 Estado geral: X/10
✅ Equipamentos ok
⚠️ Manutenção necessária
🚨 URGENTE (risco de segurança)
🔧 Agendar técnico para: [lista]
💰 Estimativa de impacto se não corrigir`
    },
]

// Categorias disponíveis
const CATEGORIAS = [
    { id: "operacional", nome: "Operacional", icone: "⚙️" },
    { id: "higiene", nome: "Higiene", icone: "🧹" },
    { id: "seguranca_alimentar", nome: "Segurança Alimentar", icone: "🛡️" },
    { id: "manutencao", nome: "Manutenção", icone: "🔧" },
    { id: "atendimento", nome: "Atendimento", icone: "😊" },
    { id: "financeiro", nome: "Financeiro", icone: "💰" },
    { id: "custom", nome: "Personalizado", icone: "✏️" },
]

// Frequências
const FREQUENCIAS = [
    { id: "diario", nome: "Diário" },
    { id: "semanal", nome: "Semanal" },
    { id: "mensal", nome: "Mensal" },
    { id: "por_pedido", nome: "Por Pedido" },
    { id: "conforme_necessidade", nome: "Conforme Necessidade" },
]

// Tipos de campo
const TIPOS_CAMPO = [
    { id: "checkbox", nome: "Sim/Não", icone: "☑️" },
    { id: "texto", nome: "Texto livre", icone: "📝" },
    { id: "numero", nome: "Número", icone: "🔢" },
    { id: "temperatura", nome: "Temperatura (°C)", icone: "🌡️" },
    { id: "foto", nome: "Foto", icone: "📷" },
    { id: "selecao", nome: "Seleção", icone: "📋" },
]

module.exports = { TEMPLATES, CATEGORIAS, FREQUENCIAS, TIPOS_CAMPO }
