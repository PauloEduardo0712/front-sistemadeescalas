export {};

import type { Ministry, UserRole } from "./types";

declare global {
  interface Window {
    toggleTheme: () => void;
    alternarModoLogin: (modo: "entrar" | "cadastro") => void;
    fazerLogin: () => void;
    criarConta: () => void;
    toggleMobileMenu: () => void;
    fecharMenuMobile: () => void;
    fecharModal: (event: MouseEvent | React.MouseEvent<HTMLElement>) => void;
    inicializarInterface: () => void;
    carregarMinisteriosCadastroDados: () => Promise<Ministry[]>;
    fazerLoginComDados: (payload: {
      usuario: string;
      senha: string;
      perfilSelecionado: UserRole;
    }) => Promise<boolean>;
    criarContaComDados: (payload: {
      nome: string;
      usuario: string;
      senha: string;
      ministryId: number;
      email: string;
      telefone: string;
    }) => Promise<boolean>;
  }
}
