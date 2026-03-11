import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores';
import { login as loginService, register as registerService } from '../services/auth.service';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const useAuth = () => {
  const { user, token, setUserAndToken, logout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: loginService,
    onSuccess: (response) => {
      setUserAndToken(response.user, response.token || '');
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerService,
    onSuccess: (response) => {
      setUserAndToken(response.user, response.token || '');
    },
  });

  const isAuthenticated = user !== null;
  const isLoading = loginMutation.isPending || registerMutation.isPending;
  const error =
    loginMutation.error ?? registerMutation.error ?? null;
  const errorMessage =
    error != null
      ? error instanceof Error
        ? error.message
        : 'Ocurrió un error'
      : null;

  const clearError = () => {
    loginMutation.reset();
    registerMutation.reset();
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      await loginMutation.mutateAsync(credentials);
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      await registerMutation.mutateAsync(credentials);
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error: errorMessage,
    login,
    register,
    logout,
    clearError,
  };
};
