import type { RegisterCredentials, AuthResponse } from '../../features/auth/types';
import { API_BASE_URL } from '../../config/constants';

export const registerApi = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error en el registro. Por favor intenta nuevamente.');
  }

  return response.json();
};
