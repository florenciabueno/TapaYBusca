/**
 * Isolates the variable: from a tree with '=' at root, returns tree B (numeric side) so that x = B.
 */

import type { TreeNode } from './types.js';
import { VARIABLE, DIVIDE, SUBTRACT, NEGATE } from './constants.js';
import { containsVariable, getOppositeOperator } from './tree-utils.js';

function makeBinary(op: string, left: TreeNode, right: TreeNode): TreeNode {
  return { type: 'OPERATOR_BINARY', value: op, left, right };
}

function makeUnary(op: string, right: TreeNode): TreeNode {
  return { type: 'OPERATOR_UNARY', value: op, left: null, right };
}

export function isolateVariable(equationTree: TreeNode): TreeNode | null {
  if (equationTree.value !== '=' || !equationTree.left || !equationTree.right) {
    return null;
  }
  let treeWithVariable: TreeNode;
  let treeWithoutVariable: TreeNode;
  let variableOnRight = containsVariable(equationTree.right);
  if (variableOnRight) {
    treeWithVariable = equationTree.right;
    treeWithoutVariable = equationTree.left;
  } else {
    treeWithVariable = equationTree.left;
    treeWithoutVariable = equationTree.right;
  }

  while (treeWithVariable.type !== 'VARIABLE' || treeWithVariable.value !== VARIABLE) {
    if (treeWithVariable.type === 'OPERATOR_BINARY' && treeWithVariable.left && treeWithVariable.right) {
      variableOnRight = containsVariable(treeWithVariable.right);
      let branchWithoutVariable: TreeNode;
      let branchWithVariable: TreeNode;
      if (variableOnRight) {
        branchWithoutVariable = treeWithVariable.left;
        branchWithVariable = treeWithVariable.right;
      } else {
        branchWithoutVariable = treeWithVariable.right;
        branchWithVariable = treeWithVariable.left;
      }
      const oppositeOp = getOppositeOperator(treeWithVariable.value);
      if (oppositeOp === null) return null;

      let newTreeWithoutVariable: TreeNode;
      if (treeWithVariable.value === DIVIDE && variableOnRight) {
        newTreeWithoutVariable = makeBinary(DIVIDE, branchWithoutVariable, treeWithoutVariable);
      } else if (treeWithVariable.value === SUBTRACT && variableOnRight) {
        newTreeWithoutVariable = makeBinary(SUBTRACT, treeWithoutVariable, branchWithoutVariable);
        branchWithVariable = makeUnary(NEGATE, branchWithVariable);
      } else {
        newTreeWithoutVariable = makeBinary(oppositeOp, treeWithoutVariable, branchWithoutVariable);
      }
      treeWithoutVariable = newTreeWithoutVariable;
      treeWithVariable = branchWithVariable;
    } else if (treeWithVariable.type === 'OPERATOR_UNARY' && treeWithVariable.right) {
      const oppositeOp = getOppositeOperator(treeWithVariable.value);
      if (oppositeOp === null) return null;
      const newTreeWithoutVariable = makeUnary(oppositeOp, treeWithoutVariable);
      treeWithoutVariable = newTreeWithoutVariable;
      treeWithVariable = treeWithVariable.right;
    } else {
      return null;
    }
  }

  return treeWithoutVariable;
}
