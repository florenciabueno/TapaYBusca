export enum EquationStatus {
  SIN_COMENZAR = 'SIN_COMENZAR',
  EN_PROCESO = 'EN_PROCESO',
  RESUELTA = 'RESUELTA',
}

export enum EquationOrigin {
  MANUAL = 'MANUAL',
  IMPORTADO = 'IMPORTADO',
  DESCARGADO = 'DESCARGADO',
  DEFECTO = 'DEFECTO',
}

export interface Equation {
  id: string;
  equation: string;
  origin: EquationOrigin;
  status: EquationStatus;
  steps: number;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEquationDto {
  equation: string;
  origin?: EquationOrigin;
  userId?: string;
}

export interface UpdateEquationDto {
  equation?: string;
  status?: EquationStatus;
  steps?: number;
}

export interface EquationResponse {
  id: string;
  equation: string;
  origin: string;
  status: string;
  steps: number;
  date: string;
}
