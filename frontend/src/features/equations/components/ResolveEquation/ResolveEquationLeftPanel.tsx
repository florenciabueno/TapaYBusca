import { COLORS, SHADOW } from '../../../../config/theme';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';
import type { ResolutionStep } from '../../hooks/useResolveEquation';

interface ResolveEquationLeftPanelProps {
  equationExpression: string;
  steps: ResolutionStep[];
  onBack: () => void;
}

export const ResolveEquationLeftPanel = ({
  equationExpression,
  steps,
  onBack,
}: ResolveEquationLeftPanelProps) => {
  return (
    <div className="flex flex-col gap-4 min-h-0">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium underline block self-start"
        style={{ color: COLORS.brandDark }}
      >
        ← Volver al listado
      </button>
      <div
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
      {steps.length > 0 && (
        <div
          className="rounded-xl p-4 flex-1 min-h-0 overflow-y-auto"
          style={{
            backgroundColor: COLORS.gray[50],
            border: `1px solid ${COLORS.gray[200]}`,
            boxShadow: SHADOW.sm,
          }}
        >
          <h3 className="mb-2 text-sm font-medium" style={{ color: COLORS.accentSecondary }}>
            Pasos
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: COLORS.gray[700] }}>
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-2">
                <span
                  className="inline-flex h-5 w-5 flex-shrink-0 rounded-full items-center justify-center text-xs"
                  style={{
                    backgroundColor: step.isCorrect
                      ? COLORS.status.completedSoft
                      : COLORS.status.pendingSoft,
                    color: step.isCorrect ? COLORS.status.completed : COLORS.status.pending,
                  }}
                >
                  {step.isCorrect ? '✓' : '✗'}
                </span>
                <span className="inline-flex flex-wrap items-center gap-1">
                  {step.subEquationLatex ? (
                    <MathExpression expression={step.subEquationLatex} className="text-inherit" />
                  ) : (
                    <span>{step.subEquation}</span>
                  )}
                  <span>=</span>
                  {step.proposedResult === '{}' ? (
                    <>
                      <span>S = </span>
                      <MathExpression expression="\emptyset" className="text-inherit" />
                    </>
                  ) : step.resultLatex ? (
                    <MathExpression expression={step.resultLatex} className="text-inherit" />
                  ) : (
                    <span>{step.proposedResult}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
