import { tokenizeInfix } from './equation-solver/tokenizer.js';
import { infixToPostfix } from './equation-solver/infix-to-postfix.js';
import { listContainsList } from './equation-solver/evaluate-tree.js';
import { EquationStatus } from './equation.types.js';
import { DEFAULT_FLOAT_TOLERANCE } from './equation-solver/constants.js';

export const RESULT_VALUE_SEPARATOR = ';';
export const MESSAGE_RESOLVE_SUBEQUATION_REQUIRED = 'La ecuación equivalente es obligatoria';
export const MESSAGE_RESOLVE_EQUATION_NOT_FOUND = 'Ecuación no encontrada.';
export const MESSAGE_RESOLVE_NO_PERMISSIONS = 'No tienes permisos para resolver esta ecuación.';
export const MESSAGE_RESOLVE_INVALID_EQUATION = 'La ecuación almacenada es inválida.';

export const FINISH_ATTEMPT_SUBEQUATION_KEY = '__finish_attempt__';
export const EMPTY_SET_WITHOUT_SUBEQUATION_KEY = '__empty_set_no_sub__';

export type ResolutionSessionState = {
  currentResolutionId: number;
  selectedBranch: string;
  stateUpdated: boolean;
};

export type StepEvaluation = {
  resultCode: string;
  isCorrect: boolean;
  isVariable: boolean;
  stepWithoutSolution: boolean;
  correctResult?: number;
  resultValue?: string;
  selectedBranch: string;
  stateUpdated: boolean;
};

export type KnownStepDecision = {
  resultCode: string;
  isCorrect: boolean;
  selectedBranch: string;
  stateUpdated: boolean;
};

export type KnownSolutionEvalOutcome = KnownStepDecision & {
  correctResult?: number;
  resultValue?: string;
};

export function parseSolutionValues(json: unknown): number[] {
  if (json == null) return [];
  if (Array.isArray(json)) return json.filter((x) => typeof x === 'number' && Number.isFinite(x));
  return [];
}

export function formatResultValue(value?: number): string {
  return value === undefined ? '' : String(value);
}

export function parseStoredResultValues(resultValue: string): number[] {
  return resultValue
    .split(RESULT_VALUE_SEPARATOR)
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
}

export function makeKnownStepDecision(
  resultCode: string,
  isCorrect: boolean,
  selectedBranch: string,
  stateUpdated: boolean
): KnownStepDecision {
  return { resultCode, isCorrect, selectedBranch, stateUpdated };
}

export function parseSubEquationPostfix(subEquationInfix?: string): string[] {
  if (!subEquationInfix) return [];
  return infixToPostfix(tokenizeInfix(subEquationInfix)) ?? [];
}

export function parseEquationPostfix(equation: {
  infixExpression?: string | null;
  postfixExpression?: string | null;
}): string[] | null {
  const infix = equation.infixExpression ?? equation.postfixExpression ?? '';
  return infixToPostfix(tokenizeInfix(infix));
}

export function initializeSessionState(userEq: {
  status: string;
  currentResolutionId?: number | null;
  selectedBranch?: string | null;
}): ResolutionSessionState {
  let currentResolutionId = userEq.currentResolutionId ?? 0;
  let stateUpdated = false;
  if (userEq.status === EquationStatus.NOT_STARTED || userEq.status === EquationStatus.SOLVED) {
    currentResolutionId += 1;
    stateUpdated = true;
  }
  return {
    currentResolutionId,
    selectedBranch: userEq.selectedBranch ?? '',
    stateUpdated,
  };
}

export function needsResolutionStateSync(
  session: ResolutionSessionState,
  userEq: { currentResolutionId?: number | null },
  effectiveResolutionId: number
): boolean {
  return session.stateUpdated || (userEq.currentResolutionId ?? 0) !== effectiveResolutionId;
}

export function isKnownSolutionSetComplete(knownSolutions: number[], logged: number[]): boolean {
  if (knownSolutions.length === 0) return false;
  return logged.length === knownSolutions.length && listContainsList(logged, knownSolutions);
}

export function equationSidesShareNumericValue(leftVals: number[], rightVals: number[]): boolean {
  for (const a of leftVals) {
    for (const b of rightVals) {
      if (Math.abs(a - b) <= DEFAULT_FLOAT_TOLERANCE) return true;
    }
  }
  return false;
}
