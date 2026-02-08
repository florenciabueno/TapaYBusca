import type { LoginCredentials, AuthResponse } from '../types';
import { loginApi } from '../../../api/auth/login';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return loginApi(credentials);
};
