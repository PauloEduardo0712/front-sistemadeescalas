/* =============================================
   ADMIN.JS - Painel Administrativo
   ============================================= */

function toggleMobileMenu(forceOpen) {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("mobileNavBackdrop");
  const button = document.getElementById("mobileMenuToggle");
  if (!sidebar || !backdrop || !button || !isMobileViewport()) return;

  const abrir = typeof forceOpen === "boolean"
    ? forceOpen
    : !sidebar.classList.contains("mobile-open");

  sidebar.classList.toggle("mobile-open", abrir);
  backdrop.classList.toggle("hidden", !abrir);
  document.body.classList.toggle("menu-open", abrir);
  button.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
  button.setAttribute("title", abrir ? "Fechar menu" : "Abrir menu");
}

function fecharMenuMobile() {
  toggleMobileMenu(false);
}

function sincronizarMenuMobile() {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("mobileNavBackdrop");
  const button = document.getElementById("mobileMenuToggle");
  if (!sidebar || !backdrop || !button) return;

  if (!isMobileViewport()) {
    sidebar.classList.remove("mobile-open");
    backdrop.classList.add("hidden");
    document.body.classList.remove("menu-open");
    button.setAttribute("aria-label", "Abrir menu");
    button.setAttribute("title", "Abrir menu");
    return;
  }

  button.setAttribute("aria-label", "Abrir menu");
  button.setAttribute("title", "Abrir menu");
}

window.addEventListener("resize", sincronizarMenuMobile);

function renderSidebar() {
  const sidebar = document.getElementById("sidebar");
  const isAdmin = appState.usuarioLogado.perfil === "admin";

  const logoHTML = `
    <div class="sidebar-logo-area">
      <img src="img/logo-shekinah.svg" alt="Shekinah IAD">
      <span>Shekinah IAD</span>
      <small>Sistema de Escalas</small>
    </div>`;

  const navAdmin = `
    <div class="sidebar-section">Menu principal</div>
    <div class="nav-item" data-page="dashboard" onclick="irPara('dashboard')"><span class="nav-icon">DG</span> Dashboard</div>
    <div class="nav-item" data-page="voluntarios" onclick="irPara('voluntarios')"><span class="nav-icon">VL</span> Voluntarios</div>
    <div class="nav-item" data-page="escalas" onclick="irPara('escalas')"><span class="nav-icon">ES</span> Escalas</div>
    <div class="sidebar-section">Analises</div>
    <div class="nav-item" data-page="conflitos" onclick="irPara('conflitos')"><span class="nav-icon">CF</span> Conflitos</div>
    <div class="nav-item" data-page="disponibilidades" onclick="irPara('disponibilidades')"><span class="nav-icon">DP</span> Disponibilidades</div>
    <div class="nav-item" data-page="calendario" onclick="irPara('calendario')"><span class="nav-icon">CL</span> Calendario</div>`;

  const navVol = `
    <div class="sidebar-section">Meu painel</div>
    <div class="nav-item" data-page="dashboard" onclick="irPara('dashboard')"><span class="nav-icon">IN</span> Inicio</div>
    <div class="nav-item" data-page="minhas-escalas" onclick="irPara('minhas-escalas')"><span class="nav-icon">ME</span> Minhas Escalas</div>
    <div class="nav-item" data-page="disponibilidade" onclick="irPara('disponibilidade')"><span class="nav-icon">DS</span> Disponibilidade</div>
    <div class="nav-item" data-page="calendario" onclick="irPara('calendario')"><span class="nav-icon">CL</span> Calendario</div>`;

  sidebar.innerHTML = `
    ${logoHTML}
    ${isAdmin ? navAdmin : navVol}
    <div class="sidebar-footer">
      <button class="btn-logout btn-logout-sidebar" onclick="fazerLogout()">Sair</button>
    </div>`;

  sincronizarMenuMobile();
}

async function irPara(pagina) {
  appState.paginaAtual = pagina;
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.page === pagina);
  });
  fecharMenuMobile();
  renderPagina(pagina);
}

