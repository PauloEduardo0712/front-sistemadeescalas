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
