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

export const ORIGIN_LABELS: Record<EquationOrigin, string> = {
  DEFAULT: 'defecto',
  CREATED: 'creada',
  DOWNLOADED: 'descargado',
};

export const STATUS_LABELS: Record<EquationStatus, string> = {
  NOT_STARTED: 'sin comenzar',
  IN_PROGRESS: 'en proceso',
  SOLVED: 'resuelta',
};
