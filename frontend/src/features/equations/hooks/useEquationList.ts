import { useCallback } from 'react';
import { useEquationsStore } from '../store/equationsSlice';
import { equationService } from '../services/equation.service';
import { useAuthStore } from '../../../stores';

export const useEquationList = () => {
  const {
    equations,
    isLoading,
    error,
    setEquations,
    setLoading,
    setError,
    clearError,
  } = useEquationsStore();

  const fetchEquations = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const token = useAuthStore.getState().token;
      const data = await equationService.getAllEquations(token);
      setEquations(data);
    } catch (err) {
      console.error('Error al cargar ecuaciones:', err);
      setError('Error al cargar las ecuaciones');
    } finally {
      setLoading(false);
    }
  }, [setEquations, setLoading, setError, clearError]);

  const deleteEquation = async (id: string) => {
    try {
      const token = useAuthStore.getState().token;
      await equationService.deleteEquation(id, token);
      clearError();
      await fetchEquations();
    } catch (err) {
      console.error('Error al eliminar ecuación:', err);
      setError('Error al eliminar la ecuación');
    }
  };

  return {
    equations,
    isLoading,
    error,
    fetchEquations,
    deleteEquation,
    clearError,
  };
};
