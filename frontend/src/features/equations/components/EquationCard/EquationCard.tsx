import { Link, useLocation } from 'react-router-dom';
import { COLORS, RADIUS, SHADOW } from '../../../../config/theme';
import { resolveEquationPath } from '../../../../config/constants';
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
  const location = useLocation();
  const isDeleted = equation.isActive === false;
  const statusStyle = STATUS_STYLES[equation.status];

  return (
    <Link
      to={`${resolveEquationPath(equation.id)}${location.search}`}
      className="flex h-[130px] flex-col rounded-lg border p-4 transition-all duration-200 ease-out hover:-translate-y-2 hover:scale-[1.05] hover:shadow-xl"
      style={{
        borderRadius: RADIUS.lg,
        borderColor: isDeleted ? COLORS.gray[300] : COLORS.brandDark,
        boxShadow: isDeleted ? SHADOW.sm : SHADOW.md,
        backgroundColor: isDeleted ? COLORS.gray[100] : COLORS.surface,
        ...(isDeleted ? { opacity: 0.92 } : {}),
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto mb-2" translate="no">
        <MathExpression
          expression={equation.equation}
          className={`text-base ${isDeleted ? 'text-gray-500' : 'text-gray-800'}`}
        />
      </div>
      <div
        className={`flex-shrink-0 flex flex-wrap items-center gap-1.5 text-xs ${
          isDeleted ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
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
      <div className="flex-shrink-0 mt-2 flex flex-wrap items-center justify-between gap-2">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={
            isDeleted
              ? { backgroundColor: COLORS.gray[200], color: COLORS.gray[600] }
              : { backgroundColor: statusStyle.bg, color: statusStyle.text }
          }
        >
          {STATUS_LABELS[equation.status]}
        </span>
        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(equation.id);
              }}
              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};
