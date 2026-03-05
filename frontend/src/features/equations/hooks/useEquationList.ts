import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EQUATIONS_PAGE_SIZE } from '../../../config/constants';
import { useEquationsStore } from '../store/equationsSlice';
import { equationService } from '../services/equation.service';
import { useAuthStore } from '../../../stores';
import type { EquationOrigin, EquationStatus } from '../types';

const ORIGINS_PARAM = 'origins';
const STATUSES_PARAM = 'statuses';
const FROM_DATE_PARAM = 'fromDate';
const TO_DATE_PARAM = 'toDate';
const VALID_ORIGINS: EquationOrigin[] = ['DEFAULT', 'CREATED', 'DOWNLOADED'];
const VALID_STATUSES: EquationStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'SOLVED'];

function parseOriginsFromUrl(searchParams: URLSearchParams): EquationOrigin[] | undefined {
  const raw = searchParams.get(ORIGINS_PARAM);
  if (!raw || raw.trim() === '') return undefined;
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter((v): v is EquationOrigin => VALID_ORIGINS.includes(v as EquationOrigin));
  return parsed.length === 0 ? undefined : parsed;
}

function parseStatusesFromUrl(searchParams: URLSearchParams): EquationStatus[] | undefined {
  const raw = searchParams.get(STATUSES_PARAM);
  if (!raw || raw.trim() === '') return undefined;
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter((v): v is EquationStatus => VALID_STATUSES.includes(v as EquationStatus));
  return parsed.length === 0 ? undefined : parsed;
}

export const useEquationList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
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

  const pageFromUrl = Number(searchParams.get('page') || 1);
  const selectedOrigins = useMemo(() => parseOriginsFromUrl(searchParams), [searchParams]);
  const selectedStatuses = useMemo(() => parseStatusesFromUrl(searchParams), [searchParams]);
  const fromDate = searchParams.get(FROM_DATE_PARAM) || undefined;
  const toDate = searchParams.get(TO_DATE_PARAM) || undefined;

  const fetchEquations = useCallback(
    async (page?: number) => {
      const pageToFetch = page ?? useEquationsStore.getState().currentPage;
      try {
        setLoading(true);
        clearError();
        const token = useAuthStore.getState().token;
        const result = await equationService.getAllEquations(
          token,
          pageToFetch,
          EQUATIONS_PAGE_SIZE,
          selectedOrigins,
          selectedStatuses,
          fromDate,
          toDate
        );
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
    [
      selectedOrigins,
      selectedStatuses,
      fromDate,
      toDate,
      setEquations,
      setLoading,
      setError,
      clearError,
      setPagination,
      setPage,
    ]
  );

  useEffect(() => {
    fetchEquations(pageFromUrl);
  }, [pageFromUrl, user, fetchEquations]);

  function setOriginFilter(origins: EquationOrigin[]) {
    const next = new URLSearchParams(searchParams);
    if (origins.length === 0) {
      next.delete(ORIGINS_PARAM);
    } else {
      next.set(ORIGINS_PARAM, origins.join(','));
    }
    next.set('page', '1');
    setSearchParams(next);
  }

  function setStatusFilter(statuses: EquationStatus[]) {
    const next = new URLSearchParams(searchParams);
    if (statuses.length === 0) {
      next.delete(STATUSES_PARAM);
    } else {
      next.set(STATUSES_PARAM, statuses.join(','));
    }
    next.set('page', '1');
    setSearchParams(next);
  }

  function setDateFilter(from?: string, to?: string) {
    const next = new URLSearchParams(searchParams);
    if (from) next.set(FROM_DATE_PARAM, from);
    else next.delete(FROM_DATE_PARAM);
    if (to) next.set(TO_DATE_PARAM, to);
    else next.delete(TO_DATE_PARAM);
    next.set('page', '1');
    setSearchParams(next);
  }

  useEffect(() => {
    if (totalPages > 0 && pageFromUrl > totalPages) {
      setSearchParams({ page: String(totalPages) });
    }
  }, [totalPages, pageFromUrl, setSearchParams]);

  function goToPage(page: number) {
    setSearchParams({ page: String(page) });
  }

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
    goToPage,
    fetchEquations,
    deleteEquation,
    clearError,
    selectedOrigins,
    setOriginFilter,
    selectedStatuses,
    setStatusFilter,
    fromDate,
    toDate,
    setDateFilter,
  };
};
