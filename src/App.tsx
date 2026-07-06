import { useEffect } from "react";
import { LoginPanel } from "./components/LoginPanel";

export function App() {
  useEffect(() => {
    window.inicializarInterface();
  }, []);

  return (
    <>
      <button
        id="themeToggleBtn"
        className="theme-toggle"
        type="button"
        onClick={() => window.toggleTheme()}
        aria-label="Ativar tema escuro"
        title="Ativar tema escuro"
      >
        <span className="theme-toggle-icon" id="themeToggleIcon">Lua</span>
        <span className="theme-toggle-label" id="themeToggleLabel">Tema escuro</span>
      </button>

      <LoginPanel />

      <div id="appContainer" className="hidden">
        <header className="app-header">
          <button
            id="mobileMenuToggle"
            className="mobile-menu-toggle"
            type="button"
            onClick={() => window.toggleMobileMenu()}
            aria-label="Abrir menu"
            title="Abrir menu"
          >
            <span />
            <span />
            <span />
          </button>
          <div className="header-brand">
            <img src="img/logo-shekinah.svg" alt="Logo" className="header-logo" />
            <div className="header-brand-text">
              <span className="header-brand-name">Shekinah IAD</span>
              <span className="header-brand-sub">Sistema de Escalas</span>
            </div>
            <span className="header-badge" id="headerBadge">Admin</span>
          </div>
          <div className="header-user">
            <span id="headerNome">Administrador</span>
          </div>
        </header>

        <div className="app-layout">
          <div id="mobileNavBackdrop" className="mobile-nav-backdrop hidden" onClick={() => window.fecharMenuMobile()} />
          <aside className="sidebar" id="sidebar" />
          <main className="main-content" id="mainContent" />
        </div>
      </div>

      <div className="modal-overlay hidden" id="modalOverlay" onClick={event => window.fecharModal(event)}>
        <div className="modal" id="modalContent" />
      </div>

      <div id="toastContainer" />
    </>
  );
}
