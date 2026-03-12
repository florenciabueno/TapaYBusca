import { COLORS } from '../../../../config/theme';
import type { EquationStatus } from '../../../../shared/types/equations';
import { STATUS_LABELS } from '../../../../shared/types/equations';

const STATUSES: EquationStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'SOLVED'];

export interface StatusFilterProps {
  selectedStatuses: EquationStatus[] | undefined;
  onChange: (statuses: EquationStatus[]) => void;
}

export const StatusFilter = ({ selectedStatuses, onChange }: StatusFilterProps) => {
  const selectedSet = new Set(selectedStatuses ?? []);

  function toggle(status: EquationStatus) {
    const next = selectedSet.has(status)
      ? (selectedStatuses ?? []).filter((s) => s !== status)
      : [...(selectedStatuses ?? []), status];
    onChange(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>
        Estado:
      </span>
      {STATUSES.map((status) => {
        const isSelected = selectedSet.has(status);
        return (
          <button
            key={status}
            type="button"
            onClick={() => toggle(status)}
            className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: isSelected ? COLORS.orange : 'transparent',
              borderColor: isSelected ? COLORS.orange : COLORS.gray[300],
              color: isSelected ? '#fff' : COLORS.gray[700],
            }}
            aria-pressed={isSelected}
          >
            {STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
};
