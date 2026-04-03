import type { ClipboardEvent, ChangeEvent, Dispatch, FocusEvent, MouseEvent, SetStateAction, SyntheticEvent } from 'react';
import { useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import {
  handleEquationInputKeyDown,
  handleEquationInputPaste,
} from '../utils/equation-input-guards';
import { insertMathSymbolAtSelection } from '../utils/equation-symbol-insert';

type ActiveField = 'sub' | 'answer';

type PendingCaret = { field: ActiveField; pos: number };

const readSelection = (el: HTMLInputElement) => {
  return { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
};

export const useResolveEquationFormInputs = (
  subEquationInfix: string,
  answer: string,
  onSubEquationChange: Dispatch<SetStateAction<string>>,
  onAnswerChange: Dispatch<SetStateAction<string>>
) => {
  const subInputRef = useRef<HTMLInputElement>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);
  const subSelectionRef = useRef({ start: 0, end: 0 });
  const answerSelectionRef = useRef({ start: 0, end: 0 });
  const activeFieldRef = useRef<ActiveField>('sub');
  const pendingCaretRef = useRef<PendingCaret | null>(null);

  useLayoutEffect(() => {
    const pending = pendingCaretRef.current;
    if (pending === null) return;
    const ref = pending.field === 'sub' ? subInputRef : answerInputRef;
    const el = ref.current;
    if (!el) return;
    pendingCaretRef.current = null;
    el.focus();
    el.setSelectionRange(pending.pos, pending.pos);
  }, [subEquationInfix, answer]);

  const handlePadSymbol = useCallback(
    (insert: string) => {
      const field = activeFieldRef.current;
      if (field === 'sub') {
        const { start, end } = subSelectionRef.current;
        onSubEquationChange((prev) => {
          const { nextValue, cursorPos } = insertMathSymbolAtSelection(prev, start, end, insert);
          pendingCaretRef.current = { field: 'sub', pos: cursorPos };
          subSelectionRef.current = { start: cursorPos, end: cursorPos };
          return nextValue;
        });
      } else {
        const { start, end } = answerSelectionRef.current;
        onAnswerChange((prev) => {
          const { nextValue, cursorPos } = insertMathSymbolAtSelection(prev, start, end, insert);
          pendingCaretRef.current = { field: 'answer', pos: cursorPos };
          answerSelectionRef.current = { start: cursorPos, end: cursorPos };
          return nextValue;
        });
      }
    },
    [onSubEquationChange, onAnswerChange]
  );

  const subEquationInputHandlers = useMemo(
    () => ({
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const el = e.target;
        subSelectionRef.current = readSelection(el);
        onSubEquationChange(el.value);
      },
      onKeyDown: handleEquationInputKeyDown,
      onPaste: (e: ClipboardEvent<HTMLInputElement>) => handleEquationInputPaste(e, onSubEquationChange),
      onFocus: () => {
        activeFieldRef.current = 'sub';
      },
      onBlur: (e: FocusEvent<HTMLInputElement>) => {
        subSelectionRef.current = readSelection(e.target);
      },
      onSelect: (e: SyntheticEvent<HTMLInputElement>) => {
        subSelectionRef.current = readSelection(e.target as HTMLInputElement);
      },
      onClick: (e: MouseEvent<HTMLInputElement>) => {
        subSelectionRef.current = readSelection(e.target as HTMLInputElement);
      },
    }),
    [onSubEquationChange]
  );

  const answerInputHandlers = useMemo(
    () => ({
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const el = e.target;
        answerSelectionRef.current = readSelection(el);
        onAnswerChange(el.value);
      },
      onKeyDown: handleEquationInputKeyDown,
      onPaste: (e: ClipboardEvent<HTMLInputElement>) => handleEquationInputPaste(e, onAnswerChange),
      onFocus: () => {
        activeFieldRef.current = 'answer';
      },
      onBlur: (e: FocusEvent<HTMLInputElement>) => {
        answerSelectionRef.current = readSelection(e.target);
      },
      onSelect: (e: SyntheticEvent<HTMLInputElement>) => {
        answerSelectionRef.current = readSelection(e.target as HTMLInputElement);
      },
      onClick: (e: MouseEvent<HTMLInputElement>) => {
        answerSelectionRef.current = readSelection(e.target as HTMLInputElement);
      },
    }),
    [onAnswerChange]
  );

  return {
    subInputRef,
    answerInputRef,
    handlePadSymbol,
    subEquationInputHandlers,
    answerInputHandlers,
  };
};
