import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../../../config/constants';
import { useEquationList } from '../../hooks/useEquationList';
import { useAuthStore } from '../../../../stores';
import { COLORS, ACCENT_RGB, SHADOW } from '../../../../config/theme';
import { EquationCard } from '../EquationCard';

export const EquationsCardList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    equations,
    isLoading,
    error,
    currentPage,
    totalPages,
    total,
    fetchEquations,
    deleteEquation,
  } = useEquationList();
  const user = useAuthStore((state) => state.user);

  const pageFromUrl = Number(searchParams.get('page') || 1);

  useEffect(() => {
    fetchEquations(pageFromUrl);
  }, [pageFromUrl, user, fetchEquations]);

  useEffect(() => {
    if (totalPages > 0 && pageFromUrl > totalPages) {
      setSearchParams({ page: String(totalPages) });
    }
  }, [totalPages, pageFromUrl, setSearchParams]);

  const handleDelete = (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta ecuación?')) return;
    deleteEquation(id);
  };

  if (isLoading) {
    return (
      <div
        className="rounded-xl border bg-white px-6 py-16 text-center"
        style={{ borderColor: COLORS.lightTeal, boxShadow: SHADOW.sm }}
      >
        <p className="text-sm font-medium" style={{ color: COLORS.secondary }}>
          Cargando ecuaciones...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 px-6 py-16 text-center"
        style={{ boxShadow: SHADOW.sm }}
      >
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  if (equations.length === 0 && total === 0) {
    return (
      <div
        className="rounded-xl border bg-white px-6 py-16 text-center transition-shadow"
        style={{ borderColor: COLORS.lightTeal, boxShadow: SHADOW.sm }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: `rgba(${ACCENT_RGB}, 0.4)` }}
        >
          <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="mb-1 text-sm font-medium text-gray-700">
          No hay ecuaciones
        </p>
        <p className="mb-5 text-sm text-gray-500">
          Crea tu primera ecuación para comenzar a resolver paso a paso.
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

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equations.map((equation) => (
          <EquationCard
            key={equation.id}
            equation={equation}
            onView={() => {}}
            onDelete={() => handleDelete(equation.id)}
            canDelete={!!user && equation.origin !== 'DEFAULT'}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="Paginación de ecuaciones"
        >
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-50"
            style={{ borderColor: COLORS.lightTeal, color: COLORS.gray[700] }}
          >
            Anterior
          </button>
          <span
            className="px-3 py-2 text-sm text-gray-600"
            aria-live="polite"
          >
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-50"
            style={{ borderColor: COLORS.lightTeal, color: COLORS.gray[700] }}
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  );
};
