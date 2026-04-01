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
    token,
    equation,
    steps,
    solutionSet,
    loading,
    error,
    subEquationInfix,
    answer,
    submitting,
    message,
    finished,
    finishedCode,
    setSubEquationInfix,
    setAnswer,
    setActiveInput,
    handleSymbolClick,
    handleValidate,
    handleEmptySet,
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

  if (!token) {
    return (
      <EquationsLayout>
        <EquationsMessageCard
          variant="info"
          message="Inicia sesión para resolver y guardar tu progreso."
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
        subEquationInfix={subEquationInfix}
        answer={answer}
        submitting={submitting}
        message={message}
        finished={finished}
        finishedCode={finishedCode}
        onBack={() => navigate(ROUTES.DASHBOARD)}
        onSubEquationChange={setSubEquationInfix}
        onAnswerChange={setAnswer}
        onSubEquationFocus={() => setActiveInput('subEquation')}
        onAnswerFocus={() => setActiveInput('answer')}
        onSymbolClick={handleSymbolClick}
        onValidate={handleValidate}
        onEmptySet={handleEmptySet}
        onReset={handleReset}
      />
    </EquationsLayout>
  );
};
