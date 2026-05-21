import type { AuthContext } from '../api/authContext';
import { equationsApi, mapEquation, type RawEquation } from '../api/equationsApi';
import { requestJson } from '../api/httpClient';
import { resolutionApi } from '../api/resolutionApi';
import { loadGuestResolutionHistory } from '../storage/guestResolutionHistory';
import { getOrCreateGuestSessionId } from '../storage/guestSession';
import type {
  DownloadEquationsParams,
  DownloadEquationsResult,
  Equation,
  EquationListStatusFilter,
  EquationOrigin,
  PaginatedResponse,
  UploadableEquation,
} from '../types';

const toAuthContext = (token: string | null | undefined): AuthContext | null =>
  token ? { kind: 'auth', token } : null;

const toGuestContext = (guestSessionId: string): AuthContext => ({
  kind: 'guest',
  guestSessionId,
});

function parseDisplayDate(displayDate: string): Date | null {
  const [day, month, year] = displayDate.split('/');
  if (!day || !month || !year) return null;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseIsoDate(isoDate: string | undefined): Date | null {
  if (!isoDate?.trim()) return null;
  const parsed = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateDateRangeOrThrow(fromDate?: string, toDate?: string): void {
  const from = parseIsoDate(fromDate);
  const to = parseIsoDate(toDate);
  if (!from || !to) return;
  if (from.getTime() > to.getTime()) {
    throw new Error('La fecha desde no puede ser posterior a la fecha hasta.');
  }
}

function filterEquationsByDateRange(
  equations: Equation[],
  fromDate?: string,
  toDate?: string
): Equation[] {
  const from = parseIsoDate(fromDate);
  const to = parseIsoDate(toDate);
  if (!from && !to) return equations;

  const fromTime = from?.getTime();
  const toTime = to?.getTime();

  return equations.filter((equation) => {
    const date = parseDisplayDate(equation.date);
    if (!date) return true;
    const value = date.getTime();
    if (fromTime !== undefined && value < fromTime) return false;
    if (toTime !== undefined && value > toTime) return false;
    return true;
  });
}

function paginate<T>(items: T[], page: number, limit: number): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  };
}

async function hydrateGuestProgress(
  baseData: Equation[],
  guestSessionId: string
): Promise<Equation[]> {
  const ctx = toGuestContext(guestSessionId);
  const historyIds = new Set(
    loadGuestResolutionHistory().map((entry) => entry.equationId)
  );
  const idsToHydrate = baseData.map((item) => item.id).filter((id) => historyIds.has(id));

  const entries = await Promise.all(
    idsToHydrate.map(async (equationId) => {
      try {
        const equation = await equationsApi.getEquationById(equationId, ctx);
        return [equationId, equation] as const;
      } catch {
        return [equationId, null] as const;
      }
    })
  );
  const byId = new Map(
    entries.filter((entry): entry is readonly [string, Equation] => entry[1] !== null)
  );

  return baseData.map((item) => byId.get(item.id) ?? item);
}

async function listEquationsForGuest(
  page: number,
  limit: number,
  origins?: EquationOrigin[],
  statuses?: EquationListStatusFilter[],
  fromDate?: string,
  toDate?: string
): Promise<PaginatedResponse<Equation>> {
  const raw = await requestJson<{ data: RawEquation[] }>({
    path: '/equations/public?page=1&limit=500',
    fallbackErrorMessage: 'Error al obtener ecuaciones',
  });
  if (!Array.isArray(raw.data)) {
    throw new Error('Respuesta del servidor no válida al listar ecuaciones.');
  }

  const baseData = raw.data.map(mapEquation);
  const guestSessionId = getOrCreateGuestSessionId();
  let filtered = await hydrateGuestProgress(baseData, guestSessionId);

  if (origins && origins.length > 0) {
    filtered = filtered.filter((equation) => origins.includes(equation.origin));
  }
  if (statuses && statuses.length > 0) {
    filtered = filtered.filter((equation) =>
      statuses.includes(equation.status as EquationListStatusFilter)
    );
  }

  filtered = filterEquationsByDateRange(filtered, fromDate, toDate);
  const sorted = filtered.sort((a, b) => b.date.localeCompare(a.date));
  return paginate(sorted, page, limit);
}

async function listEquationsForAuth(
  token: string,
  page: number,
  limit: number,
  origins?: EquationOrigin[],
  statuses?: EquationListStatusFilter[],
  fromDate?: string,
  toDate?: string
): Promise<PaginatedResponse<Equation>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (origins && origins.length > 0) params.set('origins', origins.join(','));
  if (statuses && statuses.length > 0) params.set('statuses', statuses.join(','));
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);

  const raw = await requestJson<{
    data: RawEquation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    path: `/equations?${params.toString()}`,
    ctx: { kind: 'auth', token },
    fallbackErrorMessage: 'Error al obtener ecuaciones',
  });

  if (!Array.isArray(raw.data)) {
    throw new Error('Respuesta del servidor no válida al listar ecuaciones.');
  }
  return {
    data: raw.data.map(mapEquation),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
    totalPages: raw.totalPages,
  };
}

