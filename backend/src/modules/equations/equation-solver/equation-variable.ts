import { VARIABLE } from './constants.js';

export const ALLOWED_FUNCTIONS = new Set(['sqrt', 'cbrt', 'pot2', 'pot3', 'abs']);

export function extractEquationVariable(infix: string): string | null {
  const variables = new Set<string>();
  let i = 0;
  const s = infix.trim();

  while (i < s.length) {
    if (!/[a-zA-Z]/.test(s[i]!)) {
      i++;
      continue;
    }
    let id = '';
    while (i < s.length && /[a-zA-Z0-9]/.test(s[i]!)) {
      id += s[i]!;
      i++;
    }
    if (id.length === 1 && !ALLOWED_FUNCTIONS.has(id.toLowerCase())) {
      variables.add(id.toLowerCase());
    }
  }

  return variables.size === 1 ? [...variables][0]! : null;
}

export function sideContainsVariable(side: string): boolean {
  return collectVariableLetters(side).length > 0;
}

export function collectVariableLetters(infix: string): string[] {
  const variables: string[] = [];
  const seen = new Set<string>();
  let i = 0;
  const s = infix.trim();

  while (i < s.length) {
    if (!/[a-zA-Z]/.test(s[i]!)) {
      i++;
      continue;
    }
    let id = '';
    while (i < s.length && /[a-zA-Z0-9]/.test(s[i]!)) {
      id += s[i]!;
      i++;
    }
    if (id.length === 1 && !ALLOWED_FUNCTIONS.has(id.toLowerCase())) {
      const key = id.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        variables.push(key);
      }
    }
  }

  return variables;
}

export function canonicalizeEquationVariable(infix: string, knownVariable?: string | null): string {
  const variable = (knownVariable ?? extractEquationVariable(infix))?.toLowerCase();
  if (!variable || variable === VARIABLE) return infix;

  let out = '';
  let i = 0;
  while (i < infix.length) {
    if (infix[i]!.toLowerCase() === variable) {
      const prev = i > 0 ? infix[i - 1]! : '';
      const next = i + 1 < infix.length ? infix[i + 1]! : '';
      if (!/[a-zA-Z0-9]/.test(prev) && !/[a-zA-Z0-9]/.test(next)) {
        out += VARIABLE;
        i++;
        continue;
      }
    }
    out += infix[i];
    i++;
  }
  return out;
}

export function stepUsesOnlyEquationVariable(
  stepInfix: string,
  equationVariable: string | null
): boolean {
  if (!equationVariable) return true;
  return collectVariableLetters(stepInfix).every((letter) => letter === equationVariable);
}
