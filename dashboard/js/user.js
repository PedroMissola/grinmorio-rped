// Token: tenta sessionStorage primeiro, depois localStorage como fallback.
// Isso resolve ambientes onde sessionStorage é resetado entre páginas.
function getToken() {
    return sessionStorage.getItem('dashboardToken')
        || localStorage.getItem('dashboardToken')
        || '';
}

function salvarToken(token) {
    sessionStorage.setItem('dashboardToken', token);
    localStorage.setItem('dashboardToken', token);
}

function limparToken() {
    sessionStorage.removeItem('dashboardToken');
    localStorage.removeItem('dashboardToken');
}

async function apiFetch(url) {
    const token = getToken();

    if (!token) {
        window.location.replace('/dashboard/login.html');
        throw new Error('Sem token.');
    }

    const response = await fetch(url, {
        headers: { 'x-dashboard-token': token }
    });

    if (response.status === 401) {
        limparToken();
        window.location.replace('/dashboard/login.html');
        throw new Error('Sessão expirada.');
    }

    return response.json();
}

document.addEventListener('DOMContentLoaded', () => {
    const userId = window.location.pathname.split('/').pop();
    if (!userId || !/^\d+$/.test(userId)) {
        mostrarErro('ID de usuário inválido na URL.');
        return;
    }
    carregarDetalhesUsuario(userId);
});

async function carregarDetalhesUsuario(userId) {
    const loading        = document.getElementById('loadingMsg');
    const rpedMetrics    = document.getElementById('rped-metrics');
    const guildSelection = document.getElementById('guild-selection');
    const guildButtons   = document.getElementById('guild-buttons');
    const mainTitle      = document.getElementById('main-title');

    try {
        loading.style.display = 'block';

        const result = await apiFetch(`/dashboard/api/users/${userId}`);

        loading.style.display = 'none';

        if (!result.success) {
            mostrarErro(result.message || 'Erro ao carregar dados do usuário.');
            return;
        }

        const { user, guilds } = result.data;

        mainTitle.textContent = `PAINEL DE ${user.userId}`;

        // Agrega totais de todas as guildas para exibir um resumo global real
        const totalRolagens = guilds.reduce((sum, g) => sum + (g.memberData?.dadosRolados ?? 0), 0);
        const totalCriticos = guilds.reduce((sum, g) => sum + (g.memberData?.sucessosCriticos ?? 0), 0);
        const totalFalhas   = guilds.reduce((sum, g) => sum + (g.memberData?.falhasCriticas ?? 0), 0);

        rpedMetrics.innerHTML = `
            <h3>Métricas Globais (RPED)</h3>
            <table class="users-table">
                <thead><tr>
                    <th>Permissão</th>
                    <th>Comandos Usados</th>
                    <th>Total de Rolagens</th>
                    <th>Críticos</th>
                    <th>Falhas Críticas</th>
                </tr></thead>
                <tbody><tr>
                    <td>${user.permissaoBot ?? 'jogador'}</td>
                    <td>${user.comandosUsados ?? 0}</td>
                    <td>${totalRolagens}</td>
                    <td style="color:var(--green);">${totalCriticos}</td>
                    <td style="color:var(--red);">${totalFalhas}</td>
                </tr></tbody>
            </table>
        `;
        rpedMetrics.style.display = 'block';

        if (guilds.length === 0) {
            guildSelection.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px;">Este usuário não foi encontrado em nenhuma guilda.</p>';
            guildSelection.style.display = 'block';
            return;
        }

        guildButtons.innerHTML = guilds.map(guild => `
            <button
                class="guild-button"
                data-guild-name="${guild.guildName}"
                data-member='${JSON.stringify(guild.memberData ?? null)}'
                onclick="mostrarMetricasGuilda(this)"
            >
                <span class="guild-name">${guild.guildName}</span>
                <span class="guild-id">${guild.guildId}</span>
            </button>
        `).join('');

        guildSelection.style.display = 'block';

        // Se só tem uma guilda, abre automaticamente
        if (guilds.length === 1) {
            mostrarMetricasGuilda(document.querySelector('.guild-button'));
        }

    } catch (error) {
        if (error.message === 'Sessão expirada.' || error.message === 'Sem token.') return;
        console.error(error);
        loading.style.display = 'none';
        mostrarErro(error.message || 'Erro ao conectar com a base de dados.');
    }
}

function mostrarMetricasGuilda(buttonEl) {
    const guildMetrics = document.getElementById('guild-metrics');

    document.querySelectorAll('.guild-button').forEach(btn => btn.classList.remove('active'));
    buttonEl.classList.add('active');

    const guildName  = buttonEl.dataset.guildName;
    const memberData = JSON.parse(buttonEl.dataset.member);

    if (!memberData) {
        guildMetrics.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px;">Dados de membro não encontrados para esta guilda.</p>';
        guildMetrics.style.display = 'block';
        guildMetrics.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    const sorte = memberData.mediaSorte != null && memberData.mediaSorte <= 1
        ? (memberData.mediaSorte * 20).toFixed(2)   // normalizado 0-1 → exibe em escala 0-20
        : (memberData.mediaSorte ?? 10.5).toFixed(3);

    guildMetrics.innerHTML = `
        <h3>Métricas na Guilda: ${guildName}</h3>
        <table class="users-table">
            <thead><tr>
                <th>Dados Rolados</th>
                <th>Média de Sorte</th>
                <th>Sucessos Críticos</th>
                <th>Falhas Críticas</th>
            </tr></thead>
            <tbody><tr>
                <td>${memberData.dadosRolados ?? 0}</td>
                <td style="color:var(--gold);">${sorte}</td>
                <td style="color:var(--green);">${memberData.sucessosCriticos ?? 0}</td>
                <td style="color:var(--red);">${memberData.falhasCriticas ?? 0}</td>
            </tr></tbody>
        </table>
    `;
    guildMetrics.style.display = 'block';
    guildMetrics.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mostrarErro(mensagem) {
    const el = document.getElementById('rped-metrics');
    el.innerHTML = `<div style="color:var(--red);padding:20px;text-align:center;">${mensagem}</div>`;
    el.style.display = 'block';
    document.getElementById('loadingMsg').style.display = 'none';
}