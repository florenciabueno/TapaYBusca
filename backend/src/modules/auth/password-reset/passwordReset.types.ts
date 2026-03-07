export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

export type ForgotPasswordValidationErrors = Partial<Record<keyof ForgotPasswordBody, string>>;
export type ResetPasswordValidationErrors = Partial<Record<keyof ResetPasswordBody, string>>;

export type { ValidationResult } from '../../../shared/types/validation.types.js';

export interface PasswordResetMessageResponse {
  message: string;
}

