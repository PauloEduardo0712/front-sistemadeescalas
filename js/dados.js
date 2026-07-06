/* =============================================
   DADOS.JS - Estado global e integracao com API
   ============================================= */

const API_BASE_URL = "http://localhost:8081/api";
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
