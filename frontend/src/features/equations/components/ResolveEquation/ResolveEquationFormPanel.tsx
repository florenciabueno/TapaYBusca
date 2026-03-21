import type { Dispatch, SetStateAction } from 'react';
import { COLORS, SPACING } from '../../../../config/theme';
import { Input } from '../../../../shared/components/ui/Input/Input';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { MathSymbolsPad, DEFAULT_MATH_SYMBOLS } from '../MathSymbolsPad';
import {
  handleEquationInputKeyDown,
  handleEquationInputPaste,
} from '../../utils/equation-input-guards';

interface ResolveEquationFormPanelProps {
  subEquationInfix: string;
  answer: string;
  submitting: boolean;
  message: string | null;
  onSubEquationChange: Dispatch<SetStateAction<string>>;
  onAnswerChange: Dispatch<SetStateAction<string>>;
  onSubEquationFocus: () => void;
  onAnswerFocus: () => void;
  onSymbolClick: (insert: string) => void;
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
  onSubEquationFocus,
  onAnswerFocus,
  onSymbolClick,
  onValidate,
  onEmptySet,
  onReset,
}: ResolveEquationFormPanelProps) => {
  return (
    <>
      <label className="block text-sm font-medium mb-2" style={{ color: COLORS.accentSecondary }}>
        Subecuación = Tu respuesta
      </label>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <Input
            label=""
            value={subEquationInfix}
            onChange={(e) => onSubEquationChange(e.target.value)}
            onKeyDown={handleEquationInputKeyDown}
            onPaste={(e) => handleEquationInputPaste(e, onSubEquationChange)}
            onFocus={onSubEquationFocus}
            placeholder="ej. x, 2*x, x+5"
            disabled={submitting}
            autoComplete="off"
            labelColor="secondary"
          />
        </div>
        <span
          className="text-xl font-bold self-center hidden sm:inline"
          style={{ color: COLORS.accentSecondary }}
        >
          =
        </span>
        <div className="flex-1 min-w-0">
          <Input
            label=""
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            onKeyDown={handleEquationInputKeyDown}
            onPaste={(e) => handleEquationInputPaste(e, onAnswerChange)}
            onFocus={onAnswerFocus}
            placeholder="ej. 3, 1/2, 0,5"
            disabled={submitting}
            autoComplete="off"
            labelColor="secondary"
          />
        </div>
      </div>
      <p className="text-xs mb-4" style={{ color: COLORS.gray[500] }}>
        Usa la botonera para √, ³√, +, -, etc. Puedes escribir 1/2 o 0,5.
      </p>

      <div style={{ marginBottom: SPACING.lg }}>
        <MathSymbolsPad
          symbols={DEFAULT_MATH_SYMBOLS}
          onSymbolClick={onSymbolClick}
          disabled={submitting}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="accent" disabled={submitting} onClick={onValidate}>
          {submitting ? 'Validando...' : 'VALIDAR'}
        </Button>
        <Button type="button" variant="outline" disabled={submitting} onClick={onEmptySet}>
          S = {'{}'}
        </Button>
        <Button type="button" variant="outline" disabled={submitting} onClick={onReset}>
          Reiniciar desde 0
        </Button>
      </div>

      {message && (
        <p className="mt-4 text-sm" style={{ color: COLORS.accentSecondary }}>
          {message}
        </p>
      )}
    </>
  );
};
