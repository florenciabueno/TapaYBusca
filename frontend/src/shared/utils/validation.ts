export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return 'El email es requerido';
  }
  if (!isValidEmail(email)) {
    return 'Email inválido';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'La contraseña es requerida';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name.trim()) {
    return 'El nombre es requerido';
  }
  if (name.trim().length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  return null;
};

export const MSG_CONFIRM_PASSWORD_REQUIRED = 'Confirma la contraseña';
export const MSG_PASSWORDS_DONT_MATCH = 'Las contraseñas no coinciden';

export const createConfirmPasswordValidator = (
  passwordToMatch: string
): ((value: string) => string | null) => {
  return (value: string): string | null => {
    if (!value) return MSG_CONFIRM_PASSWORD_REQUIRED;
    if (value !== passwordToMatch) return MSG_PASSWORDS_DONT_MATCH;
    return null;
  };
};
