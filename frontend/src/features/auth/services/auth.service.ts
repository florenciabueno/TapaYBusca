import type { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth.types';
import { loginApi } from '../../../api/auth/login';
import { registerApi } from '../../../api/auth/register';
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../types/passwordReset.types';
import { forgotPasswordApi } from '../../../api/auth/forgot-password';
import { resetPasswordApi } from '../../../api/auth/reset-password';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return loginApi(credentials);
};

export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  return registerApi(credentials);
};

export const requestPasswordReset = async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
  return forgotPasswordApi(data);
};

export const resetPassword = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  return resetPasswordApi(data);
};
