export type EquationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SOLVED';
export type EquationOrigin = 'DEFAULT' | 'CREATED' | 'DOWNLOADED';

export interface Equation {
  id: string;
  equation: string;
  origin: EquationOrigin;
  status: EquationStatus;
  steps: number;
  date: string;
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
  SOLVED: 'Resuelta',
};
