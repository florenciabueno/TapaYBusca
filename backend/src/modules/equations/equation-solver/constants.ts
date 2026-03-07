export const ADD = '+';
export const SUBTRACT = '-';
export const LEFT_PAREN = '(';
export const RIGHT_PAREN = ')';
export const DIVIDE = '/';
export const MULTIPLY = '*';
export const SQUARE_ROOT = 'raiz2';
export const CUBE_ROOT = 'raiz3';
export const SQUARE_POWER = 'pot2';
export const CUBE_POWER = 'pot3';
export const POWER_HALF = 'pot1_2';
export const POWER_THIRD = 'pot1_3';
export const POWER_MINUS_ONE = 'pot_1';
export const POWER_MINUS_TWO = 'pot_2';
export const POWER_MINUS_THREE = 'pot_3';
export const EQUALS = '=';
export const NEGATE = 'neg';

export const VARIABLE = 'x';

export const TOKENIZE_ORDER: string[] = [
  CUBE_ROOT,
  SQUARE_ROOT,
  CUBE_POWER,
  SQUARE_POWER,
  POWER_HALF,
  POWER_THIRD,
  POWER_MINUS_ONE,
  POWER_MINUS_TWO,
  POWER_MINUS_THREE,
  ADD,
  SUBTRACT,
  MULTIPLY,
  DIVIDE,
  LEFT_PAREN,
  RIGHT_PAREN,
  EQUALS,
  NEGATE,
];

export const PRECEDENCE: Record<string, number> = {
  [SQUARE_POWER]: 4,
  [CUBE_POWER]: 4,
  [POWER_MINUS_TWO]: 4,
  [POWER_MINUS_THREE]: 4,
  [POWER_MINUS_ONE]: 4,
  [POWER_HALF]: 4,
  [POWER_THIRD]: 4,
  [SQUARE_ROOT]: 4,
  [CUBE_ROOT]: 4,
  [NEGATE]: 4,
  [MULTIPLY]: 3,
  [DIVIDE]: 3,
  [ADD]: 2,
  [SUBTRACT]: 2,
  [EQUALS]: 1,
};

export const BINARY_OPERATORS = new Set([ADD, SUBTRACT, MULTIPLY, DIVIDE, EQUALS]);

export const UNARY_OPERATORS = new Set([
  SQUARE_ROOT,
  CUBE_ROOT,
  SQUARE_POWER,
  CUBE_POWER,
  POWER_HALF,
  POWER_THIRD,
  POWER_MINUS_ONE,
  POWER_MINUS_TWO,
  POWER_MINUS_THREE,
  NEGATE,
]);

export function isStackTopPrecedenceGte(currentToken: string, stackTop: string): boolean {
  const p1 = PRECEDENCE[currentToken];
  const p2 = PRECEDENCE[stackTop];
  if (p1 === undefined || p2 === undefined) return false;
  return p2 >= p1;
}
