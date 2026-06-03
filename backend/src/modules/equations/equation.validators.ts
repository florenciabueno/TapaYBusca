import type { EquationValidationResult } from './equation.types.js';
import { normalizeUserInfix, convertPipeAbsToAbsCall } from './equation-solver/user-infix-normalize.js';

export const EQUATION_VARIABLE = 'x';

export const ALLOWED_FUNCTIONS = new Set([
  'sqrt',
  'cbrt',
  'pot2',
  'pot3',
  'abs',
]);

const CONSTANT_ALLOWED_CHARS = /^[-\d\s.+*\/()|]+$/;
const MAX_DEGREE = 3;

const MESSAGE_EMPTY = 'La ecuación no puede estar vacía.';
const MESSAGE_NO_EQUALS = 'La ecuación debe contener exactamente un signo =.';
const MESSAGE_MULTIPLE_EQUALS = 'La ecuación debe tener exactamente un signo = (no varios).';
const MESSAGE_SIDES_EMPTY = 'Cada lado del signo = debe tener una expresión.';
const MESSAGE_BOTH_HAVE_X = 'Solo un lado de la ecuación puede contener la incógnita x.';
const MESSAGE_NEITHER_HAS_X = 'Uno de los lados debe contener la incógnita x.';
const MESSAGE_SIDE_EMPTY = 'Un lado de la ecuación está vacío.';
const MESSAGE_CONSTANT_HAS_X = 'El lado constante (k) no debe contener la incógnita x.';
const MESSAGE_CONSTANT_INVALID_CHARS =
  'El lado constante solo puede contener números y los operadores +, -, *, /.';
const MESSAGE_CONSTANT_PARENS = 'Paréntesis desbalanceados en el lado constante.';
const MESSAGE_EXPRESSION_MULTIPLE_X = 'La expresión en x solo puede contener una vez la incógnita.';
const MESSAGE_EXPRESSION_ALLOWED_FUNCTIONS =
  'Función no permitida: "{id}". Permitidas: sqrt, cbrt, pot2, pot3, abs.';
const MESSAGE_EXPRESSION_DEGREE = `Solo se permiten expresiones hasta grado ${MAX_DEGREE} (x, x^2, x^3).`;
const MESSAGE_EXPRESSION_MUST_HAVE_X =
  'Uno de los lados debe ser una expresión que contenga la incógnita x.';

type TokenType = 'NUMBER' | 'ID' | 'OP' | 'LPAREN' | 'RPAREN';
interface Token {
  type: TokenType;
  value: string;
}

function toEquationValidationResult(errors: string[]): EquationValidationResult {
  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateStructure(trimmed: string): string[] {
  if (!trimmed) return [MESSAGE_EMPTY];

  const eqCount = (trimmed.match(/=/g) || []).length;
  if (eqCount === 0) return [MESSAGE_NO_EQUALS];
  if (eqCount > 1) return [MESSAGE_MULTIPLE_EQUALS];

  const [left, right] = trimmed.split('=').map((s) => s.trim());
  if (!left || !right) return [MESSAGE_SIDES_EMPTY];

  const leftHasX = left.includes(EQUATION_VARIABLE);
  const rightHasX = right.includes(EQUATION_VARIABLE);
  if (leftHasX && rightHasX) return [MESSAGE_BOTH_HAVE_X];
  if (!leftHasX && !rightHasX) return [MESSAGE_NEITHER_HAS_X];

  return [];
}

function tokenize(expr: string): { tokens: Token[]; error?: string } {
  const tokens: Token[] = [];
  let i = 0;
  const s = expr.trim();

  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (c === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }
    if (/[+\-*/^]/.test(c)) {
      tokens.push({ type: 'OP', value: c });
      i++;
      continue;
    }
    if (/\d/.test(c) || (c === '.' && i + 1 < s.length && /\d/.test(s[i + 1]))) {
      let num = '';
      while (i < s.length && (/[\d.]/.test(s[i]) || (s[i] === '.' && !num.includes('.')))) {
        num += s[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: num });
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let id = '';
      while (i < s.length && /[a-zA-Z0-9]/.test(s[i])) {
        id += s[i];
        i++;
      }
      tokens.push({ type: 'ID', value: id });
      continue;
    }
    return {
      tokens: [],
      error: `Carácter no permitido: "${c}"`,
    };
  }
  return { tokens };
}

function balancedParentheses(s: string): boolean {
  let depth = 0;
  for (const c of s) {
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

function validateConstantSide(side: string): string | null {
  const trimmed = side.trim();
  if (!trimmed) return MESSAGE_SIDE_EMPTY;
  if (trimmed.includes(EQUATION_VARIABLE)) return MESSAGE_CONSTANT_HAS_X;
  if (!CONSTANT_ALLOWED_CHARS.test(trimmed)) return MESSAGE_CONSTANT_INVALID_CHARS;
  if (!balancedParentheses(trimmed)) return MESSAGE_CONSTANT_PARENS;
  return null;
}

function validateExpressionSide(tokens: Token[]): string | null {
  let xCount = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'ID') {
      if (t.value === EQUATION_VARIABLE) {
        xCount++;
        if (xCount > 1) return MESSAGE_EXPRESSION_MULTIPLE_X;
        continue;
      }
      if (!ALLOWED_FUNCTIONS.has(t.value.toLowerCase())) {
        return MESSAGE_EXPRESSION_ALLOWED_FUNCTIONS.replace('{id}', t.value);
      }
    }
    if (t.type === 'OP' && t.value === '^' && i >= 2) {
      const prev = tokens[i - 1];
      const next = tokens[i + 1];
      if (prev.value === EQUATION_VARIABLE && next?.type === 'NUMBER') {
        const exp = parseInt(next.value, 10);
        if (Number.isNaN(exp) || exp < 0 || exp > MAX_DEGREE) return MESSAGE_EXPRESSION_DEGREE;
      }
    }
  }
  if (xCount === 0) return MESSAGE_EXPRESSION_MUST_HAVE_X;
  return null;
}

export function validateEquation(equation: string): EquationValidationResult {
  const trimmed = convertPipeAbsToAbsCall(normalizeUserInfix(equation ?? ''));
  const errors = [...validateStructure(trimmed)];
  if (errors.length > 0) return toEquationValidationResult(errors);

  const [left, right] = trimmed.split('=').map((s) => s.trim());
  const leftHasX = left.includes(EQUATION_VARIABLE);
  const constantSide = leftHasX ? right : left;
  const expressionSide = leftHasX ? left : right;

  const constantError = validateConstantSide(constantSide);
  if (constantError) errors.push(constantError);

  const { tokens, error: tokenError } = tokenize(expressionSide);
  if (tokenError) {
    errors.push(tokenError);
    return toEquationValidationResult(errors);
  }

  const exprError = validateExpressionSide(tokens);
  if (exprError) errors.push(exprError);

  return toEquationValidationResult(errors);
}
