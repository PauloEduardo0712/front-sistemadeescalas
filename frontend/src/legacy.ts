// @ts-nocheck
/* Arquivo gerado a partir dos scripts legados para entrada TypeScript/Vite. */

import { API_BASE_URL } from "./config";

/* =============================================
   DADOS.JS - Estado global e integracao com API
   ============================================= */

const AUTH_STORAGE_KEY = "shekinah-auth";

const DIAS_SEMANA = [
  { key: "domingo-manha", label: "Domingo Manha", dayOfWeek: "SUNDAY", timeSlot: "MANHA" },
  { key: "domingo-noite", label: "Domingo Noite", dayOfWeek: "SUNDAY", timeSlot: "NOITE" },
  { key: "segunda-noite", label: "Segunda Noite", dayOfWeek: "MONDAY", timeSlot: "NOITE" },
  { key: "terca-noite", label: "Terca Noite", dayOfWeek: "TUESDAY", timeSlot: "NOITE" },
  { key: "quarta-noite", label: "Quarta Noite", dayOfWeek: "WEDNESDAY", timeSlot: "NOITE" },
  { key: "quinta-noite", label: "Quinta Noite", dayOfWeek: "THURSDAY", timeSlot: "NOITE" },
  { key: "sexta-noite", label: "Sexta Noite", dayOfWeek: "FRIDAY", timeSlot: "NOITE" },
  { key: "sabado-manha", label: "Sabado Manha", dayOfWeek: "SATURDAY", timeSlot: "MANHA" },
  { key: "sabado-noite", label: "Sabado Noite", dayOfWeek: "SATURDAY", timeSlot: "NOITE" }
];

let appState = {
  token: null,
  usuarioLogado: null,
  paginaAtual: "dashboard",
  calendarioReferencia: null,
  ministerios: [],
  voluntarios: [],
  escalas: [],
  conflitos: []
};

function tokenTemFormatoJwt(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

function getMinisterioNomes() {
  return appState.ministerios.map(m => m.nome);
}

function getDiaSemanaConfig(dayOfWeek, timeSlot) {
  return DIAS_SEMANA.find(item => item.dayOfWeek === dayOfWeek && item.timeSlot === timeSlot);
}

function getKeyFromAvailability(item) {
  return getDiaSemanaConfig(item.dayOfWeek, item.timeSlot)?.key || null;
}

function getAvailabilityRequestFromKey(key, status) {
  const config = DIAS_SEMANA.find(item => item.key === key);
  if (!config) return null;
  return {
    dayOfWeek: config.dayOfWeek,
    timeSlot: config.timeSlot,
    status
  };
}

function saveAuthState() {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    token: appState.token,
    usuarioLogado: appState.usuarioLogado
  }));
}

function clearAuthState() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function restoreAuthState() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    appState.token = parsed.token || null;
    appState.usuarioLogado = parsed.usuarioLogado || null;
    if (!tokenTemFormatoJwt(appState.token) || !appState.usuarioLogado) {
      clearAuthState();
      appState.token = null;
      appState.usuarioLogado = null;
      return false;
    }
    return true;
  } catch (error) {
    clearAuthState();
    return false;
  }
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (tokenTemFormatoJwt(appState.token)) {
    headers.Authorization = `Bearer ${appState.token}`;
  }

  const baseUrls = getApiBaseUrls();
  let response = null;
  let networkError = null;

  for (const baseUrl of baseUrls) {
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers
      });
      salvarApiBaseUrlAtiva(baseUrl);
      break;
    } catch (error) {
      networkError = error;
    }
  }

  if (!response) {
    const error = new Error("Nao foi possivel conectar com a API. Verifique se o backend esta ligado.");
    error.cause = networkError;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || "Erro ao comunicar com o servidor.");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

function getApiBaseUrls() {
  const configuredUrl = localStorage.getItem("shekinah-api-url");
  const candidates = [
    configuredUrl,
    API_BASE_URL
  ];

  return [...new Set(
    candidates
      .filter(Boolean)
      .map(url => String(url).trim().replace(/\/+$/, ""))
  )];
}

function salvarApiBaseUrlAtiva(baseUrl) {
  if (!baseUrl) return;
  if (localStorage.getItem("shekinah-api-url") !== baseUrl) {
    localStorage.setItem("shekinah-api-url", baseUrl);
  }
}

function normalizeMinistry(item) {
  return {
    id: item.id,
    nome: item.name,
    descricao: item.description || "",
    ativo: item.active
  };
}

function normalizeVolunteer(item) {
  const ministerios = (item.ministries || []).map(ministry => normalizeMinistry(ministry));
  return {
    id: item.id,
    nome: item.fullName,
    usuario: item.username,
    email: item.email || "",
    telefone: item.phone || "",
    obs: item.notes || "",
    ativo: item.active,
    ministerios,
    ministerioIds: ministerios.map(ministry => ministry.id),
    ministerio: ministerios[0]?.nome || "-",
    disponibilidade: [],
    indisponibilidade: []
  };
}

function normalizeSchedule(item) {
  return {
    id: item.id,
    tipo: item.ministry?.name || "-",
    ministryId: item.ministry?.id || null,
    data: item.serviceDate,
    horario: item.serviceTime?.slice(0, 5) || "",
    timeSlot: item.timeSlot,
    voluntarioId: item.volunteer?.id || null,
    voluntarioNome: item.volunteer?.fullName || "-",
    funcao: item.roleName || "",
    local: item.location || "",
    culto: item.eventName || "",
    turma: "",
    professor: "",
    auxiliar: "",
    tema: "",
    lanche: "",
    focoPrayer: item.notes || "",
    conflito: !!item.conflict,
    conflitoMsg: item.conflictMessage || ""
  };
}

function applyAvailabilityToVolunteer(volunteerId, availabilities) {
  const volunteer = appState.voluntarios.find(item => item.id === volunteerId);
  if (!volunteer) return;

  volunteer.disponibilidade = [];
  volunteer.indisponibilidade = [];

  for (const availability of availabilities) {
    const key = getKeyFromAvailability(availability);
    if (!key) continue;
    if (availability.status === "DISPONIVEL") {
      volunteer.disponibilidade.push(key);
    } else if (availability.status === "INDISPONIVEL") {
      volunteer.indisponibilidade.push(key);
    }
  }
}

