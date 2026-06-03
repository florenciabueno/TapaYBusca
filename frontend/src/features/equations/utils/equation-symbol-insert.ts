/**
 * Insert a math pad fragment at a caret / selection range and compute the next caret position.
 * Strings ending with `()` (e.g. sqrt(), cbrt()) place the caret between the parentheses.
 */
export function insertMathSymbolAtSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  insert: string
): { nextValue: string; cursorPos: number } {
  const start = Math.max(0, Math.min(selectionStart, value.length));
  const end = Math.max(start, Math.min(selectionEnd, value.length));
  const nextValue = value.slice(0, start) + insert + value.slice(end);
  const placeInsideParens = insert.endsWith('()');
  const placeInsidePipes = insert === '||';
  const cursorPos = placeInsidePipes
    ? start + 1
    : placeInsideParens
      ? start + insert.length - 1
      : start + insert.length;
  return { nextValue, cursorPos };
}
