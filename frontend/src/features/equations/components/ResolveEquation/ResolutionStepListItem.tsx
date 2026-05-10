import { COLORS, SHADOW } from '../../../../config/theme';
import { MathExpression } from '../../../../shared/components/ui/MathExpression';
import type { ResolutionStep } from '../../types';

export interface ResolutionStepListItemProps {
  step: ResolutionStep;
  stepNumber: number;
}

export const ResolutionStepListItem = ({ step, stepNumber }: ResolutionStepListItemProps) => {
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
        className="flex-shrink-0 w-6 text-center text-sm font-semibold tabular-nums leading-none"
        style={{ color: COLORS.gray[500] }}
      >
        {stepNumber}.
      </span>
      <span className="inline-flex min-w-0 flex-1 flex-wrap items-center gap-1.5" translate="no">
        {step.finishAttempt ? (
          <span className="text-sm" style={{ color: COLORS.gray[700] }}>
            Terminar resolución — intento incompleto
          </span>
        ) : step.proposedResult === '{}' ? (
          <>
            <span>S = </span>
            <MathExpression expression="\emptyset" />
          </>
        ) : (
          <>
            {step.subEquationLatex ? (
              <MathExpression expression={step.subEquationLatex} />
            ) : (
              <span>{step.subEquation}</span>
            )}
            <span>=</span>
            {step.resultLatex ? (
              <MathExpression expression={step.resultLatex} />
            ) : (
              <span>{step.proposedResult}</span>
            )}
          </>
        )}
      </span>
      <span
        className="inline-flex h-7 w-7 flex-shrink-0 rounded-full items-center justify-center text-sm font-semibold leading-none self-center"
        style={{
          backgroundColor: step.isCorrect ? COLORS.status.completedSoft : COLORS.error.bg,
          color: step.isCorrect ? COLORS.status.completed : COLORS.error.dark,
        }}
        aria-label={step.isCorrect ? 'Paso correcto' : 'Paso incorrecto'}
      >
        {step.isCorrect ? '✓' : '✗'}
      </span>
    </li>
  );
};
