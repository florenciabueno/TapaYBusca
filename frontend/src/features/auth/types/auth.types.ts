import type { User } from '../../../shared/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface AuthError {
  message: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
