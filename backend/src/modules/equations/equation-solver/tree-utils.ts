import type { TreeNode } from './types.js';
import {
  VARIABLE,
  ADD,
  SUBTRACT,
  DIVIDE,
  MULTIPLY,
  NEGATE,
  SQUARE_POWER,
  CUBE_POWER,
  POWER_HALF,
  POWER_THIRD,
  SQUARE_ROOT,
  CUBE_ROOT,
} from './constants.js';

export function containsVariable(tree: TreeNode | null | undefined): boolean {
  if (!tree) return false;
  if (tree.type === 'VARIABLE' && tree.value === VARIABLE) return true;
  return containsVariable(tree.left) || containsVariable(tree.right);
}

export function getOppositeOperator(operator: string): string | null {
  switch (operator) {
    case ADD:
      return SUBTRACT;
    case SUBTRACT:
      return ADD;
    case DIVIDE:
      return MULTIPLY;
    case MULTIPLY:
      return DIVIDE;
    case NEGATE:
      return NEGATE;
    case SQUARE_POWER:
      return SQUARE_ROOT;
    case CUBE_POWER:
      return CUBE_ROOT;
    case POWER_HALF:
      return SQUARE_POWER;
    case POWER_THIRD:
      return CUBE_POWER;
    case SQUARE_ROOT:
      return SQUARE_POWER;
    case CUBE_ROOT:
      return CUBE_POWER;
    default:
      return null;
  }
}
