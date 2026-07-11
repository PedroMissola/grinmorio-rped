function getToken() {
    return sessionStorage.getItem('dashboardToken')
        || localStorage.getItem('dashboardToken')
        || '';
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

const state = { currentPage: 1, totalPages: 1 };

document.addEventListener('DOMContentLoaded', () => carregarUsuarios(1));

async function carregarUsuarios(page = 1) {
    const tbody = document.getElementById('usersTableBody');
    const loading = document.getElementById('loadingMsg');
    const container = document.getElementById('usersTableContainer');
    const controls = document.getElementById('searchControls');
    const thead = document.getElementById('tableHeaders');
    const pagination = document.getElementById('paginationControls');

    try {
        document.getElementById('guildIdInput').value = '';
        tbody.innerHTML = '';
        container.style.display = 'none';
        pagination.style.display = 'none';
        loading.style.display = 'block';
        loading.innerHTML = '<span class="spinner"></span> Carregando registros do grimório...';

        const result = await apiFetch(`/dashboard/api/users?page=${page}`);

        if (!result.success) {
            loading.innerHTML = `<div style="color:var(--red);">Erro: ${result.message}</div>`;
            return;
        }

        state.currentPage = result.pagination.page;
        state.totalPages = result.pagination.totalPages;

        loading.style.display = 'none';
        controls.style.display = 'flex';
        container.style.display = 'block';

        thead.innerHTML = `
            <th>ID do Usuário</th>
            <th>Permissão</th>
            <th>Comandos</th>
            <th>Sorte Global</th>
            <th>Data de Entrada</th>
            <th>Ações</th>
        `;

        if (result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted);">Nenhum usuário encontrado.</td></tr>';
            return;
        }

        result.data.forEach(user => {
            const tr = document.createElement('tr');
            const permissao = user.permissaoBot || 'normal';
            const isEspecial = permissao === 'mestre' || permissao === 'admin';

            const permBadge = isEspecial
                ? `<span class="badge on"><span class="dot"></span>${permissao.toUpperCase()}</span>`
                : `<span class="badge neutral"><span class="dot"></span>NORMAL</span>`;

            const date = user.createdAt
                ? new Date(user.createdAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'Desconhecido';

            const sorte = user.mediaSorteGlobal !== undefined ? user.mediaSorteGlobal.toFixed(3) : 'N/A';
            const comandos = user.comandosUsados !== undefined ? user.comandosUsados : 0;

            tr.innerHTML = `
                <td style="font-family:var(--mono);">${user.userId}</td>
                <td>${permBadge}</td>
                <td>${comandos}</td>
                <td style="color:var(--gold);">${sorte}</td>
                <td style="color:var(--muted);">${date}</td>
                <td><a href="/dashboard/user/${user.userId}" class="btn-small">Ver</a></td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination();

    } catch (error) {
        if (error.message === 'Sessão expirada.') return;
        console.error(error);
        loading.style.display = 'block';
        loading.innerHTML = `<div style="color:var(--red);">${error.message || 'Erro ao conectar com a base de dados.'}</div>`;
    }
}

function carregarTodosUsuarios() {
    carregarUsuarios(1);
}

function renderPagination() {
    const pagination = document.getElementById('paginationControls');
    if (state.totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';
    pagination.innerHTML = `
        <button class="secondary" onclick="carregarUsuarios(${state.currentPage - 1})"
            ${state.currentPage <= 1 ? 'disabled' : ''}>« Anterior</button>
        <span style="color:var(--muted);font-size:0.8rem;align-self:center;">
            Página ${state.currentPage} de ${state.totalPages}
        </span>
        <button class="secondary" onclick="carregarUsuarios(${state.currentPage + 1})"
            ${state.currentPage >= state.totalPages ? 'disabled' : ''}>Próxima »</button>
    `;
}

async function buscarGuilda() {
    const guildId = document.getElementById('guildIdInput').value.trim();
    const tbody = document.getElementById('usersTableBody');
    const loading = document.getElementById('loadingMsg');
    const container = document.getElementById('usersTableContainer');
    const thead = document.getElementById('tableHeaders');
    const pagination = document.getElementById('paginationControls');

    if (!guildId) return;

    if (!/^\d+$/.test(guildId)) {
        const input = document.getElementById('guildIdInput');
        input.style.borderColor = 'var(--red)';
        setTimeout(() => { input.style.borderColor = ''; }, 2000);
        return;
    }

    try {
        tbody.innerHTML = '';
        container.style.display = 'none';
        pagination.style.display = 'none';
        loading.style.display = 'block';
        loading.innerHTML = '<span class="spinner"></span> Consultando registros da guilda...';

        const result = await apiFetch(`/dashboard/api/guilds/${guildId}/users`);

        loading.style.display = 'none';
        container.style.display = 'block';

        if (!result.success) {
            container.style.display = 'none';
            loading.style.display = 'block';
            loading.innerHTML = `<div style="color:var(--red);">${result.message || 'Erro ao carregar guilda.'}</div>`;
            return;
        }

        thead.innerHTML = `
            <th>ID do Usuário</th>
            <th>Dados Rolados</th>
            <th>Sorte Local</th>
            <th>Críticos (20)</th>
            <th>Falhas Críticas (1)</th>
        `;

        if (result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted);">A guilda não possui jogadores registrados.</td></tr>';
            return;
        }

        result.data.forEach(user => {
            const tr = document.createElement('tr');
            const sorte = user.mediaSorte !== undefined ? user.mediaSorte.toFixed(3) : 'N/A';

            tr.innerHTML = `
                <td style="font-family:var(--mono);">${user.userId}</td>
                <td>${user.dadosRolados || 0}</td>
                <td style="color:var(--gold);">${sorte}</td>
                <td style="color:var(--green);">${user.sucessosCriticos || 0}</td>
                <td style="color:var(--red);">${user.falhasCriticas || 0}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        if (error.message === 'Sessão expirada.') return;
        console.error(error);
        container.style.display = 'none';
        loading.style.display = 'block';
        loading.innerHTML = `<div style="color:var(--red);">${error.message || 'Erro ao consultar a base de dados.'}</div>`;
    }
}