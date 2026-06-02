import { tokenizeInfix } from './tokenizer.js';
import { normalizeUserInfix } from './user-infix-normalize.js';
import { infixToPostfix } from './infix-to-postfix.js';
import { postfixToTree } from './postfix-to-tree.js';
import { isolateVariable } from './isolate-variable.js';
import { evaluateTree, listContainsElement } from './evaluate-tree.js';
import { DEFAULT_FLOAT_TOLERANCE, VARIABLE } from './constants.js';
import { equationSidesShareNumericValue } from '../resolution.service.helpers.js';

export function infixContainsVariable(infix: string): boolean {
  const trimmed = (infix ?? '').trim();
  if (!trimmed) return false;
  try {
    return tokenizeInfix(trimmed).includes(VARIABLE);
  } catch {
    return false;
  }
}

export function pickExpressionAndAnswer(
  firstField: string,
  secondField: string
): { expressionInfix: string; answerContent: string } {
  const a = (firstField ?? '').trim();
  const b = (secondField ?? '').trim();
  const aVar = infixContainsVariable(a);
  const bVar = infixContainsVariable(b);
  if (aVar && !bVar) return { expressionInfix: a, answerContent: b };
  if (!aVar && bVar) return { expressionInfix: b, answerContent: a };
  return { expressionInfix: a, answerContent: b };
}

export function loggedSolutionDisplayInfix(leftInfix: string, rightInfix: string): string {
  const left = (leftInfix ?? '').trim();
  const right = (rightInfix ?? '').trim();
  const leftVar = infixContainsVariable(left);
  const rightVar = infixContainsVariable(right);
  if (leftVar && !rightVar) return right;
  if (!leftVar && rightVar) return left;
  return right;
}

export function validateSubEquation(
  equationPostfixTokens: string[],
  subEquationPostfix: string[]
): boolean {
  if (!subEquationPostfix || subEquationPostfix.length === 0) return false;
  const subStr = subEquationPostfix.join('');
  const eqStr = equationPostfixTokens.join('');
  if (!eqStr.includes(subStr)) return false;
  const tree = postfixToTree([...subEquationPostfix]);
  return tree !== null;
}

function primaryEvalValue(values: number[]): number | undefined {
  return values.find((v) => Number.isFinite(v));
}

function sidesScaledBySameFactor(
  originalLeft: number[],
  originalRight: number[],
  proposedLeft: number[],
  proposedRight: number[]
): boolean {
  const a0 = primaryEvalValue(originalLeft);
  const b0 = primaryEvalValue(originalRight);
  const a1 = primaryEvalValue(proposedLeft);
  const b1 = primaryEvalValue(proposedRight);
  if (a0 === undefined || b0 === undefined || a1 === undefined || b1 === undefined) {
    return false;
  }
  if (Math.abs(a0) <= DEFAULT_FLOAT_TOLERANCE && Math.abs(b0) <= DEFAULT_FLOAT_TOLERANCE) {
    return Math.abs(a1 - b1) <= DEFAULT_FLOAT_TOLERANCE;
  }
  if (Math.abs(a0) <= DEFAULT_FLOAT_TOLERANCE || Math.abs(b0) <= DEFAULT_FLOAT_TOLERANCE) {
    return false;
  }
  return Math.abs(a1 / a0 - b1 / b0) <= DEFAULT_FLOAT_TOLERANCE;
}

export function validateEquivalentEquationStep(
  leftInfix: string,
  rightInfix: string,
  equationPostfixTokens: string[],
  solutions: number[]
): boolean {
  const left = (leftInfix ?? '').trim();
  const right = (rightInfix ?? '').trim();
  if (!left || !right) return false;

  let leftPost: string[] | null;
  let rightPost: string[] | null;
  try {
    leftPost = infixToPostfix(tokenizeInfix(normalizeUserInfix(left)));
    rightPost = infixToPostfix(tokenizeInfix(normalizeUserInfix(right)));
  } catch {
    return false;
  }
  if (!leftPost || !rightPost) return false;
  if (!equationPostfixTokens.includes('=')) return false;

  const equationTree = postfixToTree(equationPostfixTokens);
  if (
    !equationTree ||
    equationTree.type !== 'OPERATOR_BINARY' ||
    equationTree.value !== '=' ||
    !equationTree.left ||
    !equationTree.right
  ) {
    return false;
  }

  const lhsTree = equationTree.left;
  const rhsTree = equationTree.right;
  const leftTree = postfixToTree(leftPost);
  const rightTree = postfixToTree(rightPost);
  if (!leftTree || !rightTree) return false;

  const probes = solutions.length > 0 ? solutions : [0, 1, 2, -1];
  for (const s of probes) {
    const l0 = evaluateTree(lhsTree, false, s);
    const r0 = evaluateTree(rhsTree, false, s);
    const l1 = evaluateTree(leftTree, false, s);
    const r1 = evaluateTree(rightTree, false, s);
    if (!equationSidesShareNumericValue(l0, r0)) return false;
    if (!equationSidesShareNumericValue(l1, r1)) return false;
    if (!sidesScaledBySameFactor(l0, r0, l1, r1)) return false;
  }
  return true;
}

