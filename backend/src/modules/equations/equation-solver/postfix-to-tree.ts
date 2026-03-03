/**
 * Converts postfix token list to a binary expression tree. Returns null if invalid (stack underflow or not exactly one result).
 */

import type { TreeNode } from './types.js';
import {
  VARIABLE,
  DIVIDE,
  SQUARE_POWER,
  CUBE_POWER,
  POWER_MINUS_ONE,
  POWER_MINUS_TWO,
  POWER_MINUS_THREE,
  POWER_HALF,
  POWER_THIRD,
  SQUARE_ROOT,
  CUBE_ROOT,
  BINARY_OPERATORS,
  UNARY_OPERATORS,
} from './constants.js';

function isNumber(token: string): boolean {
  if (token === '' || token === '-') return false;
  const n = Number(token);
  return !Number.isNaN(n) && Number.isFinite(n);
}

function makeLeaf(value: string, type: 'NUMBER' | 'VARIABLE'): TreeNode {
  return { type, value, left: null, right: null };
}

function makeBinary(op: string, left: TreeNode, right: TreeNode): TreeNode {
  return { type: 'OPERATOR_BINARY', value: op, left, right };
}

function makeUnary(op: string, right: TreeNode): TreeNode {
  return { type: 'OPERATOR_UNARY', value: op, left: null, right };
}

export function postfixToTree(postfixTokens: string[]): TreeNode | null {
  const stack: TreeNode[] = [];

  for (const token of postfixTokens) {
    if (isNumber(token)) {
      stack.push(makeLeaf(token, 'NUMBER'));
      continue;
    }
    if (token === VARIABLE) {
      stack.push(makeLeaf(token, 'VARIABLE'));
      continue;
    }
    if (BINARY_OPERATORS.has(token)) {
      if (stack.length < 2) return null;
      const right = stack.pop()!;
      const left = stack.pop()!;
      stack.push(makeBinary(token, left, right));
      continue;
    }
    if (UNARY_OPERATORS.has(token)) {
      if (stack.length < 1) return null;
      const right = stack.pop()!;

      if (token === POWER_MINUS_ONE) {
        const one = makeLeaf('1', 'NUMBER');
        stack.push(makeBinary(DIVIDE, one, right));
        continue;
      }
      if (token === POWER_MINUS_TWO) {
        const one = makeLeaf('1', 'NUMBER');
        const squared = makeUnary(SQUARE_POWER, right);
        stack.push(makeBinary(DIVIDE, one, squared));
        continue;
      }
      if (token === POWER_MINUS_THREE) {
        const one = makeLeaf('1', 'NUMBER');
        const cubed = makeUnary(CUBE_POWER, right);
        stack.push(makeBinary(DIVIDE, one, cubed));
        continue;
      }
      if (token === POWER_HALF) {
        stack.push(makeUnary(SQUARE_ROOT, right));
        continue;
      }
      if (token === POWER_THIRD) {
        stack.push(makeUnary(CUBE_ROOT, right));
        continue;
      }
      stack.push(makeUnary(token, right));
      continue;
    }
    return null;
  }

  if (stack.length !== 1) return null;
  return stack[0]!;
}
