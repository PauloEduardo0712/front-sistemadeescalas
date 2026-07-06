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
