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
  onFinishResolution: () => void;
  onReset: () => void;
}

export const ResolveEquationContent = ({
  equationExpression,
  steps,
  solutionSet,
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
      onSubEquationChange={onSubEquationChange}
      onAnswerChange={onAnswerChange}
      onValidate={onValidate}
      onFinishResolution={onFinishResolution}
      onReset={onReset}
    />
  );

  return (
    <div className="flex min-h-[calc(100vh-7rem)] w-full flex-col items-center justify-center px-2 py-4">
      {hasSteps ? (
        <div className="flex w-full max-w-7xl flex-col gap-6 lg:min-h-0 lg:flex-row lg:items-stretch lg:justify-center">
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
            {workspace}
          </div>
          <div className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden lg:w-[min(24rem,100%)] lg:flex-shrink-0">
            <ResolveEquationStepsCard steps={steps} />
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-5xl">{workspace}</div>
      )}
    </div>
  );
};
