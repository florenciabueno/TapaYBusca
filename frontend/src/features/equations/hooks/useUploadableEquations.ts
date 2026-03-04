import { useCallback, useEffect, useState } from 'react';
import { equationService } from '../services/equation.service';
import { useAuthStore } from '../../../stores';
import type { UploadableEquation } from '../types';

export const useUploadableEquations = () => {
  const token = useAuthStore((s) => s.token);
  const [uploadableEquations, setUploadableEquations] = useState<UploadableEquation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUploadable = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await equationService.getEquationsForUpload(token);
      setUploadableEquations(result.data);
    } catch (err) {
      console.error('Error fetching equations for upload:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar ecuaciones para subir');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUploadable();
  }, [fetchUploadable]);

  return {
    uploadableEquations,
    isLoading,
    error,
    refetch: fetchUploadable,
  };
};
