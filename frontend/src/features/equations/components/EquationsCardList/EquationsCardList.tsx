import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../../config/constants';
import { useEquationList } from '../../hooks/useEquationList';
import { useAuthStore } from '../../../../stores';
import { COLORS, ACCENT_RGB, RADIUS, SHADOW } from '../../../../config/theme';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';
import type { Equation, EquationStatus } from '../../types/equation.types';
import { ORIGIN_LABELS, STATUS_LABELS } from '../../types/equation.types';

const STATUS_STYLES: Record<
  EquationStatus,
  { bg: string; text: string }
> = {
  NOT_STARTED: { bg: COLORS.status.pendingSoft, text: COLORS.status.pending },
  IN_PROGRESS: { bg: COLORS.status.inProgressSoft, text: COLORS.status.inProgress },
  SOLVED: { bg: COLORS.status.completedSoft, text: COLORS.status.completed },
};

function EquationCard({
  equation,
  onView,
  onDelete,
  canDelete,
}: {
  equation: Equation;
  onView: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const statusStyle = STATUS_STYLES[equation.status];

  return (
    <article
      className="rounded-xl border bg-white p-5 transition-all duration-200 hover:shadow-md"
      style={{
        borderRadius: RADIUS.lg,
        borderColor: COLORS.lightTeal,
        boxShadow: SHADOW.sm,
      }}
    >
      <div className="mb-4 min-h-[2.5rem]">
        <MathExpression
          expression={equation.equation}
          className="text-lg text-gray-800"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <span>{ORIGIN_LABELS[equation.origin]}</span>
        <span aria-hidden className="text-gray-300">
          ·
        </span>
        <span>{equation.date}</span>
        <span aria-hidden className="text-gray-300">
          ·
        </span>
        <span>{equation.steps} pasos</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
        >
          {STATUS_LABELS[equation.status]}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onView}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-2"
            style={{ color: COLORS.orange }}
          >
            Ver
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export const EquationsCardList = () => {
  const { equations, isLoading, error, fetchEquations, deleteEquation } =
    useEquationList();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchEquations();
  }, [user, fetchEquations]);

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

  if (equations.length === 0) {
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

  return (
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
  );
};
