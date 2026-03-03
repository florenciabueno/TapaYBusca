/**
 * Converts infix equation string into a list of tokens.
 * Split order: raiz3, raiz2, powers, +, -, *, /, (, ), =, neg.
 */

import { TOKENIZE_ORDER } from './constants.js';

/** Normalizes validator-accepted aliases to solver token names. Handles sqrt, cbrt, and x^n. */
export function normalizeInfix(equation: string): string {
  let s = equation.replace(/\s/g, '');
  s = s.replace(/\bsqrt\b/gi, 'raiz2');
  s = s.replace(/\bcbrt\b/gi, 'raiz3');
  // x^2 and x^3 are not in TOKENIZE_ORDER; convert to pot2(x) / pot3(x) so the solver can parse them
  s = s.replace(/x\^3/g, 'pot3(x)');
  s = s.replace(/x\^2/g, 'pot2(x)');
  return s;
}

/**
 * Splits segments by delimiter and interleaves the delimiter. E.g. splitAndAdd(["a+b+c"], "+") -> ["a", "+", "b", "+", "c"]
 */
function splitAndAdd(parts: string[], delimiter: string): string[] {
  const result: string[] = [];
  for (const part of parts) {
    if (typeof part !== 'string') {
      result.push(part);
      continue;
    }
    if (!part.includes(delimiter)) {
      result.push(part);
      continue;
    }
    const segments = part.split(delimiter);
    for (let i = 0; i < segments.length; i++) {
      if (segments[i] !== '') result.push(segments[i]);
      if (i < segments.length - 1) result.push(delimiter);
    }
  }
  return result;
}

/** Returns the infix token list (numbers, variable x, operators, parentheses). */
export function tokenizeInfix(equation: string): string[] {
  const normalized = normalizeInfix(equation);
  let arr: string[] = [normalized];

  for (const delim of TOKENIZE_ORDER) {
    arr = splitAndAdd(arr, delim);
  }

  return arr.filter((t) => t !== '');
}
