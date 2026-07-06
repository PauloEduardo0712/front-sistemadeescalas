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
