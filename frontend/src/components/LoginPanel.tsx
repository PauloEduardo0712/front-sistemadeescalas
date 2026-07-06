import { FormEvent, useEffect, useState } from "react";
import type { Ministry, UserRole } from "../types";

type LoginMode = "entrar" | "cadastro";

const initialRegisterForm = {
  nome: "",
  usuario: "",
  senha: "",
  ministryId: "",
  email: "",
  telefone: ""
};

export function LoginPanel() {
  const [mode, setMode] = useState<LoginMode>("entrar");
  const [loginForm, setLoginForm] = useState({
    usuario: "admin",
    senha: "1234",
    perfil: "admin" as UserRole
  });
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loadingMinistries, setLoadingMinistries] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadMinistries() {
      setLoadingMinistries(true);
      try {
        const data = await window.carregarMinisteriosCadastroDados();
        if (active) setMinistries(data);
      } finally {
        if (active) setLoadingMinistries(false);
      }
    }

    loadMinistries();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function resetPassword() {
      setLoginForm(current => ({ ...current, senha: "" }));
    }

    window.addEventListener("shekinah:logout", resetPassword);
    return () => window.removeEventListener("shekinah:logout", resetPassword);
  }, []);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await window.fazerLoginComDados({
      usuario: loginForm.usuario.trim(),
      senha: loginForm.senha.trim(),
      perfilSelecionado: loginForm.perfil
    });
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const success = await window.criarContaComDados({
      nome: registerForm.nome.trim(),
      usuario: registerForm.usuario.trim(),
      senha: registerForm.senha.trim(),
      ministryId: Number(registerForm.ministryId),
      email: registerForm.email.trim(),
      telefone: registerForm.telefone.trim()
    });

    if (success) setRegisterForm(initialRegisterForm);
  }

  return (
    <div id="telaLogin" className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="img/logo-shekinah.svg" alt="Shekinah IAD" />
          <h2>Sistema de Escalas<br />Ministeriais</h2>
          <p>Igreja Shekinah IAD - Um projeto de Deus</p>
        </div>

        <div className="login-divider" />

        <div className="login-switch">
          <button
            id="abaEntrar"
            className={`login-switch-btn ${mode === "entrar" ? "active" : ""}`}
            type="button"
            onClick={() => setMode("entrar")}
          >
            Entrar
          </button>
          <button
            id="abaCriarConta"
            className={`login-switch-btn ${mode === "cadastro" ? "active" : ""}`}
            type="button"
            onClick={() => setMode("cadastro")}
          >
            Criar conta
          </button>
        </div>

        <form id="painelLogin" className={mode === "entrar" ? "" : "hidden"} onSubmit={handleLoginSubmit}>
          <div className="login-field">
            <label>Usuario</label>
            <input
              type="text"
              id="loginUsuario"
              placeholder="Digite seu usuario"
              value={loginForm.usuario}
              onChange={event => setLoginForm({ ...loginForm, usuario: event.target.value })}
            />
          </div>
          <div className="login-field">
            <label>Senha</label>
            <input
              type="password"
              id="loginSenha"
              placeholder="Digite sua senha"
              value={loginForm.senha}
              onChange={event => setLoginForm({ ...loginForm, senha: event.target.value })}
            />
          </div>
          <div className="login-field">
            <label>Perfil de acesso</label>
            <select
              id="loginPerfil"
              value={loginForm.perfil}
              onChange={event => setLoginForm({ ...loginForm, perfil: event.target.value as UserRole })}
            >
              <option value="admin">Administrador</option>
              <option value="voluntario">Voluntario</option>
            </select>
          </div>

          <button className="btn-login" type="submit">Entrar no sistema</button>

          <div className="login-hint">
            <strong>Admin:</strong> admin / 1234
            &nbsp;|&nbsp;
            <strong>Voluntario:</strong> joao, maria, carlos, ana, pedro - senha: 1234
          </div>
        </form>

        <form id="painelCadastro" className={mode === "cadastro" ? "" : "hidden"} onSubmit={handleRegisterSubmit}>
          <div className="login-field">
            <label>Nome completo</label>
            <input
              type="text"
              id="cadastroNome"
              placeholder="Seu nome completo"
              value={registerForm.nome}
              onChange={event => setRegisterForm({ ...registerForm, nome: event.target.value })}
            />
          </div>
          <div className="login-field">
            <label>Usuario</label>
            <input
              type="text"
              id="cadastroUsuario"
              placeholder="Escolha um usuario"
              value={registerForm.usuario}
              onChange={event => setRegisterForm({ ...registerForm, usuario: event.target.value })}
            />
          </div>
          <div className="login-field">
            <label>Senha</label>
            <input
              type="password"
              id="cadastroSenha"
              placeholder="Crie uma senha"
              value={registerForm.senha}
              onChange={event => setRegisterForm({ ...registerForm, senha: event.target.value })}
            />
          </div>
          <div className="login-field">
            <label>Ministerio</label>
            <select
              id="cadastroMinisterio"
              value={registerForm.ministryId}
              disabled={loadingMinistries || ministries.length === 0}
              onChange={event => setRegisterForm({ ...registerForm, ministryId: event.target.value })}
            >
              <option value="">
                {loadingMinistries
                  ? "Carregando ministerios..."
                  : ministries.length
                    ? "Selecione um ministerio"
                    : "Nenhum ministerio ativo disponivel"}
              </option>
              {ministries.map(ministry => (
                <option key={ministry.id} value={ministry.id}>
                  {ministry.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="login-grid">
            <div className="login-field">
              <label>E-mail</label>
              <input
                type="email"
                id="cadastroEmail"
                placeholder="email@exemplo.com"
                value={registerForm.email}
                onChange={event => setRegisterForm({ ...registerForm, email: event.target.value })}
              />
            </div>
            <div className="login-field">
              <label>Telefone</label>
              <input
                type="text"
                id="cadastroTelefone"
                placeholder="(00) 00000-0000"
                value={registerForm.telefone}
                onChange={event => setRegisterForm({ ...registerForm, telefone: event.target.value })}
              />
            </div>
          </div>

          <button className="btn-login" type="submit">Criar conta e entrar</button>

          <div className="login-hint">
            Seu cadastro cria um login de voluntario e salva seus dados no banco do sistema.
          </div>
        </form>

        <p className="login-footer">Shekinah IAD &copy; 2026 - Todos os direitos reservados</p>
      </div>
    </div>
  );
}
