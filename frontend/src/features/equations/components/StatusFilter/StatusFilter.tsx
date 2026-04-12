import { COLORS } from '../../../../config/theme';
import {
  EQUATION_LIST_STATUS_DELETED,
  EQUATION_LIST_STATUS_FILTER_LABELS,
  type EquationListStatusFilter,
  type EquationStatus,
} from '../../types/equation.types';

const WORKFLOW_STATUSES: EquationStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'SOLVED'];

export interface StatusFilterProps {
  selectedStatuses: EquationListStatusFilter[] | undefined;
  onChange: (statuses: EquationListStatusFilter[]) => void;
  showDeletedFilter?: boolean;
}

export const StatusFilter = ({
  selectedStatuses,
  onChange,
  showDeletedFilter = false,
}: StatusFilterProps) => {
  const selectedSet = new Set(selectedStatuses ?? []);
  const statusOptions: EquationListStatusFilter[] = showDeletedFilter
    ? [...WORKFLOW_STATUSES, EQUATION_LIST_STATUS_DELETED]
    : WORKFLOW_STATUSES;

  const toggle = (status: EquationListStatusFilter) => {
    const next = selectedSet.has(status)
      ? (selectedStatuses ?? []).filter((s) => s !== status)
      : [...(selectedStatuses ?? []), status];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>
        Estado:
      </span>
      {statusOptions.map((status) => {
        const isSelected = selectedSet.has(status);
        return (
          <button
            key={status}
            type="button"
            onClick={() => toggle(status)}
            className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-color"
            style={{
              backgroundColor: isSelected ? COLORS.orange : 'transparent',
              borderColor: isSelected ? COLORS.orange : COLORS.gray[300],
              color: isSelected ? '#fff' : COLORS.gray[700],
            }}
            aria-pressed={isSelected}
          >
            {EQUATION_LIST_STATUS_FILTER_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
};
