export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
export const API_URL = `${API_BASE_URL}/api`;

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  DASHBOARD: '/dashboard',
  CREATE_EQUATION: '/crear-ecuacion',
  UPLOAD: '/subir',
  DOWNLOAD: '/descargar',
  RESOLVE_EQUATION: '/ecuacion/:id/resolver',
} as const;

export const resolveEquationPath = (id: string) => `/ecuacion/${id}/resolver`;

export const EQUATIONS_PAGE_SIZE = 12;