function renderPagina(pagina) {
  const main = document.getElementById("mainContent");
  const isAdmin = appState.usuarioLogado.perfil === "admin";

  const mapa = {
    dashboard: isAdmin ? renderDashboardAdmin : renderDashboardVoluntario,
    voluntarios: isAdmin ? renderVoluntarios : null,
    escalas: isAdmin ? renderEscalas : null,
    conflitos: isAdmin ? renderConflitos : null,
    disponibilidades: isAdmin ? renderDisponibilidades : null,
    "minhas-escalas": renderMinhasEscalas,
    disponibilidade: renderDisponibilidadeVol,
    calendario: renderCalendarioEscalas
  };

  const fn = mapa[pagina];
  if (fn) main.innerHTML = fn();
  prepararTabelasResponsivas(main);
}

function renderDashboardAdmin() {
  const hoje = new Date();
  const domingoProx = new Date(hoje);
  domingoProx.setDate(hoje.getDate() + (7 - hoje.getDay()));
  const domingoStr = domingoProx.toISOString().slice(0, 10);
  const escalasProxDom = appState.escalas.filter(e => e.data === domingoStr).length;
  const conflitos = appState.conflitos || [];

  return `
    <div class="welcome-banner">
      <h2>Bem-vindo, Administrador</h2>
      <p>Gerencie as escalas ministeriais da igreja em tempo real pela API conectada.</p>
    </div>

    <div class="cards-grid">
      <div class="stat-card">
        <div class="stat-icon">VL</div>
        <div class="stat-value">${appState.voluntarios.length}</div>
        <div class="stat-label">Voluntarios</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">ES</div>
        <div class="stat-value">${appState.escalas.length}</div>
        <div class="stat-label">Escalas cadastradas</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">DM</div>
        <div class="stat-value">${escalasProxDom}</div>
        <div class="stat-label">Proximo domingo</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">CF</div>
        <div class="stat-value" style="color:${conflitos.length > 0 ? "var(--vermelho)" : "var(--verde)"}">${conflitos.length}</div>
        <div class="stat-label">Conflitos</div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-header">
        <h3>Proximas escalas</h3>
        <button class="btn btn-chama btn-sm" onclick="irPara('escalas')">Ver todas</button>
      </div>
      <div class="section-body">
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Data</th><th>Horario</th><th>Ministerio</th><th>Voluntario</th><th>Funcao</th></tr></thead>
            <tbody>
              ${appState.escalas
                .slice()
                .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario))
                .slice(0, 5)
                .map(e => `
                  <tr>
                    <td>${formatarData(e.data)}</td>
                    <td>${e.horario}</td>
                    <td><span class="escala-tipo-badge">${e.tipo}</span></td>
                    <td>${nomeVoluntario(e.voluntarioId)}</td>
                    <td>${e.funcao || "-"}</td>
                  </tr>`)
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    ${conflitos.length > 0
      ? `
        <div class="section-card">
          <div class="section-header"><h3>Alertas de conflito</h3></div>
          <div class="section-body">
            ${conflitos.slice(0, 3).map(item => `<div class="alert alert-danger">${item.message}</div>`).join("")}
            ${conflitos.length > 3 ? `<button class="btn btn-ghost btn-sm" onclick="irPara('conflitos')">Ver todos (${conflitos.length})</button>` : ""}
          </div>
        </div>`
      : `<div class="alert alert-success">Nenhum conflito encontrado. Todas as escalas estao em ordem.</div>`}
  `;
}

