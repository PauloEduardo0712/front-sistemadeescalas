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
