import { COLORS, SHADOW } from '../../../../config/theme';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';
import type { ResolutionStep } from '../../types';

export interface ResolutionStepListItemProps {
  step: ResolutionStep;
}

export const ResolutionStepListItem = ({ step }: ResolutionStepListItemProps) => {
  return (
    <li
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
  );
};
