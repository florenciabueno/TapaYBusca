import type { Equation } from '../types';
import type { AuthContext } from './authContext';
import { requestJson } from './httpClient';

export interface RawEquation {
  id: string;
  equation: string;
  infixExpression?: string | null;
  origin: string;
  status: string;
  steps: number;
  date: string;
  isActive?: boolean;
}

export function mapEquation(raw: RawEquation): Equation {
  return {
    id: raw.id,
    equation: raw.equation,
    ...(raw.infixExpression !== undefined && raw.infixExpression !== null
      ? { infixExpression: raw.infixExpression }
      : {}),
    origin: raw.origin as Equation['origin'],
    status: raw.status as Equation['status'],
    steps: raw.steps,
    date: raw.date,
    ...(raw.isActive !== undefined ? { isActive: raw.isActive } : {}),
  };
}

const equationPathById = (equationId: string, ctx: AuthContext): string =>
  ctx.kind === 'guest'
    ? `/equations/guest/${equationId}`
    : `/equations/${equationId}`;

export const equationsApi = {
  async getEquationById(equationId: string, ctx: AuthContext): Promise<Equation> {
    const raw = await requestJson<RawEquation>({
      path: equationPathById(equationId, ctx),
      ctx,
      fallbackErrorMessage: 'Error al obtener la ecuación',
    });
    return mapEquation(raw);
  },
};
