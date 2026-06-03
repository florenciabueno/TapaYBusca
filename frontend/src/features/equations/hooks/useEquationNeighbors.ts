import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EQUATIONS_PAGE_SIZE, resolveEquationPath } from '../../../config/constants';
import { queryKeys } from '../../../shared/query-keys';
import { useAuthStore } from '../../../stores';
import { equationService } from '../services/equation.service';
import {
  EQUATION_LIST_FROM_DATE_PARAM,
  EQUATION_LIST_PAGE_PARAM,
  EQUATION_LIST_TO_DATE_PARAM,
  parseEquationListStatusesFromUrl,
  parseOriginsFromEquationListUrl,
  withEquationListPageParam,
} from '../utils/equationListSearchParams';

type NeighborTarget = { id: string; page: number };

export type EquationNeighbors = {
  showNavigation: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  goToPrev?: () => void;
  goToNext?: () => void;
};

export function useEquationNeighbors(currentId: string | undefined): EquationNeighbors {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const fromDate = searchParams.get(EQUATION_LIST_FROM_DATE_PARAM) || undefined;
  const toDate = searchParams.get(EQUATION_LIST_TO_DATE_PARAM) || undefined;

  const listQueryKey = queryKeys.equations.list(
    pageFromUrl,
    selectedOrigins,
    selectedStatuses,
    fromDate,
    toDate,
    hasToken
  );

  const { data } = useQuery({
    queryKey: listQueryKey,
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
    enabled: Boolean(currentId),
  });

  const equations = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const index = currentId ? equations.findIndex((e) => e.id === currentId) : -1;

  const needPrevPage = index === 0 && pageFromUrl > 1;
  const needNextPage =
    index >= 0 && index === equations.length - 1 && pageFromUrl < totalPages;

  const { data: prevPageData } = useQuery({
    queryKey: queryKeys.equations.list(
      pageFromUrl - 1,
      selectedOrigins,
      selectedStatuses,
      fromDate,
      toDate,
      hasToken
    ),
    queryFn: () =>
      equationService.getAllEquations(
        token,
        pageFromUrl - 1,
        EQUATIONS_PAGE_SIZE,
        selectedOrigins,
        selectedStatuses,
        fromDate,
        toDate
      ),
    enabled: needPrevPage,
  });

  const { data: nextPageData } = useQuery({
    queryKey: queryKeys.equations.list(
      pageFromUrl + 1,
      selectedOrigins,
      selectedStatuses,
      fromDate,
      toDate,
      hasToken
    ),
    queryFn: () =>
      equationService.getAllEquations(
        token,
        pageFromUrl + 1,
        EQUATIONS_PAGE_SIZE,
        selectedOrigins,
        selectedStatuses,
        fromDate,
        toDate
      ),
    enabled: needNextPage,
  });

  const prevTarget = useMemo((): NeighborTarget | null => {
    if (index < 0) return null;
    if (index > 0) return { id: equations[index - 1]!.id, page: pageFromUrl };
    const prevList = prevPageData?.data ?? [];
    const last = prevList[prevList.length - 1];
    if (!last) return null;
    return { id: last.id, page: pageFromUrl - 1 };
  }, [index, equations, pageFromUrl, prevPageData]);

  const nextTarget = useMemo((): NeighborTarget | null => {
    if (index < 0) return null;
    if (index < equations.length - 1) return { id: equations[index + 1]!.id, page: pageFromUrl };
    const nextList = nextPageData?.data ?? [];
    const first = nextList[0];
    if (!first) return null;
    return { id: first.id, page: pageFromUrl + 1 };
  }, [index, equations, pageFromUrl, nextPageData]);

  const navigateTo = useCallback(
    (target: NeighborTarget) => {
      const params = withEquationListPageParam(searchParams, target.page);
      const qs = params.toString();
      navigate(`${resolveEquationPath(target.id)}${qs ? `?${qs}` : ''}`);
    },
    [navigate, searchParams]
  );

  if (index < 0) {
    return { showNavigation: false, hasPrev: false, hasNext: false };
  }

  return {
    showNavigation: true,
    hasPrev: prevTarget != null,
    hasNext: nextTarget != null,
    goToPrev: prevTarget ? () => navigateTo(prevTarget) : undefined,
    goToNext: nextTarget ? () => navigateTo(nextTarget) : undefined,
  };
}
