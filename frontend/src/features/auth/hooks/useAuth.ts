import { useAuthStore } from '../store/authSlice';
import { login as loginService, register as registerService } from '../services/auth.service';
import type { LoginCredentials, RegisterCredentials } from '../types';

export const useAuth = () => {
  const { user, token, isLoading, error, login: setUserAndToken, logout, setLoading, setError, clearError } = useAuthStore();

  const isAuthenticated = user !== null;

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      clearError();
      const response = await loginService(credentials);
      setUserAndToken(response.user, response.token || '');
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error durante el inicio de sesión';
      setError(errorMessage);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setLoading(true);
      clearError();
      const response = await registerService(credentials);
      setUserAndToken(response.user, response.token || '');
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error durante el registro';
      setError(errorMessage);
      return { success: false };
    } finally {
      setLoading(false);
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
