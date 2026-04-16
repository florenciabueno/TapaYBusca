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
  resolveStepPending: boolean;
  finishResolutionPending: boolean;
  message: string | null;
  solutionSet: number[];
  expectedDistinctSolutionCount: number;
  onSubEquationChange: Dispatch<SetStateAction<string>>;
  onAnswerChange: Dispatch<SetStateAction<string>>;
  onValidate: () => void;
  onEmptySet: () => void;
  onFinishResolution: () => void;
  onReset: () => void;
}

export const ResolveEquationFormPanel = ({
  subEquationInfix,
  answer,
  submitting,
  resolveStepPending,
  finishResolutionPending,
  message,
  solutionSet,
  expectedDistinctSolutionCount,
  onSubEquationChange,
  onAnswerChange,
  onValidate,
  onEmptySet,
  onFinishResolution,
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

  const showSolutionChips = solutionSet.length > 0;
  const showMultiHint = expectedDistinctSolutionCount > 1;

  return (
    <>
      {showSolutionChips ? (
        <div style={{ marginBottom: SPACING.lg }}>
          <p className="text-sm font-medium mb-2" style={{ color: COLORS.accentSecondary }}>
            Raíces ya registradas
          </p>
          <ul className="flex flex-wrap gap-2 list-none p-0 m-0" aria-label="Raíces del conjunto solución ingresadas">
            {solutionSet.map((v) => (
              <li
                key={`${v}`}
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                style={{
                  backgroundColor: COLORS.gray[100],
                  color: COLORS.brandDark,
                  border: `1px solid ${COLORS.gray[200]}`,
                }}
              >
                {formatSolutionChipLabel(v)}
              </li>
            ))}
          </ul>
          {showMultiHint ? (
            <p className="mt-2 text-xs" style={{ color: COLORS.gray[500] }}>
              Esta ecuación tiene hasta {expectedDistinctSolutionCount} raíces distintas en el conjunto
              solución. Ingresalas como subecuación «x» antes de terminar.
            </p>
          ) : null}
        </div>
      ) : showMultiHint ? (
        <p className="mb-4 text-xs" style={{ color: COLORS.gray[500], marginBottom: SPACING.lg }}>
          Cuando corresponda, registrá las raíces como subecuación «x». Esta ecuación tiene hasta{' '}
          {expectedDistinctSolutionCount} raíces distintas.
        </p>
      ) : null}
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
          {resolveStepPending ? 'Validando...' : 'Validar paso'}
        </Button>
        <Button type="button" variant="accent" disabled={submitting} onClick={onFinishResolution}>
          {finishResolutionPending ? 'Finalizando...' : 'Terminar resolución'}
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

function formatSolutionChipLabel(value: number): string {
  const roundedInt = Math.round(value);
  if (Math.abs(value - roundedInt) <= 1e-9) return String(roundedInt);
  return String(Number(value.toFixed(4)));
}
