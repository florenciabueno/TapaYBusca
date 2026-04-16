import type { Dispatch, SetStateAction } from 'react';
import { FormPageCard } from '../FormPageCard';
import type { ResolutionStep } from '../../types';
import { ResolveEquationEquationPanel } from './ResolveEquationEquationPanel';
import { ResolveEquationStepsCard } from './ResolveEquationStepsCard';
import { ResolveEquationWorkspace } from './ResolveEquationWorkspace';

interface ResolveEquationContentProps {
  equationExpression: string;
  steps: ResolutionStep[];
  solutionSet: number[];
  expectedDistinctSolutionCount: number;
  subEquationInfix: string;
  answer: string;
  submitting: boolean;
  resolveStepPending: boolean;
  finishResolutionPending: boolean;
  message: string | null;
  finished: boolean;
  finishedCode: string | null;
  isReadOnly?: boolean;
  onSubEquationChange: Dispatch<SetStateAction<string>>;
  onAnswerChange: Dispatch<SetStateAction<string>>;
  onValidate: () => void;
  onEmptySet: () => void;
  onFinishResolution: () => void;
  onReset: () => void;
}

export const ResolveEquationContent = ({
  equationExpression,
  steps,
  solutionSet,
  expectedDistinctSolutionCount,
  subEquationInfix,
  answer,
  submitting,
  resolveStepPending,
  finishResolutionPending,
  message,
  finished,
  finishedCode,
  isReadOnly = false,
  onSubEquationChange,
  onAnswerChange,
  onValidate,
  onEmptySet,
  onFinishResolution,
  onReset,
}: ResolveEquationContentProps) => {
  const hasSteps = steps.length > 0;

  if (isReadOnly) {
    return (
      <div className="w-full min-h-[calc(100vh-7rem)] flex flex-col items-center justify-center px-2">
        <FormPageCard
          title="Ecuación eliminada"
          description="Ya no puedes seguir resolviendo la ecuación."
          maxWidth="wide"
        >
          <ResolveEquationEquationPanel equationExpression={equationExpression} />
          {hasSteps ? <ResolveEquationStepsCard steps={steps} embedded /> : null}
        </FormPageCard>
      </div>
    );
  }

  const workspace = (
    <ResolveEquationWorkspace
      equationExpression={equationExpression}
      hasSteps={hasSteps}
      subEquationInfix={subEquationInfix}
      answer={answer}
      submitting={submitting}
      resolveStepPending={resolveStepPending}
      finishResolutionPending={finishResolutionPending}
      message={message}
      finished={finished}
      finishedCode={finishedCode}
      solutionSet={solutionSet}
      expectedDistinctSolutionCount={expectedDistinctSolutionCount}
      onSubEquationChange={onSubEquationChange}
      onAnswerChange={onAnswerChange}
      onValidate={onValidate}
      onEmptySet={onEmptySet}
      onFinishResolution={onFinishResolution}
      onReset={onReset}
    />
  );

  return (
    <div className="w-full min-h-[calc(100vh-7rem)] flex flex-col items-center justify-center">
      {hasSteps ? (
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,24rem)] gap-6 items-stretch">
          <div className="min-w-0 min-h-0">{workspace}</div>
          <div className="flex min-h-0 min-w-0 flex-col lg:h-full">
            <ResolveEquationStepsCard steps={steps} />
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl mx-auto">{workspace}</div>
      )}
    </div>
  );
};
