import { useAuthStore } from '../store/authSlice';
import { login as loginService } from '../services/auth.service';
import type { LoginCredentials } from '../types';

export const useAuth = () => {
  const { user, isLoading, error, login: setUser, logout, setLoading, setError, clearError } = useAuthStore();

  const isAuthenticated = user !== null;

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      clearError();
      const response = await loginService(credentials);
      setUser(response.user);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error durante el inicio de sesión';
      setError(errorMessage);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
};
