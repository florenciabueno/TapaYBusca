import { FormPageCard } from '../FormPageCard';
import type { ResolutionStep } from '../../types';
import { ResolveEquationEquationPanel } from './ResolveEquationEquationPanel';
import { ResolveEquationStepsCard } from './ResolveEquationStepsCard';

interface DeletedEquationViewProps {
  equationExpression: string;
  steps: ResolutionStep[];
}

export const DeletedEquationView = ({
  equationExpression,
  steps,
}: DeletedEquationViewProps) => {
  const hasSteps = steps.length > 0;

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
};
