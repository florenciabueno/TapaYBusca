import { LoginCredentials } from '../types/auth.types';

export const validateLoginCredentials = (credentials: LoginCredentials): { isValid: boolean; errors: { email?: string; password?: string } } => {
  const errors: { email?: string; password?: string } = {};

  if (!credentials.email || !credentials.email.includes('@')) {
    errors.email = 'Email inválido';
  }

  if (!credentials.password || credentials.password.length < 4) {
    errors.password = 'La contraseña debe tener al menos 4 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
