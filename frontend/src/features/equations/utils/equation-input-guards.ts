import type { KeyboardEvent } from 'react';

/** Printable characters allowed via keyboard and paste  */
const PRINTABLE_EQUATION_KEYS = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'x', 'X', '=',
  '*', '+', '/', '-', '(', ')',
] as const;

const NAVIGATION_KEYS = [
  'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End',
] as const;

export const ALLOWED_EQUATION_KEYS = new Set<string>([
  ...PRINTABLE_EQUATION_KEYS,
  ...NAVIGATION_KEYS,
]);

const PASTE_DISALLOWED_RE = /[^0-9xX=*+()\-/]/gi;

/** Strips characters not allowed in equation inputs (keyboard rules). */
export function sanitizeEquationPastedText(pasted: string): string {
  return pasted.replace(PASTE_DISALLOWED_RE, '');
}

export function handleEquationInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
  if (ALLOWED_EQUATION_KEYS.has(e.key)) return;
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x') return;
  }
  e.preventDefault();
}
