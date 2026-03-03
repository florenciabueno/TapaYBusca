/**
 * Converts infix token list to postfix (Shunting Yard). Returns null if parentheses are unbalanced.
 */

import { LEFT_PAREN, RIGHT_PAREN, VARIABLE, isStackTopPrecedenceGte } from './constants.js';

function isNumber(token: string): boolean {
  if (token === '' || token === '-') return false;
  const n = Number(token);
  return !Number.isNaN(n) && Number.isFinite(n);
}

function isVariable(token: string): boolean {
  return token === VARIABLE;
}

/** Converts infix to postfix. Returns null if a ')' has no matching '('. */
export function infixToPostfix(infixTokens: string[]): string[] | null {
  const output: string[] = [];
  const stack: string[] = [];

  for (const token of infixTokens) {
    if (isNumber(token) || isVariable(token)) {
      output.push(token);
      continue;
    }
    if (token === LEFT_PAREN) {
      stack.push(token);
      continue;
    }
    if (token === RIGHT_PAREN) {
      let foundLeft = false;
      while (stack.length > 0 && stack[stack.length - 1] !== LEFT_PAREN) {
        output.push(stack.pop()!);
      }
      if (stack.length > 0 && stack[stack.length - 1] === LEFT_PAREN) {
        stack.pop();
        foundLeft = true;
      }
      if (!foundLeft) return null;
      continue;
    }
    while (stack.length > 0 && stack[stack.length - 1] !== LEFT_PAREN && isStackTopPrecedenceGte(token, stack[stack.length - 1])) {
      output.push(stack.pop()!);
    }
    stack.push(token);
  }

  while (stack.length > 0) {
    const op = stack.pop()!;
    if (op === LEFT_PAREN) return null;
    output.push(op);
  }

  return output;
}
