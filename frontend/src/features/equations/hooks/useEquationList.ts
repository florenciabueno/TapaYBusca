import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EQUATIONS_PAGE_SIZE } from '../../../config/constants';
import { queryKeys } from '../../../shared/query-keys';
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
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  const pageFromUrl = Number(searchParams.get('page') || 1);
  const selectedOrigins = useMemo(() => parseOriginsFromUrl(searchParams), [searchParams]);
  const selectedStatuses = useMemo(() => parseStatusesFromUrl(searchParams), [searchParams]);
  const fromDate = searchParams.get(FROM_DATE_PARAM) || undefined;
  const toDate = searchParams.get(TO_DATE_PARAM) || undefined;

  const listFilters = useMemo(
    () => ({
      page: pageFromUrl,
      origins: selectedOrigins,
      statuses: selectedStatuses,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      hasToken: !!token,
    }),
    [pageFromUrl, selectedOrigins, selectedStatuses, fromDate, toDate, token]
  );

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.equations.list(listFilters),
    queryFn: () =>
      equationService.getAllEquations(
        token,
        listFilters.page,
        EQUATIONS_PAGE_SIZE,
        listFilters.origins,
        listFilters.statuses,
        listFilters.fromDate,
        listFilters.toDate
      ),
    enabled: true,
  });

  const equations = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;
  const errorMessage =
    error != null
      ? error instanceof Error
        ? error.message
        : 'Error al cargar las ecuaciones'
      : null;

  useEffect(() => {
    if (totalPages > 0 && pageFromUrl > totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(totalPages));
        return next;
      });
    }
  }, [totalPages, pageFromUrl, setSearchParams]);

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

  function goToPage(page: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(page));
      return next;
    });
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => equationService.deleteEquation(id, token),
    onSuccess: () => {
      const nextPage = equations.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('page', String(nextPage));
          return next;
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.equations.lists() });
    },
  });

  const deleteError =
    deleteMutation.error != null
      ? deleteMutation.error instanceof Error
        ? deleteMutation.error.message
        : 'Error al eliminar la ecuación'
      : null;

  return {
    equations,
    isLoading,
    error: errorMessage,
    deleteError,
    currentPage,
    total,
    totalPages,
    goToPage,
    fetchEquations: refetch,
    deleteEquation: deleteMutation.mutateAsync,
    clearError: () => {},
    selectedOrigins,
    setOriginFilter,
    selectedStatuses,
    setStatusFilter,
    fromDate,
    toDate,
    setDateFilter,
  };
};
