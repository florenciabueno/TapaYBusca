export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  passwordHash: string;
}

export type LoginValidationErrors = Partial<Record<keyof LoginCredentials, string>>;

export type RegisterValidationErrors = Partial<Record<keyof RegisterCredentials, string>>;

export type { ValidationResult } from '../../shared/types/validation.types.js';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}
