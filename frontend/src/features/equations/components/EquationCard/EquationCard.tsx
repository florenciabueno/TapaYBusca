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
  onDelete: (id: string) => void;
  canDelete: boolean;
}

export const EquationCard = ({
  equation,
  onDelete,
  canDelete,
}: EquationCardProps) => {
  const statusStyle = STATUS_STYLES[equation.status];

  return (
    <article
      className="rounded-lg border bg-white p-4 transition-all duration-200 ease-out hover:-translate-y-2 hover:scale-[1.05] hover:shadow-xl"
      style={{
        borderRadius: RADIUS.lg,
        borderColor: COLORS.brandDark,
        boxShadow: SHADOW.md,
      }}
    >
      <div className="mb-2 min-h-[2rem]">
        <MathExpression
          expression={equation.equation}
          className="text-base text-gray-800"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
        <span>{ORIGIN_LABELS[equation.origin]}</span>
        <span aria-hidden className="text-gray-300">·</span>
        <span>{equation.date}</span>
        <span aria-hidden className="text-gray-300">·</span>
        <span>{equation.steps} pasos</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
        >
          {STATUS_LABELS[equation.status]}
        </span>
        <div className="flex gap-2">
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(equation.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
