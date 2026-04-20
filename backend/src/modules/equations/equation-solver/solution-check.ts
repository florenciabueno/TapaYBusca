import type { TreeNode } from './types.js';
import { ERROR_CODES, ERROR_MESSAGES } from './types.js';
import { verifiedSolutions } from './verify-solutions.js';
import { equationTreeHasLiteralDivisionByZero } from './literal-division-by-zero.js';

export function hasInfinityInResults(solutions: number[]): boolean {
  return solutions.some((v) => v === Infinity || v === -Infinity);
}

export function finiteSolutionCandidates(rawResults: number[]): number[] {
  return rawResults.filter((v) => Number.isFinite(v) && !Number.isNaN(v));
}

export function checkSolutions(
  rawResults: number[],
  infixEquation: string,
  equationRoot?: TreeNode | null
): { ok: boolean; solutions: number[]; errorCode?: string; message?: string } {
  if (equationRoot && equationTreeHasLiteralDivisionByZero(equationRoot)) {
    return {
      ok: false,
      solutions: [],
      errorCode: ERROR_CODES.INFINITE_RESULT,
      message: ERROR_MESSAGES[ERROR_CODES.INFINITE_RESULT],
    };
  }
  if (hasInfinityInResults(rawResults)) {
    return {
      ok: false,
      solutions: [],
      errorCode: ERROR_CODES.INFINITE_RESULT,
      message: ERROR_MESSAGES[ERROR_CODES.INFINITE_RESULT],
    };
  }
  const candidates = finiteSolutionCandidates(rawResults);
  const verified = verifiedSolutions(candidates, infixEquation);
  if (verified.length === 0) {
    return { ok: true, solutions: [] };
  }
  return { ok: true, solutions: verified };
}
