export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 4;
};

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return 'El usuario es requerido';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'La contraseña es requerida';
  }
  if (!isValidPassword(password)) {
    return 'La contraseña debe tener al menos 4 caracteres';
  }
  return null;
};
