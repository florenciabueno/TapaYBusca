import { COLORS, SHADOW } from '../../../../config/theme';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';

interface ResolveEquationEquationPanelProps {
  equationExpression: string;
}

export const ResolveEquationEquationPanel = ({ equationExpression }: ResolveEquationEquationPanelProps) => {
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
    </div>
  );
};