function normalizeMathAliases(input: string): string {
  let out = input.replace(/−/g, '-');
  out = out.replace(/³√\s*\(/g, 'cbrt(');
  out = out.replace(/√\s*\(/g, 'sqrt(');
  out = out.replace(/\bneg\s*\(/gi, '-(');
  out = out.replace(/(^|[=(+\-*/])\s*-\s*(sqrt|cbrt|x)\b/gi, '$10-$2');
  return out;
}

export function parseAnswerValues(answer: string): number[] {
  const trimmed = (answer ?? '').trim();
  if (!trimmed) return [];
  const normalized = normalizeMathAliases(normalizeUserInfix(trimmed));
  try {
    const infixTokens = tokenizeInfix(normalized);
    const postfix = infixToPostfix(infixTokens);
    if (!postfix) return [];
    const tree = postfixToTree(postfix);
    if (!tree) return [];
    return evaluateTree(tree, true);
  } catch {
    return [];
  }
}

export function evaluatePostfixWithVariable(
  variableValue: number,
  postfixTokens: string[],
  disallowNegativeRoot: boolean
): number[] {
  const substituted = postfixTokens.map((t) => (t === VARIABLE ? String(variableValue) : t));
  const tree = postfixToTree(substituted);
  if (!tree) return [];
  return evaluateTree(tree, disallowNegativeRoot, variableValue);
}

export function getSubEquationResult(
  equationPostfixTokens: string[],
  subEquationPostfix: string[],
  replacement: string,
  disallowNegativeRoot: boolean
): number[] {
  const replaced = replaceSubListInPostfix(equationPostfixTokens, subEquationPostfix, replacement);
  if (!replaced) return [];
  const tree = postfixToTree(replaced);
  if (!tree) return [];
  const isolated = isolateVariable(tree);
  if (!isolated) return [];
  return evaluateTree(isolated, disallowNegativeRoot);
}

export function replaceSubListInPostfix(
  original: string[],
  subList: string[],
  replacement: string
): string[] | null {
  if (subList.length === 0) return [...original];
  const n = original.length;
  const m = subList.length;
  for (let i = 0; i <= n - m; i++) {
    let match = true;
    for (let j = 0; j < m; j++) {
      if (original[i + j] !== subList[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      return [...original.slice(0, i), replacement, ...original.slice(i + m)];
    }
  }
  return null;
}

export function matchAnswerAgainstKnownSolutions(
  subEquationPostfix: string[],
  solutions: number[],
  answerValue?: number
): { isCorrect: boolean; correctResult?: number } {
  if (answerValue === undefined) return { isCorrect: false };
  const subEquationTree = postfixToTree(subEquationPostfix);
  if (!subEquationTree) return { isCorrect: false };

  for (const solution of solutions) {
    const evaluation = evaluateTree(subEquationTree, false, solution);
    if (listContainsElement(evaluation, answerValue)) {
      return { isCorrect: true, correctResult: answerValue };
    }
  }
  return { isCorrect: false };
}

export function checkStepHasSolution(
  equationPostfixTokens: string[],
  subEquationPostfix: string[]
): { hasSolution: boolean } {
  const results = getSubEquationResult(
    equationPostfixTokens,
    subEquationPostfix,
    VARIABLE,
    false
  );
  return { hasSolution: results.length > 0 };
}

export function isVariableToken(token: string): boolean {
  return token.length === 1 && token === VARIABLE;
}

export function isOnlyVariable(tokens: string[]): boolean {
  return tokens.length === 1 && isVariableToken(tokens[0]!);
}

export function isQuadratic(
  equationPostfixTokens: string[],
  subEquationPostfix: string[]
): boolean {
  const replaced = replaceSubListInPostfix(equationPostfixTokens, subEquationPostfix, VARIABLE);
  if (!replaced) return false;
  const tree = postfixToTree(replaced);
  if (!tree) return false;
  return containsSquareOfVariable(tree);
}

function containsSquareOfVariable(node: { type: string; value: string; left?: unknown; right?: unknown }): boolean {
  if (node.value === 'pot2') return true;
  if (node.left && typeof node.left === 'object' && 'value' in node.left)
    if (containsSquareOfVariable(node.left as { type: string; value: string; left?: unknown; right?: unknown }))
      return true;
  if (node.right && typeof node.right === 'object' && 'value' in node.right)
    if (containsSquareOfVariable(node.right as { type: string; value: string; left?: unknown; right?: unknown }))
      return true;
  return false;
}

export function computeEffectiveResolutionSessionId(
  sessionCurrentResolutionId: number,
  storedCurrentResolutionId: number,
  maxExistingSessionId: number
): number {
  return Math.max(sessionCurrentResolutionId, storedCurrentResolutionId, maxExistingSessionId);
}

export { listContainsElement };
