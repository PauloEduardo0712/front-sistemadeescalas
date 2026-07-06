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

  if (icon) icon.textContent = temaEscuro ? "☀" : "☾";
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

document.addEventListener("DOMContentLoaded", () => {
  applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || getCurrentTheme());
});

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