export const equationService = {
  async getAllEquations(
    token: string | null | undefined,
    page: number,
    limit: number,
    origins?: EquationOrigin[],
    statuses?: EquationListStatusFilter[],
    fromDate?: string,
    toDate?: string
  ): Promise<PaginatedResponse<Equation>> {
    validateDateRangeOrThrow(fromDate, toDate);
    return token
      ? listEquationsForAuth(token, page, limit, origins, statuses, fromDate, toDate)
      : listEquationsForGuest(page, limit, origins, statuses, fromDate, toDate);
  },

  getEquationById(id: string, token?: string | null): Promise<Equation> {
    return equationsApi.getEquationById(id, { kind: 'auth', token: token ?? '' });
  },

  getGuestEquationById(equationId: string, guestSessionId: string): Promise<Equation> {
    return equationsApi.getEquationById(equationId, toGuestContext(guestSessionId));
  },

  async createEquation(equation: string, token?: string | null): Promise<Equation> {
    const raw = await requestJson<RawEquation>({
      path: '/equations',
      method: 'POST',
      body: { equation },
      ctx: toAuthContext(token),
      fallbackErrorMessage: 'Error al crear la ecuación',
      errorStyle: 'simple',
    });
    return mapEquation(raw);
  },

  updateEquation(
    id: string,
    data: { status?: string; steps?: number },
    token?: string | null
  ): Promise<Equation> {
    return requestJson<Equation>({
      path: `/equations/${id}`,
      method: 'PUT',
      body: data,
      ctx: toAuthContext(token),
      fallbackErrorMessage: 'Error al actualizar la ecuación',
    });
  },

  async deleteEquation(id: string, token?: string | null): Promise<void> {
    await requestJson<unknown>({
      path: `/equations/${id}`,
      method: 'DELETE',
      ctx: toAuthContext(token),
      fallbackErrorMessage: 'Error al eliminar la ecuación',
    });
  },

  async getEquationsForUpload(
    token?: string | null
  ): Promise<{ data: UploadableEquation[] }> {
    const raw = await requestJson<{ data?: UploadableEquation[] }>({
      path: '/equations/for-upload',
      ctx: toAuthContext(token),
      fallbackErrorMessage: 'Error al obtener ecuaciones para subir',
    });
    return { data: raw.data ?? [] };
  },

  async uploadEquations(userEquationIds: string[], token?: string | null): Promise<void> {
    await requestJson<unknown>({
      path: '/equations/upload',
      method: 'POST',
      body: { userEquationIds },
      ctx: toAuthContext(token),
      fallbackErrorMessage: 'Error al subir ecuaciones',
      errorStyle: 'simple',
    });
  },

  async downloadEquations(
    params: DownloadEquationsParams,
    token?: string | null
  ): Promise<DownloadEquationsResult> {
    const data = await requestJson<{ added?: number; totalRequested?: number }>({
      path: '/equations/download',
      method: 'POST',
      body: params,
      ctx: toAuthContext(token),
      fallbackErrorMessage: 'Error al descargar ecuaciones',
      errorStyle: 'simple',
    });
    return {
      added: data.added ?? 0,
      totalRequested: data.totalRequested ?? 0,
    };
  },

  resolveStep(
    userEquationId: string,
    payload: { subEquationInfix?: string; answer: string; resolutionStepStatus: number },
    token?: string | null
  ): Promise<{ code: string; message?: string }> {
    return resolutionApi.resolveStep(userEquationId, payload, {
      kind: 'auth',
      token: token ?? '',
    });
  },

  getResolution(userEquationId: string, token?: string | null) {
    return resolutionApi.getResolution(userEquationId, { kind: 'auth', token: token ?? '' });
  },

  finishResolution(
    userEquationId: string,
    token?: string | null
  ): Promise<{ code: string; message?: string }> {
    return resolutionApi.finishResolution(userEquationId, {
      kind: 'auth',
      token: token ?? '',
    });
  },

  resetResolution(userEquationId: string, token?: string | null): Promise<void> {
    return resolutionApi.resetResolution(userEquationId, { kind: 'auth', token: token ?? '' });
  },

  guestResolveStep(
    equationId: string,
    payload: { subEquationInfix?: string; answer: string; resolutionStepStatus: number },
    guestSessionId: string
  ): Promise<{ code: string; message?: string }> {
    return resolutionApi.resolveStep(equationId, payload, toGuestContext(guestSessionId));
  },

  getGuestResolution(equationId: string, guestSessionId: string) {
    return resolutionApi.getResolution(equationId, toGuestContext(guestSessionId));
  },

  guestFinishResolution(
    equationId: string,
    guestSessionId: string
  ): Promise<{ code: string; message?: string }> {
    return resolutionApi.finishResolution(equationId, toGuestContext(guestSessionId));
  },

  guestResetResolution(equationId: string, guestSessionId: string): Promise<void> {
    return resolutionApi.resetResolution(equationId, toGuestContext(guestSessionId));
  },
};
