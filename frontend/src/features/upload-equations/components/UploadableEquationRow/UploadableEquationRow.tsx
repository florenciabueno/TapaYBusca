import { COLORS, RADIUS, SHADOW } from '../../../../config/theme';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';
import type { UploadableEquation } from '../../../../shared/types/equations';

export interface UploadableEquationRowProps {
  item: UploadableEquation;
  selected?: boolean;
  onToggle?: (id: string) => void;
  /** When true, renders only the equation (no checkbox). For "Ya subidas" tab. */
  displayOnly?: boolean;
}

export const UploadableEquationRow = ({
  item,
  selected = false,
  onToggle,
  displayOnly = false,
}: UploadableEquationRowProps) => {
  const disabled = displayOnly || item.isPublished;

  if (displayOnly) {
    return (
      <div
        className="flex items-center gap-3 rounded-lg border bg-white p-4 transition-shadow"
        style={{
          borderRadius: RADIUS.lg,
          borderColor: COLORS.gray[200],
          boxShadow: SHADOW.sm,
        }}
      >
        <div className="min-w-0 flex-1">
          <MathExpression expression={item.equation} className="text-base text-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <label
      className="flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
      style={{
        borderRadius: RADIUS.lg,
        borderColor: disabled ? COLORS.gray[200] : COLORS.brandDark,
        boxShadow: SHADOW.sm,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.85 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => !disabled && onToggle?.(item.id)}
        disabled={disabled}
        aria-disabled={disabled}
        aria-label={item.equation}
        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
      />
      <div className="min-w-0 flex-1">
        <div className="min-h-[1.5rem]">
          <MathExpression expression={item.equation} className="text-base text-gray-800" />
        </div>
        {item.isPublished && (
          <span
            className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: COLORS.gray[200], color: COLORS.gray[600] }}
          >
            Ya subida
          </span>
        )}
      </div>
    </label>
  );
};
