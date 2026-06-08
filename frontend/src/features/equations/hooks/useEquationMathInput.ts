import type {
  ChangeEvent,
  ClipboardEvent,
  Dispatch,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  SetStateAction,
  SyntheticEvent,
} from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { handleEquationInputKeyDown, sanitizeEquationPastedText } from '../utils/equation-input-guards';
import { insertMathSymbolAtSelection } from '../utils/equation-symbol-insert';

const readSelection = (el: HTMLInputElement) => ({
  start: el.selectionStart ?? 0,
  end: el.selectionEnd ?? 0,
});

export type EquationMathInputOptions = {
  /** Called when the input receives focus (e.g. to mark this field as active for the math pad). */
  onFocus?: () => void;
  /** Incógnita fijada (resolución). Si no se pasa, se infiere al escribir "=" en creación. */
  equationVariable?: string | null;
};

/**
 * Controlled equation input: selection tracking, caret restore after pad insert or paste,
 * and allowed-key / paste sanitization consistent with {@link handleEquationInputKeyDown}.
 */
export const useEquationMathInput = (
  value: string,
  onChange: Dispatch<SetStateAction<string>>,
  options?: EquationMathInputOptions
) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const pendingCaretRef = useRef<number | null>(null);
  const onFocusRef = useRef(options?.onFocus);
  onFocusRef.current = options?.onFocus;
  const equationVariableRef = useRef(options?.equationVariable);
  equationVariableRef.current = options?.equationVariable;

  useLayoutEffect(() => {
    const pos = pendingCaretRef.current;
    if (pos === null || !inputRef.current) return;
    pendingCaretRef.current = null;
    const el = inputRef.current;
    el.focus();
    el.setSelectionRange(pos, pos);
  }, [value]);

  const insertFromPad = useCallback(
    (insert: string) => {
      const { start, end } = selectionRef.current;
      onChange((prev) => {
        const { nextValue, cursorPos } = insertMathSymbolAtSelection(prev, start, end, insert);
        pendingCaretRef.current = cursorPos;
        selectionRef.current = { start: cursorPos, end: cursorPos };
        return nextValue;
      });
    },
    [onChange]
  );

  const inputHandlers = useMemo(
    () => ({
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const el = e.target;
        selectionRef.current = readSelection(el);
        onChange(el.value);
      },
      onKeyDown: (e: KeyboardEvent<HTMLInputElement>) =>
        handleEquationInputKeyDown(e, equationVariableRef.current),
      onPaste: (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text');
        const sanitized = sanitizeEquationPastedText(pasted);
        if (!sanitized) return;
        const input = e.target as HTMLInputElement;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        onChange((prev) => {
          const nextValue = prev.slice(0, start) + sanitized + prev.slice(end);
          const cursorPos = start + sanitized.length;
          pendingCaretRef.current = cursorPos;
          selectionRef.current = { start: cursorPos, end: cursorPos };
          return nextValue;
        });
      },
      onBlur: (e: FocusEvent<HTMLInputElement>) => {
        selectionRef.current = readSelection(e.target);
      },
      onSelect: (e: SyntheticEvent<HTMLInputElement>) => {
        selectionRef.current = readSelection(e.target as HTMLInputElement);
      },
      onClick: (e: MouseEvent<HTMLInputElement>) => {
        selectionRef.current = readSelection(e.target as HTMLInputElement);
      },
      onFocus: () => {
        onFocusRef.current?.();
      },
    }),
    [onChange]
  );

  return { inputRef, inputHandlers, insertFromPad };
};
