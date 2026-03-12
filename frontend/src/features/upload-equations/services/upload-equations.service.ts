import { API_URL } from '../../../config/constants';
import type { UploadableEquation } from '../../../shared/types/equations';

const getAuthHeaders = (token?: string | null) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

export const uploadEquationsService = {
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

  async uploadEquations(userEquationIds: string[], token?: string | null): Promise<void> {
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
};
