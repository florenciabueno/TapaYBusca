import { COLORS, SHADOW } from '../../../../config/theme';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';
import { RESOLUTION_CODES } from '../../constants/resolution';
import { formatSolutionSetLatex } from '../../utils/format-solution-set';

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
          <MathExpression expression={formatSolutionSetLatex(solutionSet)} />
        </p>
        <Button type="button" variant="accent" onClick={onReset} className="mt-4">
          Reiniciar y volver a resolver
        </Button>
      </div>
    </>
  );
};
