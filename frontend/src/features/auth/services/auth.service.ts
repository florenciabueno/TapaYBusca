import type { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth.types';
import { loginApi } from '../../../api/auth/login';
import { registerApi } from '../../../api/auth/register';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return loginApi(credentials);
};

export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  return registerApi(credentials);
};
