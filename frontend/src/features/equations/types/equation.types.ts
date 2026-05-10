export type EquationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SOLVED';
export type EquationOrigin = 'DEFAULT' | 'CREATED' | 'DOWNLOADED';

export const EQUATION_LIST_STATUS_DELETED = 'DELETED' as const;
export type EquationListStatusFilter = EquationStatus | typeof EQUATION_LIST_STATUS_DELETED;

export interface Equation {
  id: string;
  equation: string;
  /** Infija del servidor (p. ej. pot2(...)); para rellenar inputs sin usar LaTeX. */
  infixExpression?: string | null;
  origin: EquationOrigin;
  status: EquationStatus;
  steps: number;
  date: string;
  isActive?: boolean;
}

export interface ResolutionStep {
  subEquation: string;
  proposedResult: string;
  isCorrect: boolean;
  finishAttempt?: boolean;
  subEquationLatex?: string;
  resultLatex?: string;
}

export interface UploadableEquation {
  id: string;
  equation: string;
  isPublished: boolean;
}

export interface DownloadEquationsParams {
  quantity: number;
  fromDate?: string;
  toDate?: string;
}

export interface DownloadEquationsResult {
  added: number;
  totalRequested: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ORIGIN_LABELS: Record<EquationOrigin, string> = {
  DEFAULT: 'Conjunto inicial',
  CREATED: 'Creada por mí',
  DOWNLOADED: 'Descargada',
};

export const ORIGIN_FILTER_LABELS: Record<EquationOrigin, string> = {
  DEFAULT: 'Conjunto inicial',
  CREATED: 'Creadas por mí',
  DOWNLOADED: 'Descargadas',
};

export const STATUS_LABELS: Record<EquationStatus, string> = {
  NOT_STARTED: 'Sin comenzar',
  IN_PROGRESS: 'En proceso',
  SOLVED: 'Resueltas',
};

export const EQUATION_LIST_STATUS_FILTER_LABELS: Record<EquationListStatusFilter, string> = {
  ...STATUS_LABELS,
  [EQUATION_LIST_STATUS_DELETED]: 'Eliminadas',
};
