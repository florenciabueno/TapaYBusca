import {
  EQUATION_LIST_STATUS_DELETED,
  type EquationListStatusFilter,
  type EquationOrigin,
} from '../types';

export const EQUATION_LIST_ORIGINS_PARAM = 'origins';
export const EQUATION_LIST_STATUSES_PARAM = 'statuses';
export const EQUATION_LIST_FROM_DATE_PARAM = 'fromDate';
export const EQUATION_LIST_TO_DATE_PARAM = 'toDate';
export const EQUATION_LIST_PAGE_PARAM = 'page';

const VALID_ORIGINS: EquationOrigin[] = ['DEFAULT', 'CREATED', 'DOWNLOADED'];
const VALID_LIST_STATUS_FILTERS: EquationListStatusFilter[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'SOLVED',
  EQUATION_LIST_STATUS_DELETED,
];

export function cloneEquationListSearchParams(src: URLSearchParams): URLSearchParams {
  return new URLSearchParams(src);
}

export function parseOriginsFromEquationListUrl(
  searchParams: URLSearchParams
): EquationOrigin[] | undefined {
  const raw = searchParams.get(EQUATION_LIST_ORIGINS_PARAM);
  if (!raw || raw.trim() === '') return undefined;
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter((v): v is EquationOrigin => VALID_ORIGINS.includes(v as EquationOrigin));
  return parsed.length === 0 ? undefined : parsed;
}

export function parseEquationListStatusesFromUrl(
  searchParams: URLSearchParams,
  allowDeleted: boolean
): EquationListStatusFilter[] | undefined {
  const raw = searchParams.get(EQUATION_LIST_STATUSES_PARAM);
  if (!raw || raw.trim() === '') return undefined;
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter((v): v is EquationListStatusFilter =>
      VALID_LIST_STATUS_FILTERS.includes(v as EquationListStatusFilter)
    );
  if (!allowDeleted) {
    const without = parsed.filter((s) => s !== EQUATION_LIST_STATUS_DELETED);
    return without.length === 0 ? undefined : without;
  }
  return parsed.length === 0 ? undefined : parsed;
}

export function applyEquationListFilterPatch(
  current: URLSearchParams,
  patch: (next: URLSearchParams) => void
): URLSearchParams {
  const next = cloneEquationListSearchParams(current);
  patch(next);
  next.set(EQUATION_LIST_PAGE_PARAM, '1');
  return next;
}

export function withEquationListPageParam(
  current: URLSearchParams,
  page: number
): URLSearchParams {
  const next = cloneEquationListSearchParams(current);
  next.set(EQUATION_LIST_PAGE_PARAM, String(page));
  return next;
}

export function stripDeletedStatusTokenFromParams(prev: URLSearchParams): URLSearchParams | null {
  const raw = prev.get(EQUATION_LIST_STATUSES_PARAM);
  if (!raw?.includes(EQUATION_LIST_STATUS_DELETED)) return null;
  const cleaned = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== EQUATION_LIST_STATUS_DELETED);
  const next = cloneEquationListSearchParams(prev);
  if (cleaned.length === 0) next.delete(EQUATION_LIST_STATUSES_PARAM);
  else next.set(EQUATION_LIST_STATUSES_PARAM, cleaned.join(','));
  next.set(EQUATION_LIST_PAGE_PARAM, '1');
  return next;
}
