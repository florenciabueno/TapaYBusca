export enum EquationStatus {
  SIN_COMENZAR = 'SIN_COMENZAR',
  EN_PROCESO = 'EN_PROCESO',
  RESUELTA = 'RESUELTA',
}

export enum EquationOrigin {
  POR_DEFECTO = 'POR_DEFECTO',
  CREADA = 'CREADA',
  DESCARGADA = 'DESCARGADA',
}

export interface EquationResponse {
  id: string;
  equation: string;
  origin: string;
  status: string;
  steps: number;
  date: string;
  activa: boolean;
}

export interface CreateEquationDto {
  expresion: string;
  userId: string;
}

export interface UpdateEquationUserDto {
  estado?: EquationStatus;
  activa?: boolean;
}
