import type { EquationListStatusFilter, EquationOrigin } from '../features/equations/types';

export interface EquationsListFilters {
  page: number;
  origins?: EquationOrigin[];
  statuses?: EquationListStatusFilter[];
  fromDate?: string;
  toDate?: string;
  hasToken: boolean;
}

export const queryKeys = {
  equations: {
    all: ['equations'] as const,
    lists: () => [...queryKeys.equations.all, 'list'] as const,
    list: (filters: EquationsListFilters) =>
      [...queryKeys.equations.lists(), filters] as const,
    uploadable: (token?: string | null) =>
      [...queryKeys.equations.all, 'uploadable', token ?? 'anon'] as const,
    detail: (id: string) => [...queryKeys.equations.all, 'detail', id] as const,
  },
  profile: {
    all: ['profile'] as const,
  },
};
