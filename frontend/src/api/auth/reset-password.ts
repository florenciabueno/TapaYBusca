import type { ResetPasswordRequest, ResetPasswordResponse } from '../../features/auth/types';
import { API_BASE_URL } from '../../config/constants';

export const resetPasswordApi = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'No se pudo restablecer la contraseña. Intenta nuevamente.');
  }

  return response.json();
};

