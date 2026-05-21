import type {
  ResolutionActions,
  ResolutionFormState,
  ResolutionMutationStatus,
  ResolutionOutcome,
  ResolutionStep,
} from '../../types';
import { DeletedEquationView } from './DeletedEquationView';
import { ResolveEquationStepsCard } from './ResolveEquationStepsCard';
import { ResolveEquationWorkspace } from './ResolveEquationWorkspace';

interface ResolveEquationContentProps {
  equationExpression: string;
  steps: ResolutionStep[];
  solutionSet: number[];
  form: ResolutionFormState;
  status: ResolutionMutationStatus;
  outcome: ResolutionOutcome;
  actions: ResolutionActions;
  isReadOnly?: boolean;
}

export const ResolveEquationContent = ({
  equationExpression,
  steps,
  solutionSet,
  form,
  status,
  outcome,
  actions,
  isReadOnly = false,
}: ResolveEquationContentProps) => {
  if (isReadOnly) {
    return <DeletedEquationView equationExpression={equationExpression} steps={steps} />;
  }

  const hasSteps = steps.length > 0;
  const workspace = (
    <ResolveEquationWorkspace
      equationExpression={equationExpression}
      hasSteps={hasSteps}
      solutionSet={solutionSet}
      form={form}
      status={status}
      outcome={outcome}
      actions={actions}
    />
  );

  return (
    <div className="flex min-h-[calc(100vh-7rem)] w-full flex-col items-center justify-center px-2 py-4">
      {hasSteps ? (
        <div className="flex w-full max-w-7xl flex-col gap-6 lg:min-h-0 lg:flex-row lg:items-stretch lg:justify-center">
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">{workspace}</div>
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
