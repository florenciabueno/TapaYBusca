import { LoginCredentials, RegisterCredentials } from '../types/auth.types.js';

export const validateLoginCredentials = (credentials: LoginCredentials): { isValid: boolean; errors: { email?: string; password?: string } } => {
  const errors: { email?: string; password?: string } = {};

  if (!credentials.email || !credentials.email.includes('@')) {
    errors.email = 'Email inválido';
  }

  if (!credentials.password || credentials.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateRegisterCredentials = (credentials: RegisterCredentials): { isValid: boolean; errors: { name?: string; email?: string; password?: string } } => {
  const errors: { name?: string; email?: string; password?: string } = {};

  if (!credentials.name || credentials.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!credentials.email || !credentials.email.includes('@')) {
    errors.email = 'Email inválido';
  }

  if (!credentials.password || credentials.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
