import { API_URL } from '../../../config/constants';
import type {
  Equation,
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

function mapItem(eq: { id: string; equation: string; origin: string; status: string; steps: number; date: string }): Equation {
  return {
    id: eq.id,
    equation: eq.equation,
    origin: eq.origin as Equation['origin'],
    status: eq.status as Equation['status'],
    steps: eq.steps,
    date: eq.date,
  };
}

export const equationService = {
  async getAllEquations(
    token: string | null | undefined,
    page: number,
    limit: number,
    origins?: EquationOrigin[]
  ): Promise<PaginatedResponse<Equation>> {
    const endpoint = token ? `${API_URL}/equations` : `${API_URL}/equations/public`;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (origins && origins.length > 0) {
      params.set('origins', origins.join(','));
    }
    const url = `${endpoint}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al obtener ecuaciones');
    }

    const raw = await response.json();
    return {
      data: raw.data.map(mapItem),
      total: raw.total,
      page: raw.page,
      limit: raw.limit,
      totalPages: raw.totalPages,
    };
  },

  async getEquationById(id: string, token?: string | null): Promise<Equation> {
    const response = await fetch(`${API_URL}/equations/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al obtener la ecuación');
    }

    return response.json();
  },

  async createEquation(equation: string, token?: string | null): Promise<Equation> {
    const response = await fetch(`${API_URL}/equations`, {
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
    const response = await fetch(`${API_URL}/equations/${id}`, {
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
    const response = await fetch(`${API_URL}/equations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar la ecuación');
    }
  },

  async getEquationsForUpload(token?: string | null): Promise<{ data: UploadableEquation[] }> {
    const response = await fetch(`${API_URL}/equations/for-upload`, {
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
    const response = await fetch(`${API_URL}/equations/upload`, {
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
    const response = await fetch(`${API_URL}/equations/download`, {
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
};
