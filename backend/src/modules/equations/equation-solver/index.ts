/**
 * Public API: solves the equation and determines if it has a solution before saving.
 */

import type { SolveResult } from './types.js';
import { ERROR_CODES, ERROR_MESSAGES } from './types.js';
import { tokenizeInfix } from './tokenizer.js';
import { infixToPostfix } from './infix-to-postfix.js';
import { postfixToTree } from './postfix-to-tree.js';
import { isolateVariable } from './isolate-variable.js';
import { evaluateTree } from './evaluate-tree.js';
import { checkSolutions } from './solution-check.js';

/** Solves the equation in infix notation. Returns ok + solutions if at least one verified solution; otherwise ok=false with errorCode and message. */
export function solveEquation(infixExpression: string): SolveResult {
  const trimmed = (infixExpression ?? '').trim();
  if (!trimmed) {
    return {
      ok: false,
      errorCode: ERROR_CODES.MALFORMED_EQUATION,
      message: ERROR_MESSAGES[ERROR_CODES.MALFORMED_EQUATION],
    };
  }

  const infixTokens = tokenizeInfix(trimmed);
  const postfix = infixToPostfix(infixTokens);
  if (!postfix) {
    return {
      ok: false,
      errorCode: ERROR_CODES.MISSING_PARENTHESES,
      message: ERROR_MESSAGES[ERROR_CODES.MISSING_PARENTHESES],
    };
  }

  const tree = postfixToTree(postfix);
  if (!tree) {
    return {
      ok: false,
      errorCode: ERROR_CODES.MALFORMED_EQUATION,
      message: ERROR_MESSAGES[ERROR_CODES.MALFORMED_EQUATION],
    };
  }

  const isolatedTree = isolateVariable(tree);
  if (!isolatedTree) {
    return {
      ok: false,
      errorCode: ERROR_CODES.MALFORMED_EQUATION,
      message: ERROR_MESSAGES[ERROR_CODES.MALFORMED_EQUATION],
    };
  }

  const rawResults = evaluateTree(isolatedTree, false);
  const result = checkSolutions(rawResults, trimmed);
  if (result.ok) {
    return { ok: true, solutions: result.solutions };
  }
  return {
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
  };
}

export { ERROR_CODES, ERROR_MESSAGES } from './types.js';