function renderVoluntarios(filtro = "") {
  const lista = filtro
    ? appState.voluntarios.filter(v =>
        v.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        v.ministerio.toLowerCase().includes(filtro.toLowerCase()))
    : appState.voluntarios;

  return `
    <div class="page-title">Voluntarios</div>
    <div class="page-subtitle">Gerencie os voluntarios cadastrados no backend</div>
    <div class="filter-bar">
      <input type="text" placeholder="Buscar por nome ou ministerio..." oninput="filtrarVoluntarios(this.value)" value="${filtro}" style="flex:1;min-width:200px;">
      <button class="btn btn-chama" onclick="abrirModalNovoVoluntario()">Novo voluntario</button>
    </div>
    <div class="section-card">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Nome</th><th>Usuario</th><th>Ministerio</th><th>Disponibilidade</th><th>Acoes</th></tr></thead>
          <tbody>
            ${lista.map(v => `
              <tr>
                <td><strong>${v.nome}</strong></td>
                <td><span class="badge badge-blue">${v.usuario}</span></td>
                <td>${v.ministerio}</td>
                <td style="font-size:12px;">${(v.disponibilidade || []).map(key => DIAS_SEMANA.find(item => item.key === key)?.label || key).join(", ") || "-"}</td>
                <td class="action-cell">
                  <button class="btn btn-ghost btn-sm" onclick="abrirModalEditarVoluntario(${v.id})">Editar</button>
                  <button class="btn btn-danger btn-sm" onclick="confirmarExcluirVoluntario(${v.id})">Excluir</button>
                </td>
              </tr>`)
            .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function filtrarVoluntarios(valor) {
  document.getElementById("mainContent").innerHTML = renderVoluntarios(valor);
}

function montarOpcoesMinisterio(selectedIds = []) {
  return appState.ministerios
    .map(ministerio => `<option value="${ministerio.id}" ${selectedIds.includes(ministerio.id) ? "selected" : ""}>${ministerio.nome}</option>`)
    .join("");
}

function abrirModalNovoVoluntario() {
  abrirModal(`
    <div class="modal-title">Novo voluntario</div>
    <div class="form-grid">
      <div class="form-group"><label>Nome completo *</label><input id="vNome" placeholder="Nome"></div>
      <div class="form-group"><label>Usuario *</label><input id="vUsuario" placeholder="usuario"></div>
      <div class="form-group"><label>Senha *</label><input id="vSenha" type="password" value="1234"></div>
      <div class="form-group"><label>Email</label><input id="vEmail" placeholder="email@exemplo.com"></div>
      <div class="form-group"><label>Telefone</label><input id="vTelefone" placeholder="(00) 00000-0000"></div>
      <div class="form-group">
        <label>Ministerio *</label>
        <select id="vMinisterio">${montarOpcoesMinisterio()}</select>
      </div>
    </div>
    <div class="form-group" style="margin-top:14px;">
      <label>Observacoes</label>
      <textarea id="vObs" placeholder="Observacoes..."></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-chama" onclick="salvarNovoVoluntario()">Salvar</button>
      <button class="btn btn-ghost" onclick="fecharModalDireto()">Cancelar</button>
    </div>`);
}

async function salvarNovoVoluntario() {
  const nome = document.getElementById("vNome").value.trim();
  const usuario = document.getElementById("vUsuario").value.trim();
  const senha = document.getElementById("vSenha").value.trim();
  const email = document.getElementById("vEmail").value.trim();
  const telefone = document.getElementById("vTelefone").value.trim();
  const ministryId = Number(document.getElementById("vMinisterio").value);
  const obs = document.getElementById("vObs").value.trim();

  const erro = validarCamposObrigatorios({ Nome: nome, Usuario: usuario, Senha: senha, Ministerio: ministryId });
  if (erro) {
    toast(erro, "danger");
    return;
  }

  try {
    await apiRequest("/volunteers", {
      method: "POST",
      body: JSON.stringify({
        fullName: nome,
        username: usuario,
        email,
        phone: telefone,
        notes: obs,
        ministryIds: [ministryId],
        active: true,
        password: senha
      })
    });
    await carregarDadosDoUsuario();
    fecharModalDireto();
    toast("Voluntario cadastrado com sucesso.", "success");
    renderPagina("voluntarios");
  } catch (error) {
    toast(error.message || "Nao foi possivel cadastrar o voluntario.", "danger");
  }
}

function abrirModalEditarVoluntario(id) {
  const v = appState.voluntarios.find(item => item.id === id);
  if (!v) return;

  abrirModal(`
    <div class="modal-title">Editar voluntario</div>
    <div class="form-grid">
      <div class="form-group"><label>Nome completo</label><input id="vNome" value="${v.nome}"></div>
      <div class="form-group"><label>Usuario</label><input id="vUsuario" value="${v.usuario}"></div>
      <div class="form-group"><label>Nova senha</label><input id="vSenha" type="password" placeholder="Deixe em branco para manter"></div>
      <div class="form-group"><label>Email</label><input id="vEmail" value="${v.email || ""}"></div>
      <div class="form-group"><label>Telefone</label><input id="vTelefone" value="${v.telefone || ""}"></div>
      <div class="form-group">
        <label>Ministerio</label>
        <select id="vMinisterio">${montarOpcoesMinisterio(v.ministerioIds || [])}</select>
      </div>
    </div>
    <div class="form-group" style="margin-top:14px;">
      <label>Observacoes</label>
      <textarea id="vObs">${v.obs || ""}</textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-chama" onclick="salvarEdicaoVoluntario(${id})">Salvar</button>
      <button class="btn btn-ghost" onclick="fecharModalDireto()">Cancelar</button>
    </div>`);
}

async function salvarEdicaoVoluntario(id) {
  const atual = appState.voluntarios.find(item => item.id === id);
  const payload = {
    fullName: document.getElementById("vNome").value.trim(),
    username: document.getElementById("vUsuario").value.trim(),
    email: document.getElementById("vEmail").value.trim(),
    phone: document.getElementById("vTelefone").value.trim(),
    notes: document.getElementById("vObs").value.trim(),
    ministryIds: [Number(document.getElementById("vMinisterio").value)],
    active: atual?.ativo ?? true,
    password: document.getElementById("vSenha").value.trim()
  };

  const erro = validarCamposObrigatorios({ Nome: payload.fullName, Usuario: payload.username, Ministerio: payload.ministryIds[0] });
  if (erro) {
    toast(erro, "danger");
    return;
  }

  try {
    await apiRequest(`/volunteers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    await carregarDadosDoUsuario();
    fecharModalDireto();
    toast("Voluntario atualizado.", "success");
    renderPagina("voluntarios");
  } catch (error) {
    toast(error.message || "Nao foi possivel atualizar o voluntario.", "danger");
  }
}

