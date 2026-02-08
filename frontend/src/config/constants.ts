export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CREATE_EQUATION: '/crear-ecuacion',
  UPLOAD: '/subir',
  DOWNLOAD: '/descargar',
} as const;
