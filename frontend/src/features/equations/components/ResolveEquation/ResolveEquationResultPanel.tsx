import { COLORS, SHADOW } from '../../../../config/theme';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';
import { RESOLUTION_CODES } from '../../constants/resolution';

interface ResolveEquationResultPanelProps {
  finishedCode: string | null;
  solutionSet: number[];
  onReset: () => void;
}

export const ResolveEquationResultPanel = ({
  finishedCode,
  solutionSet,
  onReset,
}: ResolveEquationResultPanelProps) => {
  const isNoSolution = finishedCode === RESOLUTION_CODES.NO_SOLUTION;
  const solutionLatex = `\\{ ${solutionSet.map(formatSolutionValueLatex).join(', ')} \\}`;

  return (
    <>
      <div
        className="rounded-xl p-4 mb-4 flex-shrink-0"
        style={{
          backgroundColor: isNoSolution ? COLORS.status.pendingSoft : COLORS.status.completedSoft,
          color: isNoSolution ? COLORS.status.pending : COLORS.status.completed,
          border: `1px solid ${isNoSolution ? COLORS.status.pending : COLORS.status.completed}`,
        }}
      >
        <p className="text-base font-semibold">
          {isNoSolution ? '¡No hay solución real!' : '¡Ecuación resuelta correctamente!'}
        </p>
      </div>
      <div
        translate="no"
        className="rounded-xl p-4 flex-shrink-0"
        style={{
          backgroundColor: COLORS.gray[50],
          border: `1px solid ${COLORS.gray[200]}`,
          boxShadow: SHADOW.sm,
        }}
      >
        <h3 className="mb-2 text-sm font-medium" style={{ color: COLORS.accentSecondary }}>
          Conjunto solución
        </h3>
        <p className="text-lg" style={{ color: COLORS.gray[800] }}>
          {solutionSet.length > 0 ? (
            <MathExpression expression={`S = ${solutionLatex}`} />
          ) : (
            'S = ∅'
          )}
        </p>
        <Button type="button" variant="accent" onClick={onReset} className="mt-4">
          Reiniciar y volver a resolver
        </Button>
      </div>
    </>
  );
};

const formatSolutionValueLatex = (value: number): string => {
  const roundedInt = Math.round(value);
  if (Math.abs(value - roundedInt) <= 1e-9) return String(roundedInt);

  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const square = abs * abs;
  const roundedSquare = Math.round(square);
  const isPerfectSquare = Number.isInteger(Math.sqrt(roundedSquare));
  if (
    roundedSquare > 1 &&
    Math.abs(square - roundedSquare) <= 1e-8 &&
    !isPerfectSquare
  ) {
    return `${sign}\\sqrt{${roundedSquare}}`;
  }

  return String(Number(value.toFixed(6)));
};
