import type { TreeNode } from './types.js';
import {
  ADD,
  SUBTRACT,
  MULTIPLY,
  DIVIDE,
  SQUARE_POWER,
  CUBE_POWER,
  SQUARE_ROOT,
  CUBE_ROOT,
  ABS,
  NEGATE,
  DEFAULT_FLOAT_TOLERANCE,
} from './constants.js';

export function listContainsElement(
  list: number[],
  value: number,
  tolerance: number = DEFAULT_FLOAT_TOLERANCE
): boolean {
  return list.some((v) => Math.abs(v - value) <= tolerance);
}

export function listContainsList(
  list: number[],
  listToVerify: number[],
  tolerance: number = DEFAULT_FLOAT_TOLERANCE
): boolean {
  return listToVerify.every((elem) => listContainsElement(list, elem, tolerance));
}

export function evaluateTree(
  tree: TreeNode | null | undefined,
  skipNegativeRoot: boolean = false,
  variableValue?: number
): number[] {
  if (!tree) return [];

  if (tree.type === 'NUMBER') {
    const n = Number(tree.value);
    if (Number.isNaN(n) || !Number.isFinite(n)) return [];
    return [n];
  }
  if (tree.type === 'VARIABLE') {
    if (variableValue !== undefined) return [variableValue];
    return [];
  }

  const leftResults = evaluateTree(tree.left, skipNegativeRoot, variableValue);
  const rightResults = evaluateTree(tree.right, skipNegativeRoot, variableValue);

  if (tree.type === 'OPERATOR_BINARY' && tree.left && tree.right) {
    const out: number[] = [];
    for (const leftVal of leftResults) {
      for (const rightVal of rightResults) {
        switch (tree.value) {
          case ADD:
            out.push(leftVal + rightVal);
            break;
          case SUBTRACT:
            out.push(leftVal - rightVal);
            break;
          case MULTIPLY:
            out.push(leftVal * rightVal);
            break;
          case DIVIDE:
            if (rightVal === 0) continue;
            out.push(leftVal / rightVal);
            break;
          default:
            break;
        }
      }
    }
    return out;
  }

  if (tree.type === 'OPERATOR_UNARY' && tree.right) {
    const out: number[] = [];
    for (const rightVal of rightResults) {
      switch (tree.value) {
        case SQUARE_POWER:
          out.push(Math.pow(rightVal, 2));
          break;
        case CUBE_POWER:
          out.push(Math.pow(rightVal, 3));
          break;
        case SQUARE_ROOT: {
          const r = Math.sqrt(rightVal);
          if (Number.isNaN(r)) continue;
          out.push(r);
          if (!skipNegativeRoot) out.push(-r);
          break;
        }
        case CUBE_ROOT: {
          const r = Math.cbrt(rightVal);
          if (!Number.isNaN(r) && Number.isFinite(r)) out.push(r);
          break;
        }
        case ABS:
          out.push(Math.abs(rightVal));
          break;
        case NEGATE:
          out.push(-rightVal);
          break;
        default:
          break;
      }
    }
    return out;
  }

  return [];
}
