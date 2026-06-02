import type { KeyboardEvent } from 'react';
import { formatDecimalCommaForDisplay } from './format-solution-set';

const PRINTABLE_EQUATION_KEYS = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'x', 'X', '=',
  '*', '+', '/', '-', '(', ')', '^', ',',
] as const;

const NAVIGATION_KEYS = [
  'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End',
] as const;

export const ALLOWED_EQUATION_KEYS = new Set<string>([
  ...PRINTABLE_EQUATION_KEYS,
  ...NAVIGATION_KEYS,
]);

const PASTE_DISALLOWED_RE = /[^0-9xX=*+(),\-/^]/gi;

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

function takeBalancedParen(str: string, openIndex: number): string | null {
  if (str[openIndex] !== '(') return null;
  let depth = 1;
  for (let i = openIndex + 1; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') {
      depth--;
      if (depth === 0) return str.slice(openIndex + 1, i);
    }
  }
  return null;
}

export function splitInfixAtEquals(infix: string): [string, string] | null {
  const s = infix.trim();
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === '=' && depth === 0) {
      const left = s.slice(0, i).trim();
      const right = s.slice(i + 1).trim();
      if (!left || !right) return null;
      return [left, right];
    }
  }
  return null;
}

function hasTopLevelBinaryPlusMinus(s: string): boolean {
  let d = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') d++;
    else if (c === ')') d--;
    if (d !== 0) continue;
    if (c === '+') return true;
    if (c === '-') {
      if (i === 0) continue;
      const prev = s[i - 1];
      if ('(*/+-^'.includes(prev)) continue;
      return true;
    }
  }
  return false;
}

function hasTopLevelMulDiv(s: string): boolean {
  let d = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') d++;
    else if (c === ')') d--;
    else if (d === 0 && (c === '*' || c === '/')) return true;
  }
  return false;
}

function isSimpleNumerator(s: string): boolean {
  return (
    /^\d+$/.test(s) ||
    /^-\d+$/.test(s) ||
    /^[xX](\^\d+)?$/.test(s) ||
    /^-[xX](\^\d+)?$/.test(s)
  );
}

function isSimpleDenominator(s: string): boolean {
  return /^\d+$/.test(s) || /^[xX](\^\d+)?$/.test(s);
}

function unwrapStorageFractions(s: string): string {
  let out = s;
  for (let guard = 0; guard < 256; guard++) {
    const doubleOpen = out.indexOf('((');
    if (doubleOpen === -1) break;
    const slashParen = out.indexOf(')/(', doubleOpen);
    if (slashParen === -1) break;
    const numInner = out.slice(doubleOpen + 2, slashParen).trim();
    const denOpenIndex = slashParen + 2;
    if (out[denOpenIndex] !== '(') break;
    const denInner = takeBalancedParen(out, denOpenIndex);
    if (denInner === null) break;
    const endIdx = denOpenIndex + 1 + denInner.length + 1 + 1;
    if (endIdx > out.length) break;

    const numFmt =
      isSimpleNumerator(numInner) || !hasTopLevelBinaryPlusMinus(numInner)
        ? numInner
        : `(${numInner})`;
    const denFmt =
      isSimpleDenominator(denInner) ||
      (!hasTopLevelBinaryPlusMinus(denInner) && !hasTopLevelMulDiv(denInner))
        ? denInner
        : `(${denInner})`;

    out = out.slice(0, doubleOpen) + `${numFmt}/${denFmt}` + out.slice(endIdx);
  }
  return out;
}

export function infixToUserFacingForInput(infix: string): string {
  let out = infix.replace(/\s/g, '');
  for (let guard = 0; guard < 256; guard++) {
    type Hit = { start: number; endExclusive: number; replacement: string };
    const hits: Hit[] = [];
    const re = /\bpot([23])\s*\(/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(out)) !== null) {
      const openParen = m.index + m[0].length - 1;
      const inner = takeBalancedParen(out, openParen);
      if (inner === null) continue;
      if (/\bpot[23]\s*\(/i.test(inner)) continue;
      const power = m[1] === '3' ? '3' : '2';
      const replacement = inner.trim() === 'x' ? `x^${power}` : `(${inner})^${power}`;
      const endExclusive = openParen + 1 + inner.length + 1;
      hits.push({ start: m.index, endExclusive, replacement });
    }
    if (hits.length === 0) break;
    hits.sort((a, b) => a.start - b.start);
    const pick = hits[0];
    out = out.slice(0, pick.start) + pick.replacement + out.slice(pick.endExclusive);
  }
  return formatDecimalCommaForDisplay(unwrapStorageFractions(out));
}
