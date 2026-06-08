import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useRef } from 'react';
import { useEquationMathInput } from './useEquationMathInput';

type ActiveField = 'sub' | 'answer';

export const useResolveEquationFormInputs = (
  subEquationInfix: string,
  answer: string,
  onSubEquationChange: Dispatch<SetStateAction<string>>,
  onAnswerChange: Dispatch<SetStateAction<string>>,
  equationVariable?: string | null
) => {
  const activeFieldRef = useRef<ActiveField>('sub');

  const subInput = useEquationMathInput(subEquationInfix, onSubEquationChange, {
    onFocus: () => { activeFieldRef.current = 'sub'; },
    equationVariable,
  });

  const answerInput = useEquationMathInput(answer, onAnswerChange, {
    onFocus: () => { activeFieldRef.current = 'answer'; },
    equationVariable,
  });

  const handlePadSymbol = useCallback(
    (insert: string) => {
      if (activeFieldRef.current === 'sub') subInput.insertFromPad(insert);
      else answerInput.insertFromPad(insert);
    },
    [subInput.insertFromPad, answerInput.insertFromPad]
  );

  return {
    subInputRef: subInput.inputRef,
    answerInputRef: answerInput.inputRef,
    handlePadSymbol,
    subEquationInputHandlers: subInput.inputHandlers,
    answerInputHandlers: answerInput.inputHandlers,
  };
};
