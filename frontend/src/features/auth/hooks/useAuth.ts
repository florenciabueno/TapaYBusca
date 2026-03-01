import { useState } from 'react';
import { useAuthStore } from '../../../stores';
import { login as loginService, register as registerService } from '../services/auth.service';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const useAuth = () => {
  const { user, token, setUserAndToken, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  const clearError = () => setError(null);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await loginService(credentials);
      setUserAndToken(response.user, response.token || '');
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error durante el inicio de sesión';
      setError(errorMessage);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await registerService(credentials);
      setUserAndToken(response.user, response.token || '');
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error durante el registro';
      setError(errorMessage);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
};