async function carregarDisponibilidadesDeVoluntarios(volunteers) {
  await Promise.all(volunteers.map(async volunteer => {
    const availabilities = await apiRequest(`/availabilities/volunteer/${volunteer.id}`);
    applyAvailabilityToVolunteer(volunteer.id, availabilities);
  }));
}

async function carregarDadosDoUsuario() {
  appState.ministerios = (await apiRequest("/ministries")).map(normalizeMinistry);

  if (!appState.usuarioLogado) return;

  if (appState.usuarioLogado.perfil === "admin") {
    appState.voluntarios = (await apiRequest("/volunteers")).map(normalizeVolunteer);
    await carregarDisponibilidadesDeVoluntarios(appState.voluntarios);
    appState.escalas = (await apiRequest("/schedules")).map(normalizeSchedule);
    appState.conflitos = await apiRequest("/schedules/conflicts");
    return;
  }

  const meuVoluntario = normalizeVolunteer(await apiRequest("/volunteers/me"));
  appState.voluntarios = [meuVoluntario];
  applyAvailabilityToVolunteer(meuVoluntario.id, await apiRequest("/availabilities/me"));
  appState.escalas = (await apiRequest("/schedules")).map(normalizeSchedule);
  appState.conflitos = [];

  appState.usuarioLogado = {
    ...appState.usuarioLogado,
    id: meuVoluntario.id,
    nome: meuVoluntario.nome,
    ministerio: meuVoluntario.ministerio,
    ministerioIds: meuVoluntario.ministerioIds,
    disponibilidade: meuVoluntario.disponibilidade,
    indisponibilidade: meuVoluntario.indisponibilidade,
    obs: meuVoluntario.obs
  };

  saveAuthState();
}

async function atualizarAplicacaoAposLogin() {
  document.getElementById("telaLogin").classList.add("hidden");
  document.getElementById("appContainer").classList.remove("hidden");
  document.getElementById("headerBadge").textContent =
    appState.usuarioLogado.perfil === "admin" ? "Administrador" : "Voluntario";
  document.getElementById("headerNome").textContent = appState.usuarioLogado.nome;
  renderSidebar();
  await carregarDadosDoUsuario();
  document.getElementById("headerNome").textContent = appState.usuarioLogado.nome;
  irPara(appState.paginaAtual || "dashboard");
}
/* =============================================
   UTILS.JS - Funcoes auxiliares
   ============================================= */

/**
 * Formata data YYYY-MM-DD para DD/MM/YYYY
 */
function formatarData(dataStr) {
  if (!dataStr) return "-";
  const [y, m, d] = dataStr.split("-");
  return `${d}/${m}/${y}`;
}

function normalizeText(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const THEME_STORAGE_KEY = "shekinah-theme";

function getCurrentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function atualizarBotaoTema() {
  const icon = document.getElementById("themeToggleIcon");
  const label = document.getElementById("themeToggleLabel");
  const button = document.getElementById("themeToggleBtn");
  const temaEscuro = getCurrentTheme() === "dark";

  if (icon) icon.textContent = temaEscuro ? "Sol" : "Lua";
  if (label) label.textContent = temaEscuro ? "Tema claro" : "Tema escuro";

  if (button) {
    const texto = temaEscuro ? "Ativar tema claro" : "Ativar tema escuro";
    button.setAttribute("aria-label", texto);
    button.setAttribute("title", texto);
  }
}

function applyTheme(theme) {
  const tema = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", tema);
  localStorage.setItem(THEME_STORAGE_KEY, tema);
  atualizarBotaoTema();
}

function toggleTheme() {
  applyTheme(getCurrentTheme() === "dark" ? "light" : "dark");
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 700px)").matches;
}

/**
 * Retorna a inicial do nome para avatar
 */
function getIniciais(nome) {
  if (!nome) return "?";
  const partes = nome.trim().split(" ");
  return partes.length >= 2
    ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
    : partes[0][0].toUpperCase();
}

/**
 * Exibe toast de notificacao
 */
function toast(msg, tipo = "success") {
  const cores  = { success: "#16a34a", danger: "#dc2626", warning: "#b45309", info: "#1a3a6e" };
  const icons  = { success: "", danger: "", warning: "", info: "" };
  const el = document.createElement("div");
  el.innerHTML = `${icons[tipo] || ""} ${msg}`;
  el.style.cssText = `
    background: ${cores[tipo] || "#333"};
    color: #fff;
    padding: 12px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Montserrat', sans-serif;
    box-shadow: 0 4px 20px rgba(0,0,0,0.22);
    animation: fadeUp 0.3s ease;
    max-width: 320px;
    line-height: 1.4;
  `;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/**
 * Abre o modal com HTML interno
 */
function abrirModal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modalOverlay").classList.remove("hidden");
  document.body.classList.add("modal-open");
}

/**
 * Fecha modal (pode ser chamado por clique no overlay)
 */
