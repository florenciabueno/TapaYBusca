import type { LoginCredentials, AuthResponse } from '../types';
import type { User } from '../../../shared/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateMockUser = (username: string): User => ({
  id: '1',
  email: username,
  name: username,
});

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  await delay(1000);

  if (credentials.password && credentials.password.length >= 4) {
    return {
      user: generateMockUser(credentials.email),
      token: 'mock-jwt-token',
    };
  }

  throw new Error('Usuario o contraseña inválidos. Por favor verifica tus credenciales e intenta nuevamente.');
};
