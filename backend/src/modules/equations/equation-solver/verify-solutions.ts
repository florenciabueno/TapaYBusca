/**
 * Solution verification: get side with variable (postfix), get constant-side values,
 * evaluate with x=r, and filter to verified solutions.
 */

import { EQUALS } from './constants.js';
import { tokenizeInfix } from './tokenizer.js';
import { infixToPostfix } from './infix-to-postfix.js';
import { postfixToTree } from './postfix-to-tree.js';
import { containsVariable } from './tree-utils.js';
import { evaluateTree, listContainsElement } from './evaluate-tree.js';

function stringHasVariable(s: string): boolean {
  const infix = tokenizeInfix(s);
  const postfix = infixToPostfix(infix);
  if (!postfix) return false;
  const tree = postfixToTree(postfix);
  if (!tree) return false;
  return containsVariable(tree);
}

/** Returns the postfix token list of the equation side that contains the variable. */
export function getSideWithVariablePostfix(infixEquation: string): string[] {
  const parts = infixEquation.split(EQUALS);
  const side0 = parts[0]?.trim() ?? '';
  const side1 = parts[1]?.trim() ?? '';
  const sideWithVariable = stringHasVariable(side0) ? side0 : side1;
  const infix = tokenizeInfix(sideWithVariable);
  const postfix = infixToPostfix(infix);
  return postfix ?? [];
}

/** Returns the numeric values of the equation side without the variable. */
export function getConstantSideValues(infixEquation: string): number[] {
  const parts = infixEquation.split(EQUALS);
  const side0 = parts[0]?.trim() ?? '';
  const side1 = parts[1]?.trim() ?? '';
  const sideWithoutVariable = stringHasVariable(side0) ? side1 : side0;
  const infix = tokenizeInfix(sideWithoutVariable);
  const postfix = infixToPostfix(infix);
  if (!postfix) return [];
  const tree = postfixToTree(postfix);
  if (!tree) return [];
  return evaluateTree(tree);
}

/** Evaluates the expression (postfix list of the side with variable) with x = r. */
export function evaluateWithVariable(r: number, postfixSideWithVariable: string[]): number[] {
  const tree = postfixToTree(postfixSideWithVariable);
  if (!tree) return [];
  return evaluateTree(tree, false, r);
}

/**
 * Filters candidates: keep r if substituting x=r in the variable side yields at least one value
 * that matches the constant side (e.g. sqrt(9) gives [3, -3]; constant is 3, so 9 is valid).
 */
export function verifiedSolutions(candidates: number[], infixEquation: string): number[] {
  const verified: number[] = [];
  if (candidates.length === 0) return verified;
  const constantValues = getConstantSideValues(infixEquation);
  const postfixWithVariable = getSideWithVariablePostfix(infixEquation);
  for (const r of candidates) {
    const evaluationResults = evaluateWithVariable(r, postfixWithVariable);
    const matchesConstant = constantValues.some((cv) => listContainsElement(evaluationResults, cv));
    if (evaluationResults.length > 0 && matchesConstant) {
      verified.push(r);
    }
  }
  return verified;
}
