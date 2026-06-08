import { COLORS, SHADOW } from '../../../../config/theme';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';
import { formatSolutionSetExpression } from '../../utils/format-solution-set';

interface ResolveEquationEquationPanelProps {
  equationExpression: string;
  partialSolutionSet?: number[];
  partialSolutionSetLatex?: string[];
}

export const ResolveEquationEquationPanel = ({
  equationExpression,
  partialSolutionSet,
  partialSolutionSetLatex,
}: ResolveEquationEquationPanelProps) => {
  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div
        translate="no"
        className="rounded-xl p-4 flex-shrink-0"
        style={{
          backgroundColor: COLORS.gray[50],
          border: `1px solid ${COLORS.gray[200]}`,
          boxShadow: SHADOW.sm,
        }}
      >
        <h2 className="mb-2 text-sm font-medium" style={{ color: COLORS.accentSecondary }}>
          Ecuación
        </h2>
        <MathExpression expression={equationExpression} className="text-lg" />
      </div>
      {partialSolutionSet ? (
        <div
          translate="no"
          className="rounded-xl p-4 flex-shrink-0"
          style={{
            backgroundColor: COLORS.gray[50],
            border: `1px solid ${COLORS.gray[200]}`,
            boxShadow: SHADOW.sm,
          }}
        >
          <h2 className="mb-2 text-sm font-medium" style={{ color: COLORS.accentSecondary }}>
            Conjunto solución actual
          </h2>
          <MathExpression
            expression={formatSolutionSetExpression(
              partialSolutionSet,
              partialSolutionSetLatex
            )}
            className="text-lg"
          />
        </div>
      ) : null}
    </div>
  );
};
