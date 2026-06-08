import { COLORS, SPACING } from '../../../../config/theme';
import { FormMessage } from '../../../../shared/components/ui/FormMessage';
import { Input } from '../../../../shared/components/ui/Input/Input';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { MathSymbolsPad, RESOLUTION_MATH_SYMBOLS } from '../MathSymbolsPad';
import { useResolveEquationFormInputs } from '../../hooks/useResolveEquationFormInputs';
import { extractEquationVariable } from '../../utils/equation-input-guards';
import type {
  ResolutionActions,
  ResolutionFormState,
  ResolutionMutationStatus,
} from '../../types';

interface ResolveEquationFormPanelProps {
  equationInfixExpression?: string | null;
  form: ResolutionFormState;
  status: ResolutionMutationStatus;
  actions: ResolutionActions;
}

export const ResolveEquationFormPanel = ({
  equationInfixExpression,
  form,
  status,
  actions,
}: ResolveEquationFormPanelProps) => {
  const { subEquationInfix, answer, message } = form;
  const { submitting, resolveStepPending, finishResolutionPending } = status;
  const { onSubEquationChange, onAnswerChange, onValidate, onFinishResolution, onReset } = actions;

  const {
    subInputRef,
    answerInputRef,
    handlePadSymbol,
    subEquationInputHandlers,
    answerInputHandlers,
  } = useResolveEquationFormInputs(
    subEquationInfix,
    answer,
    onSubEquationChange,
    onAnswerChange,
    extractEquationVariable(equationInfixExpression ?? '')
  );

  return (
    <>
      <fieldset
        translate="no"
        style={{ marginBottom: SPACING.lg }}
        className="min-w-0 border-0 p-0 m-0"
      >
        <legend
          className="block text-sm font-medium mb-2 px-0"
          style={{ color: COLORS.accentSecondary }}
        >
          Resuelve la ecuación
        </legend>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Input
              ref={subInputRef}
              label=""
              value={subEquationInfix}
              {...subEquationInputHandlers}
              placeholder="ej. x, 1/2, x+5"
              disabled={submitting}
              autoComplete="off"
              labelColor="secondary"
            />
          </div>
          <span
            className="text-xl font-bold self-center hidden sm:inline"
            style={{ color: COLORS.accentSecondary }}
            aria-hidden
          >
            =
          </span>
          <div className="flex-1 min-w-0">
            <Input
              ref={answerInputRef}
              label=""
              value={answer}
              {...answerInputHandlers}
              placeholder="ej. 3, x*2, 0,5"
              disabled={submitting}
              autoComplete="off"
              labelColor="secondary"
            />
          </div>
        </div>
        <p
          className="mt-1 text-xs"
          style={{ color: COLORS.gray[500] }}
        >
          Teclado: números, x, =, * + - / y paréntesis
        </p>
      </fieldset>
      <MathSymbolsPad
        symbols={RESOLUTION_MATH_SYMBOLS}
        onSymbolClick={handlePadSymbol}
        disabled={submitting}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="accent" disabled={submitting} onClick={onValidate}>
          {resolveStepPending ? 'Validando...' : 'Validar paso'}
        </Button>
        <Button type="button" variant="accent" disabled={submitting} onClick={onFinishResolution}>
          {finishResolutionPending ? 'Finalizando...' : 'Terminar resolución'}
        </Button>
        <Button type="button" variant="outline" disabled={submitting} onClick={onReset}>
          Reiniciar
        </Button>
      </div>

      {message ? (
        <FormMessage message={message} variant="info" className="mt-4" />
      ) : null}
    </>
  );
};
