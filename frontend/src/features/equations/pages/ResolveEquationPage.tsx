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
    loading,
    error,
    subEquationInfix,
    answer,
    submitting,
    resolveStepPending,
    finishResolutionPending,
    message,
    finished,
    finishedCode,
    setSubEquationInfix,
    setAnswer,
    handleValidate,
    handleFinishResolution,
    handleReset,
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

  const isDeletedEquation = equation.isActive === false;

  return (
    <EquationsLayout>
      <ResolveEquationContent
        equationExpression={equation.equation}
        steps={steps}
        solutionSet={solutionSet}
        subEquationInfix={subEquationInfix}
        answer={answer}
        submitting={submitting}
        resolveStepPending={resolveStepPending}
        finishResolutionPending={finishResolutionPending}
        message={message}
        finished={finished}
        finishedCode={finishedCode}
        isReadOnly={isDeletedEquation}
        onSubEquationChange={setSubEquationInfix}
        onAnswerChange={setAnswer}
        onValidate={handleValidate}
        onFinishResolution={handleFinishResolution}
        onReset={handleReset}
      />
    </EquationsLayout>
  );
};