function fecharModal(e) {
  if (e && e.target !== document.getElementById("modalOverlay")) return;
  document.getElementById("modalOverlay").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

/**
 * Limpa e fecha modal diretamente
 */
function fecharModalDireto() {
  document.getElementById("modalOverlay").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function prepararTabelasResponsivas(container = document) {
  container.querySelectorAll("table").forEach(table => {
    const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent.trim());
    table.querySelectorAll("tbody tr").forEach(row => {
      Array.from(row.children).forEach((cell, index) => {
        if (headers[index]) {
          cell.setAttribute("data-label", headers[index]);
        }
      });
    });
  });
}

/**
 * Retorna o nome do voluntario pelo ID
 */
function nomeVoluntario(id) {
  const v = appState.voluntarios.find(v => v.id === id);
  return v ? v.nome : "-";
}

/**
 * Retorna o dia da semana + periodo de uma data e horario
 */
function getDiaPeriodo(dataStr, horarioStr) {
  const data = new Date(dataStr + "T12:00:00");
  const diasNomes = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const diaSem = diasNomes[data.getDay()];
  const hora = parseInt((horarioStr || "00:00").split(":")[0]);
  const periodo = hora < 13 ? "manha" : "noite";
  return `${diaSem}-${periodo}`;
}
/* =============================================
   VALIDACOES.JS - Validacao de campos
   ============================================= */

function validarCamposObrigatorios(campos) {
  for (const [label, valor] of Object.entries(campos)) {
    if (!valor || valor.toString().trim() === "") {
      return `O campo "${label}" e obrigatorio.`;
    }
  }
  return null;
}

function usuarioJaExiste(usuario, excluirId = null) {
  return appState.voluntarios.some(v => v.usuario === usuario && v.id !== excluirId);
}

function validarHorario(horario) {
  return /^\d{2}:\d{2}$/.test(horario);
}

function validarData(data) {
  return data && data.trim() !== "";
}
/* =============================================
   CONFLITOS.JS - Regras de conflito no frontend
   ============================================= */

function verificarConflito(escala) {
  if (!escala) return { ok: true, msg: "" };
  return {
    ok: !escala.conflito,
    msg: escala.conflitoMsg || ""
  };
}

function detectarTodosConflitos() {
  return appState.escalas
    .filter(escala => escala.conflito)
    .map(escala => ({
      escala,
      conflito: {
        ok: false,
        msg: escala.conflitoMsg || "Conflito identificado."
      }
    }));
}

function verificarDisponibilidadeNoForm() {
  const elData = document.getElementById("eData");
  const elHorario = document.getElementById("eHorario");
  const elVoluntario = document.getElementById("eVoluntario");
  const alertaDiv = document.getElementById("alertaDisponibilidade");

  if (!elData || !elVoluntario || !alertaDiv || !elData.value) {
    if (alertaDiv) alertaDiv.innerHTML = "";
    return;
  }

  const volId = parseInt(elVoluntario.value, 10);
  const vol = appState.voluntarios.find(v => v.id === volId);
  if (!vol) return;

  const key = getDiaPeriodo(elData.value, elHorario ? elHorario.value : "09:00");
  const indisponivel = (vol.indisponibilidade || []).includes(key);
  const jaEscalado = appState.escalas.find(e =>
    e.voluntarioId === volId &&
    e.data === elData.value &&
    e.horario === (elHorario ? elHorario.value : "")
  );

  let html = "";
  if (indisponivel) {
    html += `<div class="alert alert-danger">${vol.nome} informou indisponibilidade para este dia e turno.</div>`;
  }
  if (jaEscalado) {
    html += `<div class="alert alert-warning">${vol.nome} ja possui uma escala neste mesmo horario.</div>`;
  }
  if (!indisponivel && !jaEscalado && elData.value) {
    html = `<div class="alert alert-success">${vol.nome} esta disponivel para este horario.</div>`;
  }

  alertaDiv.innerHTML = html;
}
/* =============================================
   LOGIN.JS - Autenticacao e sessao
   ============================================= */

let modoLoginAtual = "entrar";

function renderizarOpcoesMinisterioCadastro(ministerios, valorSelecionado = "") {
  const select = document.getElementById("cadastroMinisterio");
  if (!select) return;

  if (!ministerios.length) {
    select.innerHTML = `<option value="">Nenhum ministerio ativo disponivel</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = `
    <option value="">Selecione um ministerio</option>
    ${ministerios.map(item => `<option value="${item.id}">${item.name || item.nome}</option>`).join("")}
  `;

  const ministerioAindaExiste = ministerios.some(item => String(item.id) === String(valorSelecionado));
  select.value = ministerioAindaExiste ? String(valorSelecionado) : "";
}

function alternarModoLogin(modo) {
  modoLoginAtual = modo === "cadastro" ? "cadastro" : "entrar";

  document.getElementById("painelLogin").classList.toggle("hidden", modoLoginAtual !== "entrar");
  document.getElementById("painelCadastro").classList.toggle("hidden", modoLoginAtual !== "cadastro");
  document.getElementById("abaEntrar").classList.toggle("active", modoLoginAtual === "entrar");
  document.getElementById("abaCriarConta").classList.toggle("active", modoLoginAtual === "cadastro");

  if (modoLoginAtual === "cadastro") {
    carregarMinisteriosCadastro();
  }
}

async function carregarMinisteriosCadastro() {
  try {
    const select = document.getElementById("cadastroMinisterio");
    const valorAtual = select.value;
    select.disabled = true;
    select.innerHTML = `<option value="">Carregando ministerios...</option>`;

    const ministerios = await carregarMinisteriosCadastroDados();
    renderizarOpcoesMinisterioCadastro(ministerios, valorAtual);
  } catch (error) {
    const select = document.getElementById("cadastroMinisterio");
    select.innerHTML = `<option value="">Nao foi possivel carregar os ministerios</option>`;
    select.disabled = true;
    toast(error.message || "Nao foi possivel carregar os ministerios.", "danger");
  }
}

async function carregarMinisteriosCadastroDados() {
  if (appState.ministerios.length) {
    return appState.ministerios.filter(item => item.ativo !== false);
  }

  const ministerios = (await apiRequest("/ministries"))
    .filter(item => item.active !== false)
    .map(normalizeMinistry);
  appState.ministerios = ministerios;
  return ministerios;
}

async function fazerLoginComDados({ usuario, senha, perfilSelecionado }) {
  if (!usuario || !senha) {
    toast("Preencha usuario e senha.", "danger");
    return false;
  }

  try {
    const auth = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: usuario, password: senha })
    });

    const perfilApi = auth.role === "ADMIN" ? "admin" : "voluntario";
    if (perfilApi !== perfilSelecionado) {
      toast("O perfil selecionado nao corresponde ao usuario informado.", "warning");
      return false;
    }

    appState.token = auth.token;
    appState.usuarioLogado = {
      id: auth.volunteerId || auth.userId,
      nome: auth.username,
      usuario: auth.username,
      perfil: perfilApi,
      ministerio: ""
    };

    saveAuthState();
    await atualizarAplicacaoAposLogin();
    return true;
  } catch (error) {
    toast(error.message || "Nao foi possivel fazer login.", "danger");
    return false;
  }
}

async function fazerLogin() {
  const usuario = document.getElementById("loginUsuario").value.trim();
  const senha = document.getElementById("loginSenha").value.trim();
  const perfilSelecionado = document.getElementById("loginPerfil").value;

  return fazerLoginComDados({ usuario, senha, perfilSelecionado });
}

async function criarContaComDados({ nome, usuario, senha, ministryId, email, telefone }) {
  const erro = validarCamposObrigatorios({
    Nome: nome,
    Usuario: usuario,
    Senha: senha,
    Ministerio: ministryId || ""
  });

  if (erro) {
    toast(erro, "danger");
    return false;
  }

  try {
    const auth = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: nome,
        username: usuario,
        email,
        phone: telefone,
        notes: "",
        ministryIds: [ministryId],
        password: senha
      })
    });

    appState.token = auth.token;
    appState.usuarioLogado = {
      id: auth.volunteerId || auth.userId,
      nome: auth.username,
      usuario: auth.username,
      perfil: "voluntario",
      ministerio: ""
    };

    saveAuthState();
    await atualizarAplicacaoAposLogin();
    return true;
  } catch (error) {
    toast(error.message || "Nao foi possivel criar sua conta.", "danger");
    return false;
  }
}

async function criarConta() {
  const nome = document.getElementById("cadastroNome").value.trim();
  const usuario = document.getElementById("cadastroUsuario").value.trim();
  const senha = document.getElementById("cadastroSenha").value.trim();
  const ministryId = Number(document.getElementById("cadastroMinisterio").value);
  const email = document.getElementById("cadastroEmail").value.trim();
  const telefone = document.getElementById("cadastroTelefone").value.trim();

  return criarContaComDados({ nome, usuario, senha, ministryId, email, telefone });
}

function fazerLogout() {
  fecharMenuMobile();
  fecharModalDireto();
  appState.token = null;
  appState.usuarioLogado = null;
  appState.ministerios = [];
  appState.voluntarios = [];
  appState.escalas = [];
  appState.conflitos = [];
  appState.paginaAtual = "dashboard";
  clearAuthState();
  document.getElementById("telaLogin").classList.remove("hidden");
  document.getElementById("appContainer").classList.add("hidden");
  document.getElementById("mainContent").innerHTML = "";
  document.getElementById("sidebar").innerHTML = "";
  document.getElementById("loginSenha").value = "";
  window.dispatchEvent(new CustomEvent("shekinah:logout"));
}

async function iniciarSessaoSalva() {
  if (!restoreAuthState()) return;
  try {
    const me = await apiRequest("/auth/me");
    appState.usuarioLogado = {
      ...appState.usuarioLogado,
      id: me.volunteerId || me.userId,
      nome: appState.usuarioLogado?.nome || me.username,
      usuario: me.username,
      perfil: me.role === "ADMIN" ? "admin" : "voluntario"
    };
    saveAuthState();
    await atualizarAplicacaoAposLogin();
  } catch (error) {
    fazerLogout();
  }
}

let interfaceInicializada = false;

function inicializarInterface() {
  if (interfaceInicializada) return;
  interfaceInicializada = true;
  applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || getCurrentTheme());
  iniciarSessaoSalva();
  sincronizarMenuMobile();
}

document.addEventListener("keydown", e => {
  const telaLogin = document.getElementById("telaLogin");
  if (e.key === "Enter" && telaLogin && !telaLogin.classList.contains("hidden")) {
    if (modoLoginAtual === "cadastro") {
      criarConta();
    } else {
      fazerLogin();
    }
  }
  if (e.key === "Escape") {
    fecharModalDireto();
    fecharMenuMobile();
  }
});
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
/* =============================================
   ESCALAS.JS - CRUD de Escalas
   ============================================= */

function renderEscalas(filtroMin = "", filtroData = "", filtroBusca = "") {
  let lista = appState.escalas.slice().sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario));

  if (filtroMin) lista = lista.filter(e => String(e.ministryId) === String(filtroMin));
  if (filtroData) lista = lista.filter(e => e.data === filtroData);

  if (filtroBusca) {
    const q = filtroBusca.toLowerCase();
    lista = lista.filter(e =>
      e.voluntarioNome.toLowerCase().includes(q) ||
      e.tipo.toLowerCase().includes(q)
    );
  }

  return `
    <div class="page-title">Escalas</div>
    <div class="page-subtitle">Gerencie as escalas ministeriais salvas no backend</div>
    <div class="filter-bar">
      <select id="fMin" onchange="filtrarEscalas(this.value, document.getElementById('fData').value, document.getElementById('fBusca').value)" style="min-width:170px;">
        <option value="">Todos os ministerios</option>
        ${appState.ministerios.map(m => `<option value="${m.id}" ${String(m.id) === String(filtroMin) ? "selected" : ""}>${m.nome}</option>`).join("")}
      </select>
      <input id="fData" type="date" value="${filtroData}" onchange="filtrarEscalas(document.getElementById('fMin').value, this.value, document.getElementById('fBusca').value)">
      <input id="fBusca" type="text" placeholder="Buscar voluntario..." value="${filtroBusca}" oninput="filtrarEscalas(document.getElementById('fMin').value, document.getElementById('fData').value, this.value)" style="flex:1;min-width:180px;">
      <button class="btn btn-chama" onclick="abrirModalNovaEscala()">Nova escala</button>
    </div>
    <div class="section-card">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Data</th><th>Horario</th><th>Ministerio</th><th>Voluntario</th><th>Funcao</th><th>Status</th><th>Acoes</th></tr></thead>
          <tbody>
            ${lista.map(e => `
              <tr>
                <td>${formatarData(e.data)}</td>
                <td>${e.horario}</td>
                <td><span class="escala-tipo-badge">${e.tipo}</span></td>
                <td>${e.voluntarioNome}</td>
                <td>${e.funcao || "-"}</td>
                <td>${e.conflito
                  ? `<span class="badge badge-red" title="${e.conflitoMsg}">Conflito</span>`
                  : '<span class="badge badge-green">OK</span>'}</td>
                <td class="action-cell">
                  <button class="btn btn-ghost btn-sm" onclick="abrirModalEditarEscala(${e.id})">Editar</button>
                  <button class="btn btn-danger btn-sm" onclick="confirmarExcluirEscala(${e.id})">Excluir</button>
                </td>
              </tr>`)
            .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function filtrarEscalas(ministryId, data, busca) {
  document.getElementById("mainContent").innerHTML = renderEscalas(ministryId, data, busca);
}

function montarOpcoesMinisterioEscala(selectedId = null) {
  return appState.ministerios
    .map(ministry => `<option value="${ministry.id}" ${ministry.id === selectedId ? "selected" : ""}>${ministry.nome}</option>`)
    .join("");
}

function montarOpcoesVoluntarioEscala(selectedId = null) {
  return appState.voluntarios
    .map(volunteer => `<option value="${volunteer.id}" ${volunteer.id === selectedId ? "selected" : ""}>${volunteer.nome} - ${volunteer.ministerio}</option>`)
    .join("");
}

function abrirModalNovaEscala() {
  abrirModal(`
    <div class="modal-title">Nova escala</div>
    <div class="form-grid">
      <div class="form-group">
        <label>Ministerio *</label>
        <select id="eTipo" onchange="atualizarCamposEscala()">${montarOpcoesMinisterioEscala()}</select>
      </div>
      <div class="form-group"><label>Data *</label><input id="eData" type="date" onchange="verificarDisponibilidadeNoForm()"></div>
      <div class="form-group"><label>Horario *</label><input id="eHorario" type="time" value="09:00" onchange="verificarDisponibilidadeNoForm()"></div>
      <div class="form-group">
        <label>Voluntario *</label>
        <select id="eVoluntario" onchange="verificarDisponibilidadeNoForm()">${montarOpcoesVoluntarioEscala()}</select>
      </div>
    </div>
    <div id="alertaDisponibilidade" style="margin-top:10px;"></div>
    <div id="camposExtra" style="margin-top:12px;"></div>
    <div class="form-actions">
      <button class="btn btn-chama" onclick="salvarNovaEscala()">Salvar escala</button>
      <button class="btn btn-ghost" onclick="fecharModalDireto()">Cancelar</button>
    </div>`);
  atualizarCamposEscala();
}

function atualizarCamposEscala(schedule = null) {
  const ministryId = Number(document.getElementById("eTipo")?.value);
  const ministry = appState.ministerios.find(item => item.id === ministryId);
  const nome = normalizeText(ministry?.nome || "");
  let campos = "";

  if (nome === "diaconos") {
    campos = `<div class="form-grid">
      <div class="form-group"><label>Evento</label><input id="eCulto" placeholder="Ex: Culto Domingo Manha" value="${schedule?.culto || ""}"></div>
      <div class="form-group"><label>Local</label><input id="eLocal" placeholder="Ex: Entrada principal" value="${schedule?.local || ""}"></div>
      <div class="form-group"><label>Funcao</label><input id="eFuncao" placeholder="Ex: Recepcao" value="${schedule?.funcao || ""}"></div>
    </div>`;
  } else if (nome === "ebd") {
    campos = `<div class="form-grid">
      <div class="form-group"><label>Turma</label><input id="eTurma" placeholder="Ex: Adultos" value="${schedule?.turma || ""}"></div>
      <div class="form-group"><label>Professor</label><input id="eProfessor" placeholder="Nome" value="${schedule?.professor || ""}"></div>
      <div class="form-group"><label>Tema</label><input id="eTema" placeholder="Tema da aula" value="${schedule?.tema || ""}"></div>
      <div class="form-group"><label>Observacoes</label><input id="eFoco" placeholder="Observacoes gerais" value="${schedule?.focoPrayer || ""}"></div>
    </div>`;
  } else if (nome === "intercessao") {
    campos = `<div class="form-grid">
      <div class="form-group"><label>Local</label><input id="eLocal" placeholder="Ex: Sala de oracao" value="${schedule?.local || ""}"></div>
      <div class="form-group"><label>Observacoes</label><input id="eFoco" placeholder="Ex: Missoes" value="${schedule?.focoPrayer || ""}"></div>
      <div class="form-group"><label>Funcao</label><input id="eFuncao" value="${schedule?.funcao || "Intercessor"}"></div>
    </div>`;
  } else {
    campos = `<div class="form-grid">
      <div class="form-group"><label>Funcao</label><input id="eFuncao" placeholder="Funcao do voluntario" value="${schedule?.funcao || ""}"></div>
      <div class="form-group"><label>Local</label><input id="eLocal" placeholder="Local de atuacao" value="${schedule?.local || ""}"></div>
      <div class="form-group"><label>Evento</label><input id="eCulto" placeholder="Nome do evento" value="${schedule?.culto || ""}"></div>
    </div>`;
  }

  const el = document.getElementById("camposExtra");
  if (el) el.innerHTML = campos;
}

function montarPayloadEscala() {
  const ministryId = Number(document.getElementById("eTipo").value);
  const serviceTime = document.getElementById("eHorario").value;
  const horarioHora = Number(serviceTime.split(":")[0]);
  return {
    ministryId,
    volunteerId: Number(document.getElementById("eVoluntario").value),
    serviceDate: document.getElementById("eData").value,
    serviceTime,
    timeSlot: horarioHora < 13 ? "MANHA" : "NOITE",
    roleName: document.getElementById("eFuncao")?.value?.trim() || "",
    location: document.getElementById("eLocal")?.value?.trim() || "",
    eventName: document.getElementById("eCulto")?.value?.trim() || "",
    notes: document.getElementById("eFoco")?.value?.trim() || ""
  };
}

async function salvarNovaEscala() {
  const payload = montarPayloadEscala();
  const erro = validarCamposObrigatorios({ Data: payload.serviceDate, Horario: payload.serviceTime, Ministerio: payload.ministryId, Voluntario: payload.volunteerId });
  if (erro) {
    toast(erro, "danger");
    return;
  }

  try {
    await apiRequest("/schedules", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    await carregarDadosDoUsuario();
    fecharModalDireto();
    toast("Escala cadastrada com sucesso.", "success");
    renderPagina("escalas");
  } catch (error) {
    toast(error.message || "Nao foi possivel cadastrar a escala.", "danger");
  }
}

function abrirModalEditarEscala(id) {
  const e = appState.escalas.find(item => item.id === id);
  if (!e) return;

  abrirModal(`
    <div class="modal-title">Editar escala</div>
    <div class="form-grid">
      <div class="form-group"><label>Ministerio</label><select id="eTipo" onchange="atualizarCamposEscala(window.__editingSchedule)">${montarOpcoesMinisterioEscala(e.ministryId)}</select></div>
      <div class="form-group"><label>Data</label><input id="eData" type="date" value="${e.data}" onchange="verificarDisponibilidadeNoForm()"></div>
      <div class="form-group"><label>Horario</label><input id="eHorario" type="time" value="${e.horario}" onchange="verificarDisponibilidadeNoForm()"></div>
      <div class="form-group"><label>Voluntario</label><select id="eVoluntario" onchange="verificarDisponibilidadeNoForm()">${montarOpcoesVoluntarioEscala(e.voluntarioId)}</select></div>
    </div>
    <div id="alertaDisponibilidade" style="margin-top:10px;"></div>
    <div id="camposExtra" style="margin-top:12px;"></div>
    <div class="form-actions">
      <button class="btn btn-chama" onclick="salvarEdicaoEscala(${id})">Salvar</button>
      <button class="btn btn-ghost" onclick="fecharModalDireto()">Cancelar</button>
    </div>`);
  window.__editingSchedule = e;
  atualizarCamposEscala(e);
  verificarDisponibilidadeNoForm();
}

async function salvarEdicaoEscala(id) {
  const payload = montarPayloadEscala();
  const erro = validarCamposObrigatorios({ Data: payload.serviceDate, Horario: payload.serviceTime, Ministerio: payload.ministryId, Voluntario: payload.volunteerId });
  if (erro) {
    toast(erro, "danger");
    return;
  }

  try {
    await apiRequest(`/schedules/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    await carregarDadosDoUsuario();
    fecharModalDireto();
    toast("Escala atualizada.", "success");
    renderPagina("escalas");
  } catch (error) {
    toast(error.message || "Nao foi possivel atualizar a escala.", "danger");
  }
}

function confirmarExcluirEscala(id) {
  abrirModal(`
    <div class="modal-title">Confirmar exclusao</div>
    <div class="alert alert-warning">Tem certeza que deseja excluir esta escala?</div>
    <div class="form-actions">
      <button class="btn btn-danger" onclick="excluirEscala(${id})">Sim, excluir</button>
      <button class="btn btn-ghost" onclick="fecharModalDireto()">Cancelar</button>
    </div>`);
}

async function excluirEscala(id) {
  try {
    await apiRequest(`/schedules/${id}`, { method: "DELETE" });
    await carregarDadosDoUsuario();
    fecharModalDireto();
    toast("Escala excluida.", "success");
    renderPagina("escalas");
  } catch (error) {
    toast(error.message || "Nao foi possivel excluir a escala.", "danger");
  }
}

function renderConflitos() {
  const conflitos = appState.conflitos || [];
  return `
    <div class="page-title">Conflitos</div>
    <div class="page-subtitle">Analise automatica de conflitos retornada pelo backend</div>
    ${conflitos.length === 0
      ? `<div class="alert alert-success">Nenhum conflito encontrado. Todas as escalas estao em ordem.</div>`
      : conflitos.map(item => `
          <div class="conflict-card">
            <div class="conflict-card-header">
              <span class="conflict-card-title">Conflito - ${item.ministryName}</span>
              <span class="badge badge-red">${item.volunteerName}</span>
            </div>
            <div class="alert alert-danger" style="margin-bottom:12px;">${item.message}</div>
            <div class="form-actions" style="margin-top:0;border-top:none;padding-top:0;">
              <button class="btn btn-chama btn-sm" onclick="abrirModalEditarEscala(${item.scheduleId})">Editar</button>
              <button class="btn btn-danger btn-sm" onclick="confirmarExcluirEscala(${item.scheduleId})">Remover</button>
            </div>
          </div>`).join("")}
  `;
}
/* =============================================
   VOLUNTARIO.JS - Painel e Disponibilidade do Voluntario
   ============================================= */

function getMeuVoluntario() {
  return appState.voluntarios.find(v => v.id === appState.usuarioLogado.id) || appState.voluntarios[0] || appState.usuarioLogado;
}

function renderDashboardVoluntario() {
  const vol = getMeuVoluntario();
  const minhasEscalas = appState.escalas.filter(e => e.voluntarioId === vol.id);
  const diasDisp = (vol.disponibilidade || []).map(key => DIAS_SEMANA.find(item => item.key === key)?.label || key).join(", ") || "Nenhum informado";
  const diasIndisp = (vol.indisponibilidade || []).map(key => DIAS_SEMANA.find(item => item.key === key)?.label || key).join(", ") || "Nenhum informado";

  return `
    <div class="vol-profile-card">
      <div class="vol-avatar">${getIniciais(vol.nome)}</div>
      <div class="vol-info">
        <h2>Ola, ${vol.nome}</h2>
        <p>Ministerio: <strong>${vol.ministerio}</strong> &nbsp;|&nbsp; ${minhasEscalas.length} escala(s) cadastrada(s)</p>
      </div>
    </div>

    <div class="cards-grid">
      <div class="stat-card">
        <div class="stat-icon">ME</div>
        <div class="stat-value">${minhasEscalas.length}</div>
        <div class="stat-label">Minhas escalas</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">DP</div>
        <div class="stat-value">${(vol.disponibilidade || []).length}</div>
        <div class="stat-label">Dias disponiveis</div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-header">
        <h3>Minhas proximas escalas</h3>
        <button class="btn btn-primary btn-sm" onclick="irPara('minhas-escalas')">Ver todas</button>
      </div>
      <div class="section-body">
        ${minhasEscalas.length === 0
          ? `<div class="alert alert-info">Voce ainda nao possui escalas cadastradas.</div>`
          : `<div class="table-wrapper"><table>
              <thead><tr><th>Data</th><th>Horario</th><th>Ministerio</th><th>Funcao</th></tr></thead>
              <tbody>
                ${minhasEscalas.slice().sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario)).map(e => `
                  <tr>
                    <td>${formatarData(e.data)}</td>
                    <td>${e.horario}</td>
                    <td><span class="escala-tipo-badge">${e.tipo}</span></td>
                    <td>${e.funcao || "-"}</td>
                  </tr>`).join("")}
              </tbody>
            </table></div>`}
      </div>
    </div>

    <div class="section-card">
      <div class="section-header">
        <h3>Minha disponibilidade</h3>
        <button class="btn btn-chama btn-sm" onclick="irPara('disponibilidade')">Editar</button>
      </div>
      <div class="section-body">
        <p style="font-size:13px;margin-bottom:8px;"><span class="badge badge-green">Disponivel</span> ${diasDisp}</p>
        <p style="font-size:13px;"><span class="badge badge-red">Indisponivel</span> ${diasIndisp}</p>
      </div>
    </div>

    <div class="section-card">
      <div class="section-header">
        <h3>Calendario geral da escala</h3>
        <button class="btn btn-primary btn-sm" onclick="irPara('calendario')">Abrir calendario</button>
      </div>
      <div class="section-body">
        <p style="font-size:13px;color:var(--text-muted);">
          Consulte todos os dias do mes, veja quem vai servir e qual sera a funcao de cada pessoa.
        </p>
      </div>
    </div>`;
}

function renderMinhasEscalas() {
  const vol = getMeuVoluntario();
  const minhas = appState.escalas.filter(e => e.voluntarioId === vol.id).sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario));

  return `
    <div class="page-title">Minhas Escalas</div>
    <div class="page-subtitle">Todas as escalas em que voce foi cadastrado</div>
    <div class="section-card">
      ${minhas.length === 0
        ? `<div class="section-body"><div class="alert alert-info">Voce ainda nao possui escalas cadastradas.</div></div>`
        : `<div class="table-wrapper"><table>
            <thead><tr><th>Data</th><th>Horario</th><th>Ministerio</th><th>Funcao</th><th>Local / Detalhe</th></tr></thead>
            <tbody>
              ${minhas.map(e => `
                <tr>
                  <td>${formatarData(e.data)}</td>
                  <td>${e.horario}</td>
                  <td><span class="escala-tipo-badge">${e.tipo}</span></td>
                  <td>${e.funcao || "-"}</td>
                  <td style="font-size:12px;">${e.local || e.culto || e.focoPrayer || "-"}</td>
                </tr>`).join("")}
            </tbody>
          </table></div>`}
    </div>`;
}

function renderDisponibilidadeVol() {
  const vol = getMeuVoluntario();
  return `
    <div class="page-title">Minha Disponibilidade</div>
    <div class="page-subtitle">Informe os dias em que pode ou nao pode servir</div>
    <div class="section-card">
      <div class="section-header"><h3>Clique para alternar disponibilidade</h3></div>
      <div class="section-body">
        <div class="alert alert-info" style="margin-bottom:18px;">
          <strong>Verde</strong> = Disponivel &nbsp;|&nbsp; <strong>Vermelho</strong> = Indisponivel &nbsp;|&nbsp; <strong>Cinza</strong> = Nao informado<br>
          <small>Clique uma vez para disponivel, de novo para indisponivel e mais uma vez para limpar.</small>
        </div>
        <div class="disponibilidade-grid">
          ${DIAS_SEMANA.map(dia => {
            const disponivel = (vol.disponibilidade || []).includes(dia.key);
            const indisponivel = (vol.indisponibilidade || []).includes(dia.key);
            const cls = disponivel ? "disponivel" : indisponivel ? "indisponivel" : "";
            return `
              <div class="disp-item ${cls}" data-key="${dia.key}" onclick="toggleDisponibilidade('${dia.key}')">
                ${dia.label}
                <small>${disponivel ? "Disponivel" : indisponivel ? "Indisponivel" : "Nao informado"}</small>
              </div>`;
          }).join("")}
        </div>
        <div class="form-actions">
          <button class="btn btn-chama" onclick="salvarDisponibilidade()">Salvar disponibilidade</button>
        </div>
      </div>
    </div>`;
}

function getCalendarioReferencia() {
  if (!appState.calendarioReferencia) {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    appState.calendarioReferencia = `${hoje.getFullYear()}-${mes}`;
  }
  const [ano, mes] = appState.calendarioReferencia.split("-").map(Number);
  return new Date(ano, mes - 1, 1);
}

function alterarCalendarioMes(delta) {
  const referencia = getCalendarioReferencia();
  referencia.setMonth(referencia.getMonth() + delta);
  const mes = String(referencia.getMonth() + 1).padStart(2, "0");
  appState.calendarioReferencia = `${referencia.getFullYear()}-${mes}`;
  renderPagina("calendario");
}

function formatarMesAnoCalendario(data) {
  return data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
}

function montarMapaEscalasPorData() {
  return appState.escalas.reduce((acc, escala) => {
    if (!acc[escala.data]) acc[escala.data] = [];
    acc[escala.data].push(escala);
    return acc;
  }, {});
}

function renderCalendarioEscalas() {
  const referencia = getCalendarioReferencia();
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const totalSlots = Math.ceil((primeiroDiaSemana + diasNoMes) / 7) * 7;
  const mapaEscalas = montarMapaEscalasPorData();
  const escalasDoMes = appState.escalas
    .filter(escala => escala.data.startsWith(appState.calendarioReferencia))
    .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario));

  const diasCabecalho = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const calendarioHtml = Array.from({ length: totalSlots }, (_, index) => {
    const numeroDia = index - primeiroDiaSemana + 1;
    const foraDoMes = numeroDia < 1 || numeroDia > diasNoMes;

    if (foraDoMes) {
      return `<div class="calendar-day calendar-day-empty" aria-hidden="true"></div>`;
    }

    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(numeroDia).padStart(2, "0")}`;
    const escalasDia = (mapaEscalas[dataStr] || []).slice().sort((a, b) => a.horario.localeCompare(b.horario));

    return `
      <article class="calendar-day ${escalasDia.length ? "calendar-day-has-scale" : ""}">
        <div class="calendar-day-top">
          <span class="calendar-day-number">${String(numeroDia).padStart(2, "0")}</span>
          <span class="calendar-day-count">${escalasDia.length ? `${escalasDia.length} escala(s)` : "Livre"}</span>
        </div>
        <div class="calendar-day-body">
          ${escalasDia.length
            ? escalasDia.map(escala => `
              <div class="calendar-scale-item">
                <div class="calendar-scale-time">${escala.horario}</div>
                <div class="calendar-scale-name">${escala.voluntarioNome}</div>
                <div class="calendar-scale-role">${escala.funcao || "Sem funcao definida"}</div>
                <div class="calendar-scale-meta">${escala.tipo}</div>
              </div>`).join("")
            : `<div class="calendar-empty-message">Nenhuma pessoa escalada neste dia.</div>`}
        </div>
      </article>`;
  }).join("");

  return `
    <div class="page-title">Calendario Geral</div>
    <div class="page-subtitle">Todos os dias do mes marcados com quem vai servir e o que cada pessoa fara</div>

    <div class="calendar-shell">
      <div class="calendar-toolbar">
        <button class="btn btn-ghost" onclick="alterarCalendarioMes(-1)">Mes anterior</button>
        <div class="calendar-title-block">
          <h2>${formatarMesAnoCalendario(referencia)}</h2>
          <p>${escalasDoMes.length} escala(s) neste mes</p>
        </div>
        <button class="btn btn-ghost" onclick="alterarCalendarioMes(1)">Proximo mes</button>
      </div>

      <div class="calendar-legend">
        <span><i class="calendar-legend-dot calendar-legend-dot-filled"></i> Dia com escala</span>
        <span><i class="calendar-legend-dot"></i> Dia sem escala</span>
      </div>

      <div class="calendar-grid-head">
        ${diasCabecalho.map(dia => `<div>${dia}</div>`).join("")}
      </div>

      <div class="calendar-grid">
        ${calendarioHtml}
      </div>
    </div>

    <div class="section-card">
      <div class="section-header">
        <h3>Resumo do mes</h3>
      </div>
      <div class="section-body">
        ${escalasDoMes.length
          ? `<div class="calendar-month-list">
              ${escalasDoMes.map(escala => `
                <div class="calendar-month-row">
                  <div>
                    <strong>${formatarData(escala.data)}</strong>
                    <span>${escala.horario}</span>
                  </div>
                  <div>${escala.voluntarioNome}</div>
                  <div>${escala.funcao || "-"}</div>
                  <div>${escala.tipo}</div>
                </div>`).join("")}
            </div>`
          : `<div class="alert alert-info">Nenhuma escala cadastrada para este mes.</div>`}
      </div>
    </div>`;
}

function toggleDisponibilidade(key) {
  const vol = getMeuVoluntario();
  if (!vol) return;

  const disp = vol.disponibilidade || [];
  const indisp = vol.indisponibilidade || [];
  const existeDisp = disp.includes(key);
  const existeIndisp = indisp.includes(key);

  if (!existeDisp && !existeIndisp) {
    vol.disponibilidade = [...disp, key];
  } else if (existeDisp) {
    vol.disponibilidade = disp.filter(item => item !== key);
    vol.indisponibilidade = [...indisp, key];
  } else {
    vol.indisponibilidade = indisp.filter(item => item !== key);
  }

  appState.usuarioLogado.disponibilidade = vol.disponibilidade;
  appState.usuarioLogado.indisponibilidade = vol.indisponibilidade;
  renderPagina("disponibilidade");
}

async function salvarDisponibilidade() {
  const vol = getMeuVoluntario();
  const payload = [];

  for (const key of vol.disponibilidade || []) {
    const item = getAvailabilityRequestFromKey(key, "DISPONIVEL");
    if (item) payload.push(item);
  }

  for (const key of vol.indisponibilidade || []) {
    const item = getAvailabilityRequestFromKey(key, "INDISPONIVEL");
    if (item) payload.push(item);
  }

  try {
    await apiRequest("/availabilities/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    await carregarDadosDoUsuario();
    toast("Disponibilidade salva com sucesso.", "success");
    renderPagina("disponibilidade");
  } catch (error) {
    toast(error.message || "Nao foi possivel salvar a disponibilidade.", "danger");
  }
}

Object.assign(window, {
  appState,
  DIAS_SEMANA,
  formatarData,
  normalizeText,
  getCurrentTheme,
  atualizarBotaoTema,
  applyTheme,
  toggleTheme,
  isMobileViewport,
  getIniciais,
  toast,
  abrirModal,
  fecharModal,
  fecharModalDireto,
  prepararTabelasResponsivas,
  nomeVoluntario,
  getDiaPeriodo,
  validarCamposObrigatorios,
  usuarioJaExiste,
  validarHorario,
  validarData,
  verificarConflito,
  detectarTodosConflitos,
  verificarDisponibilidadeNoForm,
  renderizarOpcoesMinisterioCadastro,
  alternarModoLogin,
  carregarMinisteriosCadastro,
  carregarMinisteriosCadastroDados,
  fazerLogin,
  fazerLoginComDados,
  criarConta,
  criarContaComDados,
  fazerLogout,
  iniciarSessaoSalva,
  inicializarInterface,
  toggleMobileMenu,
  fecharMenuMobile,
  sincronizarMenuMobile,
  renderSidebar,
  irPara,
  renderPagina,
  renderDashboardAdmin,
  renderVoluntarios,
  filtrarVoluntarios,
  montarOpcoesMinisterio,
  abrirModalNovoVoluntario,
  salvarNovoVoluntario,
  abrirModalEditarVoluntario,
  salvarEdicaoVoluntario,
  confirmarExcluirVoluntario,
  excluirVoluntario,
  renderDisponibilidades,
  renderEscalas,
  filtrarEscalas,
  montarOpcoesMinisterioEscala,
  montarOpcoesVoluntarioEscala,
  abrirModalNovaEscala,
  atualizarCamposEscala,
  montarPayloadEscala,
  salvarNovaEscala,
  abrirModalEditarEscala,
  salvarEdicaoEscala,
  confirmarExcluirEscala,
  excluirEscala,
  renderConflitos,
  getMeuVoluntario,
  renderDashboardVoluntario,
  renderMinhasEscalas,
  renderDisponibilidadeVol,
  getCalendarioReferencia,
  alterarCalendarioMes,
  formatarMesAnoCalendario,
  montarMapaEscalasPorData,
  renderCalendarioEscalas,
  toggleDisponibilidade,
  salvarDisponibilidade
});
