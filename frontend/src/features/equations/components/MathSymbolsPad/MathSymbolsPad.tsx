import { COLORS, SPACING } from '../../../../config/theme';
import { CREATE_EQUATION_MATH_SYMBOLS } from './math-symbols';

interface MathSymbolsPadProps {
  onSymbolClick: (insert: string) => void;
  disabled?: boolean;
  symbols?: { label: string; insert: string }[];
}

export const MathSymbolsPad = ({
  onSymbolClick,
  disabled = false,
  symbols = CREATE_EQUATION_MATH_SYMBOLS,
}: MathSymbolsPadProps) => {
  return (
    <div translate="no" style={{ marginBottom: SPACING.lg }}>
      <label className="block text-sm font-medium mb-2" style={{ color: COLORS.accentSecondary }}>
        Símbolos matemáticos:
      </label>
      <div className="grid grid-cols-5 gap-2">
        {symbols.map(({ label, insert }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSymbolClick(insert)}
            disabled={disabled}
            className="cursor-pointer py-3 rounded-xl font-medium transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60"
            style={{
              backgroundColor: COLORS.gray[100],
              color: COLORS.gray[800],
              border: `1px solid ${COLORS.gray[200]}`,
              ['--tw-ring-color' as string]: COLORS.accentSecondary,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
