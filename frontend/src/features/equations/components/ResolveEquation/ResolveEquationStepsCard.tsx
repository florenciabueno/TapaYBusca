import { COLORS, RADIUS, SHADOW } from '../../../../config/theme';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';
import type { ResolutionStep } from '../../hooks/useResolveEquation';

interface ResolveEquationStepsCardProps {
  steps: ResolutionStep[];
}

export const ResolveEquationStepsCard = ({ steps }: ResolveEquationStepsCardProps) => {
  if (steps.length === 0) return null;

  return (
    <div
      className="w-full p-6 rounded-2xl"
      style={{
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        boxShadow: SHADOW.lg,
      }}
    >
      <h2 className="text-lg font-semibold mb-3" style={{ color: COLORS.accentSecondary }}>
        Pasos realizados
      </h2>
      <ul
        className="space-y-2 text-sm max-h-[min(50vh,24rem)] lg:max-h-[calc(100vh-10rem)] overflow-y-auto pr-1"
        style={{ color: COLORS.gray[700] }}
      >
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
  );
};
