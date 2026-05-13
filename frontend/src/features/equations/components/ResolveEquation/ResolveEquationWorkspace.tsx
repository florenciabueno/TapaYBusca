import type { Dispatch, SetStateAction } from 'react';
import { FormPageCard } from '../FormPageCard';
import { ResolveEquationEquationPanel } from './ResolveEquationEquationPanel';
import { ResolveEquationFormPanel } from './ResolveEquationFormPanel';
import { ResolveEquationResultPanel } from './ResolveEquationResultPanel';

export interface ResolveEquationWorkspaceProps {
  equationExpression: string;
  hasSteps: boolean;
  subEquationInfix: string;
  answer: string;
  submitting: boolean;
  resolveStepPending: boolean;
  finishResolutionPending: boolean;
  message: string | null;
  finished: boolean;
  finishedCode: string | null;
  solutionSet: number[];
  onSubEquationChange: Dispatch<SetStateAction<string>>;
  onAnswerChange: Dispatch<SetStateAction<string>>;
  onValidate: () => void;
  onFinishResolution: () => void;
  onReset: () => void;
}

export const ResolveEquationWorkspace = ({
  equationExpression,
  hasSteps,
  subEquationInfix,
  answer,
  submitting,
  resolveStepPending,
  finishResolutionPending,
  message,
  finished,
  finishedCode,
  solutionSet,
  onSubEquationChange,
  onAnswerChange,
  onValidate,
  onFinishResolution,
  onReset,
}: ResolveEquationWorkspaceProps) => {
  return (
    <FormPageCard
      title="Resolver ecuación"
      description="Completa los pasos para hallar el conjunto solución. Usa la botonera para ingresar símbolos."
      maxWidth={hasSteps ? 'full' : 'wide'}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 lg:gap-8">
        <ResolveEquationEquationPanel
          equationExpression={equationExpression}
          partialSolutionSet={finished ? undefined : solutionSet}
        />
        <div className="flex flex-col min-h-0">
          {finished ? (
            <ResolveEquationResultPanel
              finishedCode={finishedCode}
              solutionSet={solutionSet}
              onReset={onReset}
            />
          ) : (
            <ResolveEquationFormPanel
              subEquationInfix={subEquationInfix}
              answer={answer}
              submitting={submitting}
              resolveStepPending={resolveStepPending}
              finishResolutionPending={finishResolutionPending}
              message={message}
              onSubEquationChange={onSubEquationChange}
              onAnswerChange={onAnswerChange}
              onValidate={onValidate}
              onFinishResolution={onFinishResolution}
              onReset={onReset}
            />
          )}
        </div>
      </div>
    </FormPageCard>
  );
};
