export type UserRole = "admin" | "voluntario";
export type ThemeName = "light" | "dark";
export type AvailabilityStatus = "DISPONIVEL" | "INDISPONIVEL";
export type TimeSlot = "MANHA" | "NOITE";

export interface LoggedUser {
  id: number | string;
  nome: string;
  usuario: string;
  perfil: UserRole;
  ministerio?: string;
  ministerioIds?: number[];
  disponibilidade?: string[];
  indisponibilidade?: string[];
  obs?: string;
}

export interface Ministry {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
}

export interface Volunteer {
  id: number;
  nome: string;
  usuario: string;
  email: string;
  telefone: string;
  obs: string;
  ativo: boolean;
  ministerios: Ministry[];
  ministerioIds: number[];
  ministerio: string;
  disponibilidade: string[];
  indisponibilidade: string[];
}

export interface Schedule {
  id: number;
  tipo: string;
  ministryId: number | null;
  data: string;
  horario: string;
  timeSlot: TimeSlot;
  voluntarioId: number | null;
  voluntarioNome: string;
  funcao: string;
  local: string;
  culto: string;
  turma: string;
  professor: string;
  auxiliar: string;
  tema: string;
  lanche: string;
  focoPrayer: string;
  conflito: boolean;
  conflitoMsg: string;
}

export interface AppState {
  token: string | null;
  usuarioLogado: LoggedUser | null;
  paginaAtual: string;
  calendarioReferencia: string | null;
  ministerios: Ministry[];
  voluntarios: Volunteer[];
  escalas: Schedule[];
  conflitos: unknown[];
}
