import { useCallback } from 'react';
import { EQUATIONS_PAGE_SIZE } from '../../../config/constants';
import { useEquationsStore } from '../store/equationsSlice';
import { equationService } from '../services/equation.service';
import { useAuthStore } from '../../../stores';

export const useEquationList = () => {
  const {
    equations,
    isLoading,
    error,
    currentPage,
    total,
    totalPages,
    setEquations,
    setLoading,
    setError,
    clearError,
    setPagination,
    setPage,
  } = useEquationsStore();

  const fetchEquations = useCallback(
    async (page?: number) => {
      const pageToFetch = page ?? useEquationsStore.getState().currentPage;
      try {
        setLoading(true);
        clearError();
        const token = useAuthStore.getState().token;
        const result = await equationService.getAllEquations(token, pageToFetch, EQUATIONS_PAGE_SIZE);
        setEquations(result.data);
        setPagination(result.total, result.page, result.totalPages);
        setPage(result.page);
      } catch (err) {
        console.error('Error al cargar ecuaciones:', err);
        setError('Error al cargar las ecuaciones');
      } finally {
        setLoading(false);
      }
    },
    [setEquations, setLoading, setError, clearError, setPagination, setPage]
  );

  const deleteEquation = async (id: string) => {
    try {
      const token = useAuthStore.getState().token;
      await equationService.deleteEquation(id, token);
      clearError();
      const nextPage = equations.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      await fetchEquations(nextPage);
    } catch (err) {
      console.error('Error al eliminar ecuación:', err);
      setError('Error al eliminar la ecuación');
    }
  };

  return {
    equations,
    isLoading,
    error,
    currentPage,
    total,
    totalPages,
    setPage,
    fetchEquations,
    deleteEquation,
    clearError,
  };
};
