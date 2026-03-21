import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../../config/constants';
import { COLORS, SHADOW } from '../../../config/theme';
import { EquationsLayout } from '../components/EquationsLayout';
import { ResolveEquationContent } from '../components/ResolveEquation';
import { useResolveEquation } from '../hooks/useResolveEquation';

export const ResolveEquationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = () => navigate(ROUTES.DASHBOARD);

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
        <div className="w-full">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error ?? 'Ecuación no encontrada'}</p>
            <button
              type="button"
              onClick={goBack}
              className="mt-2 text-sm font-medium underline"
              style={{ color: COLORS.brandDark }}
            >
              Volver al listado
            </button>
          </div>
        </div>
      </EquationsLayout>
    );
  }

  if (!token) {
    return (
      <EquationsLayout>
        <div className="w-full">
          <div className="rounded-lg border p-4" style={{ borderColor: COLORS.brandDark, boxShadow: SHADOW.sm }}>
            <p className="text-sm text-gray-700">Inicia sesión para resolver y guardar tu progreso.</p>
            <button
              type="button"
              onClick={goBack}
              className="mt-2 text-sm font-medium underline"
              style={{ color: COLORS.brandDark }}
            >
              Volver al listado
            </button>
          </div>
        </div>
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
        onBack={goBack}
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
