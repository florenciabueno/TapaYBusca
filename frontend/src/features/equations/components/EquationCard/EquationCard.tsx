import { COLORS, RADIUS, SHADOW } from '../../../../config/theme';
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

export interface EquationCardProps {
  equation: Equation;
  onView: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export const EquationCard = ({
  equation,
  onView,
  onDelete,
  canDelete,
}: EquationCardProps) => {
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
};
