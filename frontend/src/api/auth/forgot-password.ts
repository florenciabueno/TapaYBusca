import type { ForgotPasswordRequest, ForgotPasswordResponse } from '../../features/auth/types';
import { API_BASE_URL } from '../../config/constants';

export const forgotPasswordApi = async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'No se pudo solicitar el restablecimiento. Intenta nuevamente.');
  }

  return response.json();
};

