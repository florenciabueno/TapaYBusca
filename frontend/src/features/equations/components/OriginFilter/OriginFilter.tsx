import { COLORS } from '../../../../config/theme';
import type { EquationOrigin } from '../../types/equation.types';
import { ORIGIN_FILTER_LABELS } from '../../types/equation.types';

const ORIGINS: EquationOrigin[] = ['DEFAULT', 'CREATED', 'DOWNLOADED'];

export interface OriginFilterProps {
  selectedOrigins: EquationOrigin[] | undefined;
  onChange: (origins: EquationOrigin[]) => void;
}

export const OriginFilter = ({ selectedOrigins, onChange }: OriginFilterProps) => {
  const selectedSet = new Set(selectedOrigins ?? []);

  function toggle(origin: EquationOrigin) {
    const next = selectedSet.has(origin)
      ? (selectedOrigins ?? []).filter((o) => o !== origin)
      : [...(selectedOrigins ?? []), origin];
    onChange(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>
        Filtrar:
      </span>
      {ORIGINS.map((origin) => {
        const isSelected = selectedSet.has(origin);
        return (
          <button
            key={origin}
            type="button"
            onClick={() => toggle(origin)}
            className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: isSelected ? COLORS.accentSecondary : 'transparent',
              borderColor: isSelected ? COLORS.accentSecondary : COLORS.gray[300],
              color: isSelected ? '#fff' : COLORS.gray[700],
            }}
            aria-pressed={isSelected}
          >
            {ORIGIN_FILTER_LABELS[origin]}
          </button>
        );
      })}
    </div>
  );
};
