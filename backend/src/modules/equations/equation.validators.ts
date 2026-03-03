/**
 * Validación de sintaxis para ecuaciones de la forma f(x) = k o k = f(x).
 * k: expresión con constantes y operadores aritméticos (sin x).
 * f: expresión algebraica hasta tercer grado, racional, con radicales; una sola variable y una sola ocurrencia de x.
 */

export interface EquationValidationResult {
  isValid: boolean;
  errors: string[];
}

/** Variable permitida (incógnita) */
export const EQUATION_VARIABLE = 'x';

/** Funciones permitidas en el lado f(x) (alineadas al seed: raiz2, raiz3, pot2, pot3, neg) */
export const ALLOWED_FUNCTIONS = new Set([
  'sqrt',
  'raiz2',
  'raiz3',
  'cbrt',
  'pot2',
  'pot3',
  'neg',
]);

/** Operadores permitidos en lado constante k */
const CONSTANT_OPS = new Set(['+', '-', '*', '/']);
/** Caracteres permitidos en lado constante (sin variable) */
const CONSTANT_ALLOWED_CHARS = /^[\d\s.+*\/()-]+$/;

/** Máximo grado permitido para la incógnita (lineal, cuadrático, cúbico) */
const MAX_DEGREE = 3;

type TokenType = 'NUMBER' | 'ID' | 'OP' | 'LPAREN' | 'RPAREN';
interface Token {
  type: TokenType;
  value: string;
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
  if (!trimmed) return 'Un lado de la ecuación está vacío.';
  if (trimmed.includes(EQUATION_VARIABLE)) return 'El lado constante (k) no debe contener la incógnita x.';
  if (!CONSTANT_ALLOWED_CHARS.test(trimmed)) {
    return 'El lado constante solo puede contener números y los operadores +, -, *, /.';
  }
  if (!balancedParentheses(trimmed)) return 'Paréntesis desbalanceados en el lado constante.';
  return null;
}

function validateExpressionSide(tokens: Token[]): string | null {
  let xCount = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'ID') {
      if (t.value === EQUATION_VARIABLE) {
        xCount++;
        if (xCount > 1) return 'La expresión en x solo puede contener una vez la incógnita.';
        continue;
      }
      if (!ALLOWED_FUNCTIONS.has(t.value.toLowerCase())) {
        return `Función no permitida: "${t.value}". Permitidas: sqrt, raiz2, raiz3, cbrt, pot2, pot3, neg.`;
      }
    }
    if (t.type === 'OP' && t.value === '^' && i >= 2) {
      const prev = tokens[i - 1];
      const next = tokens[i + 1];
      if (prev.value === EQUATION_VARIABLE && next?.type === 'NUMBER') {
        const exp = parseInt(next.value, 10);
        if (Number.isNaN(exp) || exp < 0 || exp > MAX_DEGREE) {
          return `Solo se permiten expresiones hasta grado ${MAX_DEGREE} (x, x^2, x^3).`;
        }
      }
    }
  }
  if (xCount === 0) return 'Uno de los lados debe ser una expresión que contenga la incógnita x.';
  return null;
}

/**
 * Valida la sintaxis de una ecuación f(x)=k o k=f(x).
 * Devuelve resultado con isValid y lista de mensajes de error en español.
 */
export function validateEquation(equation: string): EquationValidationResult {
  const errors: string[] = [];
  const trimmed = (equation ?? '').trim();

  if (!trimmed) {
    return { isValid: false, errors: ['La ecuación no puede estar vacía.'] };
  }

  const eqCount = (trimmed.match(/=/g) || []).length;
  if (eqCount === 0) {
    return { isValid: false, errors: ['La ecuación debe contener exactamente un signo =.'] };
  }
  if (eqCount > 1) {
    return { isValid: false, errors: ['La ecuación debe tener exactamente un signo = (no varios).'] };
  }

  const [left, right] = trimmed.split('=').map((s) => s.trim());
  if (!left || !right) {
    return { isValid: false, errors: ['Cada lado del signo = debe tener una expresión.'] };
  }

  const leftHasX = left.includes(EQUATION_VARIABLE);
  const rightHasX = right.includes(EQUATION_VARIABLE);

  if (leftHasX && rightHasX) {
    return { isValid: false, errors: ['Solo un lado de la ecuación puede contener la incógnita x.'] };
  }
  if (!leftHasX && !rightHasX) {
    return { isValid: false, errors: ['Uno de los lados debe contener la incógnita x.'] };
  }

  const constantSide = leftHasX ? right : left;
  const expressionSide = leftHasX ? left : right;

  const constantError = validateConstantSide(constantSide);
  if (constantError) errors.push(constantError);

  const { tokens, error: tokenError } = tokenize(expressionSide);
  if (tokenError) {
    errors.push(tokenError);
    return { isValid: false, errors };
  }
  const exprError = validateExpressionSide(tokens);
  if (exprError) errors.push(exprError);

  return {
    isValid: errors.length === 0,
    errors,
  };
}
