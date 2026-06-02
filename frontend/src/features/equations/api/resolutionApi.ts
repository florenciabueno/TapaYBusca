import type { ResolutionStep } from '../types';
import type { AuthContext } from './authContext';
import { requestJson } from './httpClient';

const basePath = (equationId: string, ctx: AuthContext): string =>
  ctx.kind === 'guest'
    ? `/equations/guest/${equationId}`
    : `/equations/${equationId}`;

export interface ResolveStepPayload {
  subEquationInfix?: string;
  answer: string;
  resolutionStepStatus: number;
}

export interface ResolveStepResult {
  code: string;
  message?: string;
}

export interface ResolutionData {
  userEquation: unknown;
  steps: ResolutionStep[];
  solutionSet: number[];
  solutionSetLatex?: string[];
  expectedDistinctSolutionCount: number;
  currentResolutionId: number;
}

export const resolutionApi = {
  getResolution(equationId: string, ctx: AuthContext): Promise<ResolutionData | null> {
    return requestJson<ResolutionData>({
      path: `${basePath(equationId, ctx)}/resolution`,
      ctx,
      fallbackErrorMessage: 'Error al obtener la resolución',
      treat404AsNull: true,
    });
  },

  async resolveStep(
    equationId: string,
    payload: ResolveStepPayload,
    ctx: AuthContext
  ): Promise<ResolveStepResult> {
    const data = await requestJson<{ code?: string; message?: string }>({
      path: `${basePath(equationId, ctx)}/resolve`,
      method: 'POST',
      body: payload,
      ctx,
      fallbackErrorMessage: 'Error al validar el paso',
      errorStyle: 'simple',
    });
    return { code: data.code ?? 'PI', message: data.message };
  },

  async finishResolution(equationId: string, ctx: AuthContext): Promise<ResolveStepResult> {
    const data = await requestJson<{ code?: string; message?: string }>({
      path: `${basePath(equationId, ctx)}/finish-resolution`,
      method: 'POST',
      ctx,
      fallbackErrorMessage: 'Error al finalizar la resolución',
      errorStyle: 'simple',
    });
    return { code: data.code ?? 'MS', message: data.message };
  },

  async resetResolution(equationId: string, ctx: AuthContext): Promise<void> {
    await requestJson<unknown>({
      path: `${basePath(equationId, ctx)}/reset-resolution`,
      method: 'POST',
      ctx,
      fallbackErrorMessage: 'Error al reiniciar',
      errorStyle: 'simple',
    });
  },
};
