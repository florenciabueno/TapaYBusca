import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { EQUATIONS_PAGE_SIZE } from '../../../config/constants';
import { queryKeys } from '../../../shared/query-keys';
import { getErrorMessage } from '../../../shared/utils/getErrorMessage';
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

  const searchParamsString = searchParams.toString();
  const rawPage = Number(searchParams.get(EQUATION_LIST_PAGE_PARAM));
  const pageFromUrl = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const selectedOrigins = useMemo(
    () => parseOriginsFromEquationListUrl(new URLSearchParams(searchParamsString)),
    [searchParamsString]
  );
  const selectedStatuses = useMemo(
    () =>
      parseEquationListStatusesFromUrl(new URLSearchParams(searchParamsString), hasToken),
    [searchParamsString, hasToken]
  );

  useStripDeletedEquationFilterWhenLoggedOut(hasToken, setSearchParams);

  const fromDate = searchParams.get(EQUATION_LIST_FROM_DATE_PARAM) || undefined;
  const toDate = searchParams.get(EQUATION_LIST_TO_DATE_PARAM) || undefined;

  const equationListQueryKey = queryKeys.equations.list(
    pageFromUrl,
    selectedOrigins,
    selectedStatuses,
    fromDate,
    toDate,
    hasToken
  );

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: equationListQueryKey,
    queryFn: () =>
      equationService.getAllEquations(
        token,
        pageFromUrl,
        EQUATIONS_PAGE_SIZE,
        selectedOrigins,
        selectedStatuses,
        fromDate,
        toDate
      ),
  });

  const equations = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const errorMessage = getErrorMessage(error, 'Error al cargar las ecuaciones');

  useEffect(() => {
    if (data != null && totalPages > 0 && pageFromUrl > totalPages) {
      setSearchParams((prev) => withEquationListPageParam(prev, totalPages));
    }
  }, [data, totalPages, pageFromUrl, setSearchParams]);

  const setOriginFilter = (origins: EquationOrigin[]) => {
    setSearchParams((prev) =>
      applyEquationListFilterPatch(prev, (next) => {
        if (origins.length === 0) next.delete(EQUATION_LIST_ORIGINS_PARAM);
        else next.set(EQUATION_LIST_ORIGINS_PARAM, origins.join(','));
      })
    );
  };

  const setStatusFilter = (statuses: EquationListStatusFilter[]) => {
    setSearchParams((prev) =>
      applyEquationListFilterPatch(prev, (next) => {
        if (statuses.length === 0) next.delete(EQUATION_LIST_STATUSES_PARAM);
        else next.set(EQUATION_LIST_STATUSES_PARAM, statuses.join(','));
      })
    );
  };

  const setDateFilter = (from?: string, to?: string) => {
    setSearchParams((prev) =>
      applyEquationListFilterPatch(prev, (next) => {
        if (from) next.set(EQUATION_LIST_FROM_DATE_PARAM, from);
        else next.delete(EQUATION_LIST_FROM_DATE_PARAM);
        if (to) next.set(EQUATION_LIST_TO_DATE_PARAM, to);
        else next.delete(EQUATION_LIST_TO_DATE_PARAM);
      })
    );
  };

  const goToPage = (page: number) => {
    setSearchParams((prev) => withEquationListPageParam(prev, page));
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => equationService.deleteEquation(id, token),
    onSuccess: () => {
      const nextPage = equations.length === 1 && pageFromUrl > 1 ? pageFromUrl - 1 : pageFromUrl;
      if (nextPage !== pageFromUrl) {
        setSearchParams((prev) => withEquationListPageParam(prev, nextPage));
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.equations.lists() });
    },
  });

  const deleteError = getErrorMessage(
    deleteMutation.error,
    'Error al eliminar la ecuación'
  );

  const clearError = () => {
    deleteMutation.reset();
    void queryClient.invalidateQueries({ queryKey: equationListQueryKey, exact: true });
  };

  return {
    equations,
    isLoading,
    error: errorMessage,
    deleteError,
    currentPage: pageFromUrl,
    total,
    totalPages,
    goToPage,
    fetchEquations: refetch,
    deleteEquation: deleteMutation.mutateAsync,
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
