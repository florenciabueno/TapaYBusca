import type { EquationListStatusFilter, EquationOrigin } from '../features/equations/types';

export const queryKeys = {
  equations: {
    all: ['equations'] as const,
    lists: () => [...queryKeys.equations.all, 'list'] as const,
    list: (
      page: number,
      origins: EquationOrigin[] | undefined,
      statuses: EquationListStatusFilter[] | undefined,
      fromDate: string | undefined,
      toDate: string | undefined,
      hasToken: boolean
    ) =>
      [
        ...queryKeys.equations.lists(),
        page,
        origins,
        statuses,
        fromDate,
        toDate,
        hasToken,
      ] as const,
    uploadable: (token?: string | null) =>
      [...queryKeys.equations.all, 'uploadable', token ?? 'anon'] as const,
    detail: (id: string) => [...queryKeys.equations.all, 'detail', id] as const,
  },
  profile: {
    all: ['profile'] as const,
  },
};
