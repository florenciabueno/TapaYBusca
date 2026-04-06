import { tokenizeInfix } from './tokenizer.js';
import { infixToPostfix } from './infix-to-postfix.js';
import { postfixToTree } from './postfix-to-tree.js';
import { isolateVariable } from './isolate-variable.js';
import { evaluateTree, listContainsElement } from './evaluate-tree.js';
import { VARIABLE } from './constants.js';

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

function normalizeDecimalSeparator(s: string): string {
  return s.replace(/,/g, '.');
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
  const normalized = normalizeMathAliases(normalizeDecimalSeparator(trimmed));
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

export const validateSubEcuacion = validateSubEquation;
export const hallarValorDeRespuesta = parseAnswerValues;
export const evaluar = evaluatePostfixWithVariable;
export const obtenerResultadoSubEcuacion = getSubEquationResult;
export const verificarSiPasoTieneSolucion = checkStepHasSolution;
export const isSoloVariable = isOnlyVariable;
export const esCuadratica = isQuadratic;

export { listContainsElement };
