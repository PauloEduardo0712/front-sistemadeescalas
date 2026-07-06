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

    if (appState.ministerios.length) {
      const ministeriosAtivos = appState.ministerios.filter(item => item.ativo !== false);
      renderizarOpcoesMinisterioCadastro(ministeriosAtivos, valorAtual);
    }

    const ministerios = (await apiRequest("/ministries")).filter(item => item.active !== false);
    renderizarOpcoesMinisterioCadastro(ministerios, valorAtual);
  } catch (error) {
    const select = document.getElementById("cadastroMinisterio");
    select.innerHTML = `<option value="">Nao foi possivel carregar os ministerios</option>`;
    select.disabled = true;
    toast(error.message || "Nao foi possivel carregar os ministerios.", "danger");
  }
}

async function fazerLogin() {
  const usuario = document.getElementById("loginUsuario").value.trim();
  const senha = document.getElementById("loginSenha").value.trim();
  const perfilSelecionado = document.getElementById("loginPerfil").value;

  if (!usuario || !senha) {
    toast("Preencha usuario e senha.", "danger");
    return;
  }

  try {
    const auth = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: usuario, password: senha })
    });

    const perfilApi = auth.role === "ADMIN" ? "admin" : "voluntario";
    if (perfilApi !== perfilSelecionado) {
      toast("O perfil selecionado nao corresponde ao usuario informado.", "warning");
      return;
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
  } catch (error) {
    toast(error.message || "Nao foi possivel fazer login.", "danger");
  }
}

async function criarConta() {
  const nome = document.getElementById("cadastroNome").value.trim();
  const usuario = document.getElementById("cadastroUsuario").value.trim();
  const senha = document.getElementById("cadastroSenha").value.trim();
  const ministryId = Number(document.getElementById("cadastroMinisterio").value);
  const email = document.getElementById("cadastroEmail").value.trim();
  const telefone = document.getElementById("cadastroTelefone").value.trim();

  const erro = validarCamposObrigatorios({
    Nome: nome,
    Usuario: usuario,
    Senha: senha,
    Ministerio: ministryId || ""
  });

  if (erro) {
    toast(erro, "danger");
    return;
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
  } catch (error) {
    toast(error.message || "Nao foi possivel criar sua conta.", "danger");
  }
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

document.addEventListener("DOMContentLoaded", () => {
  iniciarSessaoSalva();
  alternarModoLogin("entrar");
  carregarMinisteriosCadastro();
  sincronizarMenuMobile();
});

document.addEventListener("keydown", e => {
  if (e.key === "Enter" && !document.getElementById("telaLogin").classList.contains("hidden")) {
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
