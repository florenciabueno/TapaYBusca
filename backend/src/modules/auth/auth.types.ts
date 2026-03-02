export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

/** Payload para crear usuario en el repository (nunca contraseña en claro) */
export interface CreateUserPayload {
  email: string;
  name: string;
  passwordHash: string;
}

export type LoginValidationErrors = Partial<Record<keyof LoginCredentials, string>>;

export type RegisterValidationErrors = Partial<Record<keyof RegisterCredentials, string>>;

export interface ValidationResult<T = Record<string, string | undefined>> {
  isValid: boolean;
  errors: T;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}
