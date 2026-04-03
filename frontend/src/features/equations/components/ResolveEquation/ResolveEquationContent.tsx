import type { Dispatch, SetStateAction } from 'react';
import { FormPageCard } from '../FormPageCard';
import type { ResolutionStep } from '../../types';
import { ResolveEquationEquationPanel } from './ResolveEquationEquationPanel';
import { ResolveEquationResultPanel } from './ResolveEquationResultPanel';
import { ResolveEquationFormPanel } from './ResolveEquationFormPanel';
import { ResolveEquationStepsCard } from './ResolveEquationStepsCard';

interface ResolveEquationContentProps {
  equationExpression: string;
  steps: ResolutionStep[];
  solutionSet: number[];
  subEquationInfix: string;
  answer: string;
  submitting: boolean;
  message: string | null;
  finished: boolean;
  finishedCode: string | null;
  /** Eliminada (soft delete): solo historial de pasos, sin formulario de resolución. */
  isReadOnly?: boolean;
  onSubEquationChange: Dispatch<SetStateAction<string>>;
  onAnswerChange: Dispatch<SetStateAction<string>>;
  onValidate: () => void;
  onEmptySet: () => void;
  onReset: () => void;
}

export const ResolveEquationContent = ({
  equationExpression,
  steps,
  solutionSet,
  subEquationInfix,
  answer,
  submitting,
  message,
  finished,
  finishedCode,
  isReadOnly = false,
  onSubEquationChange,
  onAnswerChange,
  onValidate,
  onEmptySet,
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

  const resolveCard = (
    <FormPageCard
      title="Resolver ecuación"
      description="Completa los pasos para hallar el conjunto solución. Usa la botonera para ingresar símbolos."
      maxWidth={hasSteps ? 'full' : 'wide'}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 lg:gap-8">
        <ResolveEquationEquationPanel equationExpression={equationExpression} />
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
              message={message}
              onSubEquationChange={onSubEquationChange}
              onAnswerChange={onAnswerChange}
              onValidate={onValidate}
              onEmptySet={onEmptySet}
              onReset={onReset}
            />
          )}
        </div>
      </div>
    </FormPageCard>
  );

  return (
    <div className="w-full min-h-[calc(100vh-7rem)] flex flex-col items-center justify-center">
      {hasSteps ? (
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,24rem)] gap-6 items-stretch">
          <div className="min-w-0 min-h-0">{resolveCard}</div>
          <div className="flex min-h-0 min-w-0 flex-col lg:h-full">
            <ResolveEquationStepsCard steps={steps} />
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl mx-auto">{resolveCard}</div>
      )}
    </div>
  );
};
