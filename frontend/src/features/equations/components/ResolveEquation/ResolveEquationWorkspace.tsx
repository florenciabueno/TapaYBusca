import { FormPageCard } from '../FormPageCard';
import type {
  ResolutionActions,
  ResolutionFormState,
  ResolutionMutationStatus,
  ResolutionOutcome,
} from '../../types';
import { ResolveEquationEquationPanel } from './ResolveEquationEquationPanel';
import { ResolveEquationFormPanel } from './ResolveEquationFormPanel';
import { ResolveEquationResultPanel } from './ResolveEquationResultPanel';

export interface ResolveEquationWorkspaceProps {
  equationExpression: string;
  hasSteps: boolean;
  solutionSet: number[];
  solutionSetLatex?: string[];
  form: ResolutionFormState;
  status: ResolutionMutationStatus;
  outcome: ResolutionOutcome;
  actions: ResolutionActions;
}

export const ResolveEquationWorkspace = ({
  equationExpression,
  hasSteps,
  solutionSet,
  solutionSetLatex,
  form,
  status,
  outcome,
  actions,
}: ResolveEquationWorkspaceProps) => {
  return (
    <FormPageCard
      title="Resolución"
      description="Consulta tu historial de resolución."
      maxWidth={hasSteps ? 'full' : 'wide'}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 lg:gap-8">
        <ResolveEquationEquationPanel
          equationExpression={equationExpression}
          partialSolutionSet={outcome.finished ? undefined : solutionSet}
          partialSolutionSetLatex={outcome.finished ? undefined : solutionSetLatex}
        />
        <div className="flex flex-col min-h-0">
          {outcome.finished ? (
            <ResolveEquationResultPanel
              finishedCode={outcome.finishedCode}
              solutionSet={solutionSet}
              solutionSetLatex={solutionSetLatex}
              onReset={actions.onReset}
            />
          ) : (
            <ResolveEquationFormPanel form={form} status={status} actions={actions} />
          )}
        </div>
      </div>
    </FormPageCard>
  );
};
