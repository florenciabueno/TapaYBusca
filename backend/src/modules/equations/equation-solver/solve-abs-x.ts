import type { TreeNode } from './types.js';
import { ABS, EQUALS, VARIABLE } from './constants.js';
import { evaluateTree } from './evaluate-tree.js';

export function trySolveAbsXEqualsConstant(tree: TreeNode): number[] | null {
  if (tree.type !== 'OPERATOR_BINARY' || tree.value !== EQUALS || !tree.left || !tree.right) {
    return null;
  }

  for (const absSide of [tree.left, tree.right]) {
    const constSide = absSide === tree.left ? tree.right : tree.left;
    if (
      absSide.type !== 'OPERATOR_UNARY' ||
      absSide.value !== ABS ||
      absSide.right?.type !== 'VARIABLE' ||
      absSide.right.value !== VARIABLE
    ) {
      continue;
    }
    const constVals = evaluateTree(constSide, true);
    if (constVals.length !== 1) return null;
    const k = constVals[0];
    if (k === undefined) return null;
    if (k < 0) return [];
    return [k, -k];
  }

  return null;
}
