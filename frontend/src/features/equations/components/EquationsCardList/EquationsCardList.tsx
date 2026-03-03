import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../../config/constants';
import { COLORS, ACCENT_RGB, SHADOW } from '../../../../config/theme';
import { Pagination } from '../../../../shared/components/ui/Pagination';
import { useEquationList } from '../../hooks/useEquationList';
import { useAuthStore } from '../../../../stores';
import { canDeleteEquation } from '../../utils/equationPermissions';
import { EquationCard } from '../EquationCard';

const MESSAGES = {
  LOADING: 'Cargando ecuaciones...',
  EMPTY_TITLE: 'No hay ecuaciones',
  EMPTY_DESCRIPTION: 'Crea tu primera ecuación para comenzar a resolver paso a paso.',
  DELETE_CONFIRM: '¿Estás seguro de eliminar esta ecuación?',
} as const;

export const EquationsCardList = () => {
  const {
    equations,
    isLoading,
    error,
    currentPage,
    totalPages,
    total,
    goToPage,
    deleteEquation,
  } = useEquationList();
  const user = useAuthStore((state) => state.user);

  const handleDelete = useCallback((id: string) => {
    if (!confirm(MESSAGES.DELETE_CONFIRM)) return;
    deleteEquation(id);
  }, [deleteEquation]);

  if (isLoading) {
    return (
      <div
        className="rounded-lg border bg-white px-4 py-10 text-center"
        style={{ borderColor: COLORS.brandDark, boxShadow: SHADOW.sm }}
      >
        <p className="text-sm font-medium" style={{ color: COLORS.brandDark }}>
          {MESSAGES.LOADING}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-10 text-center"
        style={{ boxShadow: SHADOW.sm }}
      >
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  if (equations.length === 0 && total === 0) {
    return (
      <div
        className="rounded-lg border bg-white px-4 py-10 text-center transition-shadow"
        style={{ borderColor: COLORS.brandDark, boxShadow: SHADOW.sm }}
      >
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `rgba(${ACCENT_RGB}, 0.4)` }}
        >
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="mb-1 text-sm font-medium text-gray-700">
          {MESSAGES.EMPTY_TITLE}
        </p>
        <p className="mb-4 text-xs text-gray-500">
          {MESSAGES.EMPTY_DESCRIPTION}
        </p>
        <Link
          to={ROUTES.CREATE_EQUATION}
          className="inline-flex rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:ring-offset-2"
          style={{ backgroundColor: COLORS.teal }}
        >
          Crear ecuación
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equations.map((equation) => (
          <EquationCard
            key={equation.id}
            equation={equation}
            onDelete={handleDelete}
            canDelete={canDeleteEquation(equation, user)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
};
