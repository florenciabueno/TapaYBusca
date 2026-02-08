export type EquationStatus = 'pendiente' | 'resuelta' | 'en_proceso';
export type EquationOrigin = 'manual' | 'importado';

export interface Equation {
  id: string;
  equation: string;
  origin: EquationOrigin;
  status: EquationStatus;
  steps: number;
  date: string;
}
