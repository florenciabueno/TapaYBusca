import { API_URL } from '../../../config/constants';
import type { DownloadEquationsParams, DownloadEquationsResult } from '../../../shared/types/equations';

const getAuthHeaders = (token?: string | null) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

export const downloadEquationsService = {
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
