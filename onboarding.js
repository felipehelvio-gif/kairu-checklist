// ═══════════════════════════════════════════════════════════════
//  Kairu Onboarding — Tela de primeiro uso
//  Coleta dados do cliente antes de usar o app
// ═══════════════════════════════════════════════════════════════

function showRegistrationModal() {
    // Se já existe, não cria de novo
    if (document.getElementById('kairu-onboarding-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'kairu-onboarding-overlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
        display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const ESTADOS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
    const TIPOS = ["Nordestina","Brasileira","Japonesa","Italiana","Pizzaria","Hamburgueria","Árabe","Mexicana","Chinesa","Self-service","Padaria/Confeitaria","Cafeteria","Bar/Pub","Marmitaria","Food Truck","Açaí/Sorvetes","Outro"];
    const CARGOS = ["Dono(a)","Sócio(a)","Gerente","Nutricionista","Cozinheiro(a)","Administrativo","Outro"];
    const FAIXAS = ["Até R$30 mil","R$30-100 mil","R$100-300 mil","R$300 mil - R$1M","Acima de R$1M"];
    const FUNC = ["1-5","6-15","16-30","31-50","50+"];
    const CANAIS = ["Instagram","Google","Indicação","iFood/Marketplace","YouTube","Outro"];
    const SISTEMAS = ["Nenhum / Planilha","BlueMe","KCMS","Saipos","Colibri","Sistema próprio","Outro"];

    function opt(arr) { return arr.map(v => `<option value="${v}">${v}</option>`).join(''); }

    overlay.innerHTML = `
        <div style="
            width: 90%; max-width: 560px; max-height: 90vh; overflow-y: auto;
            background: #1a1a1a; border: 1px solid #333; border-radius: 20px;
            padding: 36px 32px; color: #fff;
            animation: kairuSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
        ">
            <style>
                @keyframes kairuSlideIn { from { opacity:0; transform:translateY(20px) scale(0.96); } to { opacity:1; transform:none; } }
                .k-field { display:flex; flex-direction:column; gap:4px; }
                .k-field label { font-size:11px; font-weight:600; color:#888; letter-spacing:0.5px; text-transform:uppercase; }
                .k-field input, .k-field select {
                    width:100%; padding:10px 12px; background:#111; border:1px solid #333;
                    border-radius:8px; color:#fff; font-size:13px; outline:none;
                    transition: border-color 0.2s; font-family: inherit;
                }
                .k-field input:focus, .k-field select:focus { border-color:#FF6B2B; }
                .k-field select { cursor:pointer; }
                .k-row { display:flex; gap:12px; }
                .k-row > .k-field { flex:1; }
                .k-section { font-size:10px; font-weight:700; color:#FF6B2B; letter-spacing:2px; margin-top:20px; margin-bottom:8px; }
                .k-required::after { content:' *'; color:#FF453A; }
            </style>

            <div style="text-align:center; margin-bottom:28px;">
                <div style="font-size:40px; margin-bottom:8px;">🚀</div>
                <div style="font-size:22px; font-weight:800; letter-spacing:-0.5px;">Bem-vindo ao Kairu!</div>
                <div style="font-size:13px; color:#777; margin-top:6px; font-weight:300;">
                    Preencha seus dados pra personalizar sua experiência.<br>Leva menos de 1 minuto.
                </div>
            </div>

            <form id="kairu-onboarding-form" style="display:flex; flex-direction:column; gap:14px;">
                
                <div class="k-section">📋 SOBRE VOCÊ</div>
                
                <div class="k-row">
                    <div class="k-field">
                        <label class="k-required">Seu nome</label>
                        <input type="text" id="k-nome" placeholder="Ex: Felipe Severina" required>
                    </div>
                    <div class="k-field">
                        <label class="k-required">Seu cargo</label>
                        <select id="k-cargo" required>
                            <option value="">Selecione...</option>
                            ${opt(CARGOS)}
                        </select>
                    </div>
                </div>

                <div class="k-row">
                    <div class="k-field">
                        <label class="k-required">E-mail</label>
                        <input type="email" id="k-email" placeholder="seu@email.com" required>
                    </div>
                    <div class="k-field">
                        <label class="k-required">WhatsApp</label>
                        <input type="tel" id="k-telefone" placeholder="(21) 99999-9999" required>
                    </div>
                </div>

                <div class="k-section">🏪 SOBRE O RESTAURANTE</div>

                <div class="k-field">
                    <label class="k-required">Nome do estabelecimento</label>
                    <input type="text" id="k-empresa" placeholder="Ex: Restaurante da Severina" required>
                </div>

                <div class="k-row">
                    <div class="k-field">
                        <label>CNPJ</label>
                        <input type="text" id="k-cnpj" placeholder="00.000.000/0001-00">
                    </div>
                    <div class="k-field">
                        <label class="k-required">Tipo de cozinha</label>
                        <select id="k-tipo" required>
                            <option value="">Selecione...</option>
                            ${opt(TIPOS)}
                        </select>
                    </div>
                </div>

                <div class="k-row">
                    <div class="k-field" style="flex:2">
                        <label class="k-required">Cidade</label>
                        <input type="text" id="k-cidade" placeholder="Ex: Rio de Janeiro" required>
                    </div>
                    <div class="k-field" style="flex:1">
                        <label class="k-required">UF</label>
                        <select id="k-estado" required>
                            <option value="">UF</option>
                            ${opt(ESTADOS)}
                        </select>
                    </div>
                </div>

                <div class="k-section">📊 PERFIL DA OPERAÇÃO</div>

                <div class="k-row">
                    <div class="k-field">
                        <label>Quantas unidades?</label>
                        <select id="k-unidades">
                            <option value="1">1 unidade</option>
                            <option value="2-5">2 a 5</option>
                            <option value="6+">6 ou mais</option>
                        </select>
                    </div>
                    <div class="k-field">
                        <label>Funcionários</label>
                        <select id="k-func">
                            <option value="">Selecione...</option>
                            ${opt(FUNC)}
                        </select>
                    </div>
                </div>

                <div class="k-row">
                    <div class="k-field">
                        <label>Faturamento mensal</label>
                        <select id="k-faturamento">
                            <option value="">Prefiro não dizer</option>
                            ${opt(FAIXAS)}
                        </select>
                    </div>
                    <div class="k-field">
                        <label>Sistema atual</label>
                        <select id="k-sistema">
                            <option value="">Selecione...</option>
                            ${opt(SISTEMAS)}
                        </select>
                    </div>
                </div>

                <div class="k-row">
                    <div class="k-field">
                        <label>Usa iFood/Rappi?</label>
                        <select id="k-delivery">
                            <option value="">Selecione...</option>
                            <option value="ifood">Sim, iFood</option>
                            <option value="rappi">Sim, Rappi</option>
                            <option value="ambos">Sim, ambos</option>
                            <option value="outros">Outro marketplace</option>
                            <option value="nao">Não uso</option>
                        </select>
                    </div>
                    <div class="k-field">
                        <label>Como conheceu o Kairu?</label>
                        <select id="k-canal">
                            <option value="">Selecione...</option>
                            ${opt(CANAIS)}
                        </select>
                    </div>
                </div>

                <div style="margin-top:8px;">
                    <label style="display:flex; align-items:flex-start; gap:8px; cursor:pointer; font-size:12px; color:#aaa; line-height:1.5;">
                        <input type="checkbox" id="k-termos" required style="margin-top:3px; accent-color:#FF6B2B; width:16px; height:16px;">
                        <span>Aceito os <a href="https://kairulabs.com.br/termos" target="_blank" style="color:#FF6B2B;">Termos de Uso</a> e a <a href="https://kairulabs.com.br/privacidade" target="_blank" style="color:#FF6B2B;">Política de Privacidade</a></span>
                    </label>
                </div>

                <button type="submit" id="k-submit" style="
                    width:100%; padding:14px; margin-top:8px;
                    background: linear-gradient(135deg, #FF6B2B, #FF8F5A);
                    color:#fff; border:none; border-radius:12px;
                    font-size:15px; font-weight:700; cursor:pointer;
                    transition: opacity 0.2s;
                ">
                    Começar a usar 🚀
                </button>

                <div style="text-align:center; font-size:10px; color:#444; margin-top:4px;">
                    100% gratuito. Seus dados são usados apenas para melhorar o produto.
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('kairu-onboarding-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('k-submit');
        btn.textContent = 'Salvando...';
        btn.disabled = true;
        btn.style.opacity = '0.5';

        const data = {
            nomeResponsavel: document.getElementById('k-nome').value,
            cargo: document.getElementById('k-cargo').value,
            email: document.getElementById('k-email').value,
            telefone: document.getElementById('k-telefone').value,
            nomeEmpresa: document.getElementById('k-empresa').value,
            cnpj: document.getElementById('k-cnpj').value,
            tipoCozinha: document.getElementById('k-tipo').value,
            cidade: document.getElementById('k-cidade').value,
            estado: document.getElementById('k-estado').value,
            unidades: document.getElementById('k-unidades').value,
            funcionarios: document.getElementById('k-func').value,
            faturamento: document.getElementById('k-faturamento').value,
            sistemaAtual: document.getElementById('k-sistema').value,
            delivery: document.getElementById('k-delivery').value,
            canalAquisicao: document.getElementById('k-canal').value,
            termosAceitos: document.getElementById('k-termos').checked,
        };

        try {
            if (window.electronAPI && window.electronAPI.saveRegistration) {
                await window.electronAPI.saveRegistration(data);
            }
        } catch (err) {
            console.error('Erro ao salvar registro:', err);
        }

        // Fechar modal com animação
        overlay.style.transition = 'opacity 0.3s';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    });
}
