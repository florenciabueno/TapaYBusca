import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { EQUATIONS_PAGE_SIZE } from '../../../config/constants';
import { queryKeys } from '../../../shared/query-keys';
import { equationService } from '../services/equation.service';
import { useAuthStore } from '../../../stores';
import type { Equation, EquationListStatusFilter, EquationOrigin, PaginatedResponse } from '../types';
import {
  EQUATION_LIST_FROM_DATE_PARAM,
  EQUATION_LIST_ORIGINS_PARAM,
  EQUATION_LIST_PAGE_PARAM,
  EQUATION_LIST_STATUSES_PARAM,
  EQUATION_LIST_TO_DATE_PARAM,
  applyEquationListFilterPatch,
  parseEquationListStatusesFromUrl,
  parseOriginsFromEquationListUrl,
  withEquationListPageParam,
} from '../utils/equationListSearchParams';
import { useStripDeletedEquationFilterWhenLoggedOut } from './useStripDeletedEquationFilterWhenLoggedOut';

export type UseEquationListReturn = {
  equations: Equation[];
  isLoading: boolean;
  error: string | null;
  deleteError: string | null;
  currentPage: number;
  total: number;
  totalPages: number;
  goToPage: (page: number) => void;
  fetchEquations: UseQueryResult<PaginatedResponse<Equation>, Error>['refetch'];
  deleteEquation: UseMutationResult<void, Error, string, unknown>['mutateAsync'];
  clearError: () => void;
  selectedOrigins: EquationOrigin[] | undefined;
  setOriginFilter: (origins: EquationOrigin[]) => void;
  selectedStatuses: EquationListStatusFilter[] | undefined;
  setStatusFilter: (statuses: EquationListStatusFilter[]) => void;
  fromDate: string | undefined;
  toDate: string | undefined;
  setDateFilter: (from?: string, to?: string) => void;
};

export const useEquationList = (): UseEquationListReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const hasToken = !!token;

  const pageFromUrl = Number(searchParams.get(EQUATION_LIST_PAGE_PARAM) || 1);
  const selectedOrigins = useMemo(
    () => parseOriginsFromEquationListUrl(searchParams),
    [searchParams]
  );
  const selectedStatuses = useMemo(
    () => parseEquationListStatusesFromUrl(searchParams, hasToken),
    [searchParams, hasToken]
  );

  useStripDeletedEquationFilterWhenLoggedOut(hasToken, setSearchParams);

  const fromDate = searchParams.get(EQUATION_LIST_FROM_DATE_PARAM) || undefined;
  const toDate = searchParams.get(EQUATION_LIST_TO_DATE_PARAM) || undefined;

  const listFilters = useMemo(
    () => ({
      page: pageFromUrl,
      origins: selectedOrigins,
      statuses: selectedStatuses,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      hasToken,
    }),
    [pageFromUrl, selectedOrigins, selectedStatuses, fromDate, toDate, hasToken]
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
  const currentPage = Math.max(1, pageFromUrl);
  const errorMessage =
    error != null
      ? error instanceof Error
        ? error.message
        : 'Error al cargar las ecuaciones'
      : null;

  useEffect(() => {
    if (data != null && totalPages > 0 && pageFromUrl > totalPages) {
      setSearchParams((prev) => withEquationListPageParam(prev, totalPages));
    }
  }, [data, totalPages, pageFromUrl, setSearchParams]);

  function setOriginFilter(origins: EquationOrigin[]) {
    setSearchParams(
      applyEquationListFilterPatch(searchParams, (next) => {
        if (origins.length === 0) next.delete(EQUATION_LIST_ORIGINS_PARAM);
        else next.set(EQUATION_LIST_ORIGINS_PARAM, origins.join(','));
      })
    );
  }

  function setStatusFilter(statuses: EquationListStatusFilter[]) {
    setSearchParams(
      applyEquationListFilterPatch(searchParams, (next) => {
        if (statuses.length === 0) next.delete(EQUATION_LIST_STATUSES_PARAM);
        else next.set(EQUATION_LIST_STATUSES_PARAM, statuses.join(','));
      })
    );
  }

  function setDateFilter(from?: string, to?: string) {
    setSearchParams(
      applyEquationListFilterPatch(searchParams, (next) => {
        if (from) next.set(EQUATION_LIST_FROM_DATE_PARAM, from);
        else next.delete(EQUATION_LIST_FROM_DATE_PARAM);
        if (to) next.set(EQUATION_LIST_TO_DATE_PARAM, to);
        else next.delete(EQUATION_LIST_TO_DATE_PARAM);
      })
    );
  }

  function goToPage(page: number) {
    setSearchParams((prev) => withEquationListPageParam(prev, page));
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => equationService.deleteEquation(id, token),
    onSuccess: () => {
      const nextPage = equations.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setSearchParams((prev) => withEquationListPageParam(prev, nextPage));
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
