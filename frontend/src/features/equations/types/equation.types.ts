export type EquationStatus = 'pendiente' | 'resuelta' | 'en_proceso';
export type EquationOrigin = 'creada' | 'importado';

export interface Equation {
  id: string;
  equation: string;
  origin: EquationOrigin;
  status: EquationStatus;
  steps: number;
  date: string;
}
