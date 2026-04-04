import type { Dispatch, SetStateAction } from 'react';
import { COLORS, SPACING } from '../../../../config/theme';
import { FormMessage } from '../../../../shared/components/ui/FormMessage';
import { Input } from '../../../../shared/components/ui/Input/Input';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { MathSymbolsPad, DEFAULT_MATH_SYMBOLS } from '../MathSymbolsPad';
import { useResolveEquationFormInputs } from '../../hooks/useResolveEquationFormInputs';

interface ResolveEquationFormPanelProps {
  subEquationInfix: string;
  answer: string;
  submitting: boolean;
  message: string | null;
  onSubEquationChange: Dispatch<SetStateAction<string>>;
  onAnswerChange: Dispatch<SetStateAction<string>>;
  onValidate: () => void;
  onEmptySet: () => void;
  onReset: () => void;
}

export const ResolveEquationFormPanel = ({
  subEquationInfix,
  answer,
  submitting,
  message,
  onSubEquationChange,
  onAnswerChange,
  onValidate,
  onEmptySet,
  onReset,
}: ResolveEquationFormPanelProps) => {
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
    onAnswerChange
  );

  return (
    <>
      <fieldset
        style={{ marginBottom: SPACING.lg }}
        className="min-w-0 border-0 p-0 m-0"
      >
        <legend
          className="block text-sm font-medium mb-2 px-0"
          style={{ color: COLORS.accentSecondary }}
        >
          Subecuación = Tu respuesta
        </legend>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Input
              ref={subInputRef}
              label=""
              value={subEquationInfix}
              {...subEquationInputHandlers}
              placeholder="ej. x, 2*x, x+5"
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
              placeholder="ej. 3, 1/2, 0,5"
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
        symbols={DEFAULT_MATH_SYMBOLS}
        onSymbolClick={handlePadSymbol}
        disabled={submitting}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="accent" disabled={submitting} onClick={onValidate}>
          {submitting ? 'Validando...' : 'Validar'}
        </Button>
        <Button type="button" variant="outline" disabled={submitting} onClick={onEmptySet}>
          S = {'{}'}
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
