import type { LoginCredentials, AuthResponse } from '../../features/auth/types';
import { API_BASE_URL } from '../../config/constants';

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Fallo al iniciar sesión. Por favor, inténtelo de nuevo');
  }

  return response.json();
};
