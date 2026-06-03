import {
  SUBTRACT,
  NEGATE,
  LEFT_PAREN,
  EQUALS,
  ADD,
  MULTIPLY,
  DIVIDE,
} from './constants.js';
import { TOKENIZE_ORDER } from './constants.js';
import { normalizeUserInfix, stripUnaryPlus, convertPipeAbsToAbsCall } from './user-infix-normalize.js';

const UNARY_MINUS_AFTER = new Set([EQUALS, LEFT_PAREN, ADD, SUBTRACT, MULTIPLY, DIVIDE]);

const NUMERIC_LITERAL_POWER = /(\d+(?:\.\d+)?)\^(\d+)/;

function expandNumericLiteralPowers(s: string): string {
  let out = s;
  for (let guard = 0; guard < 64; guard++) {
    const m = out.match(NUMERIC_LITERAL_POWER);
    if (!m) break;
    const base = Number(m[1]);
    const exp = Number(m[2]);
    if (!Number.isFinite(base) || !Number.isFinite(exp) || exp < 0 || exp > 512) break;
    const val = Math.pow(base, exp);
    if (!Number.isFinite(val)) break;
    out = out.replace(NUMERIC_LITERAL_POWER, String(val));
  }
  return out;
}

/**
 * Matches a unary minus followed by `(...)` where the parenthesised content is
 * a product chain. We treat `-(a*b)` as equivalent to `-a*b`.
 * The leading group ensures `-` is unary (start of string or after an operator).
 */
const UNARY_NEG_MUL_CHAIN_PARENS = /(^|[(+\-*/=^])-\(([\d.x]+(?:\*[\d.x]+)+)\)/g;

function unwrapUnaryNegMulChainParens(s: string): string {
  let out = s;
  for (let guard = 0; guard < 16; guard++) {
    const next = out.replace(UNARY_NEG_MUL_CHAIN_PARENS, '$1-$2');
    if (next === out) break;
    out = next;
  }
  return out;
}

function normalizeParenPowers(s: string): string {
  let out = s;
  for (const [suffix, fn] of [
    [')^3', 'pot3'],
    [')^2', 'pot2'],
  ] as const) {
    for (;;) {
      const closeIdx = out.indexOf(suffix);
      if (closeIdx === -1) break;
      const openIdx = findMatchingOpenParen(out, closeIdx);
      if (openIdx === -1) break;
      const inner = out.slice(openIdx + 1, closeIdx);
      out = out.slice(0, openIdx) + `${fn}(` + inner + ')' + out.slice(closeIdx + suffix.length);
    }
  }
  return out;
}

function findMatchingOpenParen(s: string, closeIdx: number): number {
  let depth = 1;
  for (let i = closeIdx - 1; i >= 0; i--) {
    const c = s[i];
    if (c === ')') depth++;
    else if (c === '(') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function normalizeInfix(equation: string): string {
  let s = normalizeUserInfix(equation);
  s = convertPipeAbsToAbsCall(s);
  s = stripUnaryPlus(s);
  s = expandNumericLiteralPowers(s);
  s = s.replace(/x\^3/g, 'pot3(x)');
  s = s.replace(/x\^2/g, 'pot2(x)');
  s = normalizeParenPowers(s);
  s = unwrapUnaryNegMulChainParens(s);
  return s;
}

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

function unaryMinusToNeg(tokens: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = i > 0 ? tokens[i - 1] : undefined;
    if (t === SUBTRACT && (prev === undefined || UNARY_MINUS_AFTER.has(prev))) {
      result.push(NEGATE);
    } else {
      result.push(t);
    }
  }
  return result;
}

export function tokenizeInfix(equation: string): string[] {
  const normalized = normalizeInfix(equation);
  let arr: string[] = [normalized];

  for (const delim of TOKENIZE_ORDER) {
    arr = splitAndAdd(arr, delim);
  }

  const filtered = arr.filter((t) => t !== '');
  return unaryMinusToNeg(filtered);
}
