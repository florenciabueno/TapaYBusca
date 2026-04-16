import { API_URL } from '../../../config/constants';
import { apiFetch } from '../../../shared/utils/apiFetch';
import { getErrorMessageFromResponse } from '../../../shared/utils/httpErrorMessage';
import type {
  Equation,
  EquationListStatusFilter,
  EquationOrigin,
  PaginatedResponse,
  UploadableEquation,
  DownloadEquationsParams,
  DownloadEquationsResult,
} from '../types';

const getAuthHeaders = (token?: string | null) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

function mapItem(eq: {
  id: string;
  equation: string;
  origin: string;
  status: string;
  steps: number;
  date: string;
  isActive?: boolean;
}): Equation {
  return {
    id: eq.id,
    equation: eq.equation,
    origin: eq.origin as Equation['origin'],
    status: eq.status as Equation['status'],
    steps: eq.steps,
    date: eq.date,
    ...(eq.isActive !== undefined ? { isActive: eq.isActive } : {}),
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
    const endpoint = token ? `${API_URL}/equations` : `${API_URL}/equations/public`;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (origins && origins.length > 0) {
      params.set('origins', origins.join(','));
    }
    if (statuses && statuses.length > 0) {
      params.set('statuses', statuses.join(','));
    }
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    const url = `${endpoint}?${params.toString()}`;

    const response = await apiFetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    if (!response.ok) {
      const message = await getErrorMessageFromResponse(response, 'Error al obtener ecuaciones');
      throw new Error(message);
    }

    const raw = await response.json();
    if (!Array.isArray(raw.data)) {
      throw new Error('Respuesta del servidor no válida al listar ecuaciones.');
    }
    return {
      data: raw.data.map(mapItem),
      total: raw.total,
      page: raw.page,
      limit: raw.limit,
      totalPages: raw.totalPages,
    };
  },

  async getEquationById(id: string, token?: string | null): Promise<Equation> {
    const response = await apiFetch(`${API_URL}/equations/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    if (!response.ok) {
      const message = await getErrorMessageFromResponse(response, 'Error al obtener la ecuación');
      throw new Error(message);
    }

    const raw = (await response.json()) as Parameters<typeof mapItem>[0];
    return mapItem(raw);
  },

  async createEquation(equation: string, token?: string | null): Promise<Equation> {
    const response = await apiFetch(`${API_URL}/equations`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ equation }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : 'Error al crear la ecuación';
      throw new Error(message);
    }

    return mapItem(data);
  },

  async updateEquation(id: string, data: { status?: string; steps?: number }, token?: string | null): Promise<Equation> {
    const response = await apiFetch(`${API_URL}/equations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la ecuación');
    }

    return response.json();
  },

  async deleteEquation(id: string, token?: string | null): Promise<void> {
    const response = await apiFetch(`${API_URL}/equations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar la ecuación');
    }
  },

  async getEquationsForUpload(token?: string | null): Promise<{ data: UploadableEquation[] }> {
    const response = await apiFetch(`${API_URL}/equations/for-upload`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al obtener ecuaciones para subir');
    }

    const raw = await response.json();
    return { data: raw.data ?? [] };
  },

  async uploadEquations(
    userEquationIds: string[],
    token?: string | null
  ): Promise<void> {
    const response = await apiFetch(`${API_URL}/equations/upload`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ userEquationIds }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : 'Error al subir ecuaciones';
      throw new Error(message);
    }
  },

  async downloadEquations(
    params: DownloadEquationsParams,
    token?: string | null
  ): Promise<DownloadEquationsResult> {
    const response = await apiFetch(`${API_URL}/equations/download`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(params),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : 'Error al descargar ecuaciones';
      throw new Error(message);
    }

    return {
      added: data.added ?? 0,
      totalRequested: data.totalRequested ?? 0,
    };
  },

  async resolveStep(
    userEquationId: string,
    payload: {
      subEquationInfix?: string;
      answer: string;
      resolutionStepStatus: number;
    },
    token?: string | null
  ): Promise<{ code: string; message?: string }> {
    const response = await apiFetch(`${API_URL}/equations/${userEquationId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : 'Error al validar el paso';
      throw new Error(message);
    }

    return { code: data.code ?? 'PI', message: data.message };
  },

  async getResolution(
    userEquationId: string,
    token?: string | null
  ): Promise<{
    userEquation: unknown;
    steps: Array<{
      subEquation: string;
      proposedResult: string;
      isCorrect: boolean;
      subEquationLatex?: string;
      resultLatex?: string;
    }>;
    solutionSet: number[];
    expectedDistinctSolutionCount: number;
    currentResolutionId: number;
  } | null> {
    const response = await apiFetch(`${API_URL}/equations/${userEquationId}/resolution`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Error al obtener la resolución');
    }

    return response.json();
  },

  async finishResolution(
    userEquationId: string,
    token?: string | null
  ): Promise<{ code: string; message?: string }> {
    const response = await apiFetch(`${API_URL}/equations/${userEquationId}/finish-resolution`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : 'Error al finalizar la resolución';
      throw new Error(message);
    }

    return { code: data.code ?? 'MS', message: data.message };
  },

  async resetResolution(userEquationId: string, token?: string | null): Promise<void> {
    const response = await apiFetch(`${API_URL}/equations/${userEquationId}/reset-resolution`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : 'Error al reiniciar';
      throw new Error(message);
    }
  },
};
