import { Link } from 'react-router-dom';
import { ROUTES } from '../../../../config/constants';
import { COLORS } from '../../../../config/theme';
import { useAuthStore } from '../../../../stores';
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

const BackToHomeLink = () => (
  <Link
    to={ROUTES.DASHBOARD}
    className="mb-3 inline-flex items-center gap-1 self-start text-sm font-medium transition-opacity hover:opacity-80 focus:outline-none focus-visible:underline"
    style={{ color: COLORS.accentSecondary }}
  >
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
    Volver al inicio
  </Link>
);

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
  const user = useAuthStore((state) => state.user);
  const showBackToHome = !user;

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
        <div className="flex w-full max-w-7xl flex-col">
          {showBackToHome && <BackToHomeLink />}
          <div className="flex w-full flex-col gap-6 lg:min-h-0 lg:flex-row lg:items-stretch lg:justify-center">
            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">{workspace}</div>
            <div className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden lg:w-[min(24rem,100%)] lg:flex-shrink-0">
              <ResolveEquationStepsCard steps={steps} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-5xl flex-col">
          {showBackToHome && <BackToHomeLink />}
          {workspace}
        </div>
      )}
    </div>
  );
};
