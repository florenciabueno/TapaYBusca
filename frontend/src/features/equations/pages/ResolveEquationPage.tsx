import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../../config/constants';
import { COLORS } from '../../../config/theme';
import { EquationsLayout } from '../components/EquationsLayout';
import { EquationsMessageCard } from '../components/EquationsMessageCard';
import { ResolveEquationContent } from '../components/ResolveEquation';
import { useResolveEquation } from '../hooks/useResolveEquation';

export const ResolveEquationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    equation,
    steps,
    solutionSet,
    solutionSetLatex,
    loading,
    error,
    form,
    status,
    outcome,
    actions,
  } = useResolveEquation(id);

  if (loading || !id) {
    return (
      <EquationsLayout>
        <div className="flex min-h-[40vh] items-center justify-center w-full">
          <p className="text-sm" style={{ color: COLORS.brandDark }}>
            Cargando ecuación...
          </p>
        </div>
      </EquationsLayout>
    );
  }

  if (error || !equation) {
    return (
      <EquationsLayout>
        <EquationsMessageCard
          variant="error"
          message={error ?? 'Ecuación no encontrada'}
          onBack={() => navigate(ROUTES.DASHBOARD)}
        />
      </EquationsLayout>
    );
  }

  return (
    <EquationsLayout>
      <ResolveEquationContent
        equationExpression={equation.equation}
        steps={steps}
        solutionSet={solutionSet}
        solutionSetLatex={solutionSetLatex}
        form={form}
        status={status}
        outcome={outcome}
        actions={actions}
        isReadOnly={equation.isActive === false}
      />
    </EquationsLayout>
  );
};
