/**
 * Checks for infinite/NaN results and applies final decision logic.
 */

import { ERROR_CODES, ERROR_MESSAGES } from './types.js';
import { verifiedSolutions } from './verify-solutions.js';

export function hasInfiniteResult(solutions: number[]): boolean {
  return solutions.some(
    (v) => !Number.isFinite(v) || v === Infinity || v === -Infinity || Number.isNaN(v)
  );
}

/** Given raw evaluation results and the infix equation, returns verified solutions and ok/error. */
export function checkSolutions(
  rawResults: number[],
  infixEquation: string
): { ok: boolean; solutions: number[]; errorCode?: string; message?: string } {
  if (hasInfiniteResult(rawResults)) {
    return {
      ok: false,
      solutions: [],
      errorCode: ERROR_CODES.INFINITE_RESULT,
      message: ERROR_MESSAGES[ERROR_CODES.INFINITE_RESULT],
    };
  }
  const verified = verifiedSolutions(rawResults, infixEquation);
  if (rawResults.length > 0 && verified.length === 0) {
    return {
      ok: false,
      solutions: [],
      errorCode: ERROR_CODES.INFINITE_RESULT,
      message: ERROR_MESSAGES[ERROR_CODES.INFINITE_RESULT],
    };
  }
  if (verified.length === 0) {
    return {
      ok: false,
      solutions: [],
      errorCode: ERROR_CODES.NO_SOLUTION,
      message: ERROR_MESSAGES[ERROR_CODES.NO_SOLUTION],
    };
  }
  return { ok: true, solutions: verified };
}
