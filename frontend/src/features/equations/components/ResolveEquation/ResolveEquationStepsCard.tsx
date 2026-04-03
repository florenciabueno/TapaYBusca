import { COLORS, RADIUS, SHADOW } from '../../../../config/theme';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';
import type { ResolutionStep } from '../../types';

interface ResolveEquationStepsCardProps {
  steps: ResolutionStep[];
  embedded?: boolean;
}

export const ResolveEquationStepsCard = ({ steps, embedded = false }: ResolveEquationStepsCardProps) => {
  if (steps.length === 0) return null;

  const list = (
    <div
      className={`min-h-0 overflow-x-hidden pr-1 max-lg:overflow-visible ${embedded ? 'max-h-[min(50vh,28rem)] overflow-y-auto' : 'lg:flex-1 lg:overflow-y-auto'}`}
    >
      <ul className="flex flex-col gap-2.5 text-base [&_.katex]:!text-base" style={{ color: COLORS.gray[700] }}>
        {steps.map((step, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl p-3"
            style={{
              backgroundColor: COLORS.gray[50],
              border: `1px solid ${COLORS.gray[200]}`,
              boxShadow: SHADOW.sm,
            }}
          >
            <span
              className="inline-flex h-7 w-7 flex-shrink-0 rounded-full items-center justify-center text-sm font-semibold leading-none"
              style={{
                backgroundColor: step.isCorrect ? COLORS.status.completedSoft : COLORS.error.bg,
                color: step.isCorrect ? COLORS.status.completed : COLORS.error.dark,
              }}
            >
              {step.isCorrect ? '✓' : '✗'}
            </span>
            <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
              {step.subEquationLatex ? (
                <MathExpression expression={step.subEquationLatex} />
              ) : (
                <span>{step.subEquation}</span>
              )}
              <span>=</span>
              {step.proposedResult === '{}' ? (
                <>
                  <span>S = </span>
                  <MathExpression expression="\emptyset" />
                </>
              ) : step.resultLatex ? (
                <MathExpression expression={step.resultLatex} />
              ) : (
                <span>{step.proposedResult}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (embedded) {
    return (
      <section
        className="mt-8 border-t pt-6"
        style={{ borderColor: COLORS.gray[200] }}
      >
        <h2 className="mb-4 shrink-0 text-lg font-semibold" style={{ color: COLORS.accentSecondary }}>
          Pasos realizados
        </h2>
        {list}
      </section>
    );
  }

  return (
    <div
      className="flex h-auto min-h-0 w-full flex-col overflow-hidden rounded-2xl p-6 lg:h-full"
      style={{
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        boxShadow: SHADOW.lg,
        border: `1px solid ${COLORS.gray[200]}`,
        borderLeft: `4px solid ${COLORS.orangeLight}`,
      }}
    >
      <h2 className="mb-4 shrink-0 text-lg font-semibold" style={{ color: COLORS.accentSecondary }}>
        Pasos realizados
      </h2>
      {list}
    </div>
  );
};
