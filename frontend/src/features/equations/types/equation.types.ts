export type EquationStatus = 'sin comenzar' | 'en proceso' | 'resuelta';
export type EquationOrigin = 'defecto' | 'creada' | 'descargado';

export interface Equation {
  id: string;
  equation: string;
  origin: EquationOrigin;
  status: EquationStatus;
  steps: number;
  date: string;
}