function confirmarExcluirVoluntario(id) {
  abrirModal(`
    <div class="modal-title">Confirmar exclusao</div>
    <div class="alert alert-warning">Tem certeza que deseja excluir este voluntario?</div>
    <div class="form-actions">
      <button class="btn btn-danger" onclick="excluirVoluntario(${id})">Sim, excluir</button>
      <button class="btn btn-ghost" onclick="fecharModalDireto()">Cancelar</button>
    </div>`);
}

async function excluirVoluntario(id) {
  try {
    await apiRequest(`/volunteers/${id}`, { method: "DELETE" });
    await carregarDadosDoUsuario();
    fecharModalDireto();
    toast("Voluntario excluido.", "success");
    renderPagina("voluntarios");
  } catch (error) {
    toast(error.message || "Nao foi possivel excluir o voluntario.", "danger");
  }
}

function renderDisponibilidades() {
  return `
    <div class="page-title">Disponibilidades</div>
    <div class="page-subtitle">Visualize os dias informados por cada voluntario</div>
    <div class="section-card">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Voluntario</th><th>Ministerio</th><th>Disponivel</th><th>Indisponivel</th><th>Obs</th></tr></thead>
          <tbody>
            ${appState.voluntarios.map(v => `
              <tr>
                <td><strong>${v.nome}</strong></td>
                <td>${v.ministerio}</td>
                <td style="font-size:12px;color:#16a34a;">${(v.disponibilidade || []).map(key => DIAS_SEMANA.find(item => item.key === key)?.label || key).join(", ") || "-"}</td>
                <td style="font-size:12px;color:#dc2626;">${(v.indisponibilidade || []).map(key => DIAS_SEMANA.find(item => item.key === key)?.label || key).join(", ") || "-"}</td>
                <td style="font-size:12px;color:var(--text-muted);">${v.obs || "-"}</td>
              </tr>`)
            .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}
