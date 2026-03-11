import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query-keys';
import { equationService } from '../services/equation.service';
import { useAuthStore } from '../../../stores';

export const useUploadableEquations = () => {
  const token = useAuthStore((s) => s.token);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.equations.uploadable(token),
    queryFn: () => equationService.getEquationsForUpload(token),
    enabled: !!token,
  });

  const uploadableEquations = data?.data ?? [];
  const errorMessage =
    error != null
      ? error instanceof Error
        ? error.message
        : 'Error al cargar ecuaciones para subir'
      : null;

  return {
    uploadableEquations,
    isLoading,
    error: errorMessage,
    refetch,
  };
};
