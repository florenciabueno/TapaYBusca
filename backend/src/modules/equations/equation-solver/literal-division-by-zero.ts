import type { TreeNode } from './types.js';
import { EQUALS, DIVIDE } from './constants.js';
import { containsVariable } from './tree-utils.js';
import { evaluateTree } from './evaluate-tree.js';

function isConstantZeroExpression(node: TreeNode | null | undefined): boolean {
  if (!node) return false;
  if (containsVariable(node)) return false;
  const vals = evaluateTree(node, true);
  if (vals.length !== 1) return false;
  return Math.abs(vals[0]!) < 1e-12;
}

export function hasLiteralDivisionByZero(tree: TreeNode | null | undefined): boolean {
  if (!tree) return false;
  if (tree.type === 'OPERATOR_BINARY' && tree.value === DIVIDE && tree.right) {
    if (isConstantZeroExpression(tree.right)) return true;
  }
  return hasLiteralDivisionByZero(tree.left) || hasLiteralDivisionByZero(tree.right);
}

export function equationTreeHasLiteralDivisionByZero(root: TreeNode | null | undefined): boolean {
  if (!root || root.type !== 'OPERATOR_BINARY' || root.value !== EQUALS) return false;
  return hasLiteralDivisionByZero(root.left) || hasLiteralDivisionByZero(root.right);
}
