import type { EquationRepository } from './equation.repository.js';
import { tokenizeInfix } from './equation-solver/tokenizer.js';
import { infixToPostfix } from './equation-solver/infix-to-postfix.js';
import { evaluateTree } from './equation-solver/evaluate-tree.js';
import { postfixToTree } from './equation-solver/postfix-to-tree.js';
import {
  RESOLUTION_CODES,
  RESOLUTION_STEP_NO_BRANCH,
  RESOLUTION_STEP_BRANCH,
  EMPTY_SET,
} from './equation-solver/resolution-constants.js';
import {
  parseAnswerValues,
  isOnlyVariable,
  isQuadratic,
  matchAnswerAgainstKnownSolutions,
  replaceSubListInPostfix,
  listContainsElement,
} from './equation-solver/resolve-helpers.js';
import {
  equationSidesShareNumericValue,
  makeKnownStepDecision,
  parseSolutionValues,
  parseStoredResultValues,
  type KnownSolutionEvalOutcome,
  type KnownStepDecision,
  type StepEvaluation,
} from './resolution.service.helpers.js';

export async function isRepeatedSubmittedStep(
  repo: EquationRepository,
  userEquationId: string,
  currentResolutionId: number,
  subEquation: string,
  answer: string
): Promise<boolean> {
  const loggedSteps = await repo.findResolutionsByUserEquation(userEquationId, currentResolutionId);
  return loggedSteps.some(
    (step) =>
      step.isCorrect &&
      step.subEquation === subEquation &&
      step.proposedResult === answer
  );
}

/**
 * True when the step does not use a more developed x-bearing subexpression than the last
 * correct non-variable step. Equal length is allowed for the same subexpression (e.g. x+7=8 then x+7=-8).
 */
export async function isSubEquationSimplerThanPrevious(
  repo: EquationRepository,
  userEquationId: string,
  resolutionSessionId: number,
  subEquation: string,
  resolutionStatus: number
): Promise<boolean> {
  if (resolutionStatus === RESOLUTION_STEP_BRANCH) return true;

  const previousStep = await repo.getPreviousStep(
    userEquationId,
    resolutionSessionId,
    false,
    resolutionStatus
  );
  if (!previousStep?.subEquation) return true;

  const previousLen = previousStep.subEquation.length;
  const currentLen = subEquation.length;
  if (currentLen > previousLen) return false;
  if (currentLen < previousLen) return true;
  return subEquation === previousStep.subEquation;
}

export async function evaluateStep(
  repo: EquationRepository,
  args: {
    userEquationId: string;
    answer: string;
    resolutionStepStatus: number;
    equationPostfixTokens: string[];
    subEquationPostfix: string[];
    subEquation: string;
    currentResolutionId: number;
    selectedBranch: string;
    stateUpdated: boolean;
    solutions: number[];
  }
): Promise<StepEvaluation> {
  if (args.answer === EMPTY_SET) {
    return evaluateEmptySetStep(repo, {
      userEquationId: args.userEquationId,
      subEquationPostfix: args.subEquationPostfix,
      currentResolutionId: args.currentResolutionId,
      selectedBranch: args.selectedBranch,
      stateUpdated: args.stateUpdated,
      knownSolutions: args.solutions,
    });
  }
  return evaluateStandardStep(repo, args);
}

async function evaluateEmptySetStep(
  repo: EquationRepository,
  args: {
    userEquationId: string;
    subEquationPostfix: string[];
    currentResolutionId: number;
    selectedBranch: string;
    stateUpdated: boolean;
    knownSolutions: number[];
  }
): Promise<StepEvaluation> {
  if (args.knownSolutions.length === 0) {
    return {
      resultCode: RESOLUTION_CODES.RESOLUTION_FINISHED,
      isCorrect: true,
      isVariable: isOnlyVariable(args.subEquationPostfix),
      stepWithoutSolution: false,
      correctResult: undefined,
      selectedBranch: args.selectedBranch,
      stateUpdated: args.stateUpdated,
    };
  }

  const loggedResolutions = await repo.findResolutionsByUserEquation(
    args.userEquationId,
    args.currentResolutionId
  );
  const stateUpdated = loggedResolutions.length > 0 ? true : args.stateUpdated;
  return {
    resultCode: RESOLUTION_CODES.RESULT_INCORRECT,
    isCorrect: false,
    isVariable: isOnlyVariable(args.subEquationPostfix),
    stepWithoutSolution: false,
    correctResult: undefined,
    selectedBranch: args.selectedBranch,
    stateUpdated,
  };
}

async function evaluateStandardStep(
  repo: EquationRepository,
  args: {
    userEquationId: string;
    answer: string;
    resolutionStepStatus: number;
    equationPostfixTokens: string[];
    subEquationPostfix: string[];
    subEquation: string;
    currentResolutionId: number;
    selectedBranch: string;
    stateUpdated: boolean;
    solutions: number[];
  }
): Promise<StepEvaluation> {
  const parsedAnswers = parseAnswerValues(args.answer);
  const answerValue = parsedAnswers[0];
  if (args.solutions.length === 0 && parsedAnswers.length > 0 && answerValue !== undefined) {
    return evaluateNumericAttemptOnEmptySolutionEquation(repo, {
      userEquationId: args.userEquationId,
      currentResolutionId: args.currentResolutionId,
      subEquationPostfix: args.subEquationPostfix,
      selectedBranch: args.selectedBranch,
      stateUpdated: args.stateUpdated,
    });
  }

  const knownSolutionEval = await evaluateWhenSolutionsAreKnown(repo, {
    userEquationId: args.userEquationId,
    currentResolutionId: args.currentResolutionId,
    resolutionStepStatus: args.resolutionStepStatus,
    equationPostfixTokens: args.equationPostfixTokens,
    subEquationPostfix: args.subEquationPostfix,
    subEquation: args.subEquation,
    answerValue,
    solutions: args.solutions,
    isVariable: isOnlyVariable(args.subEquationPostfix),
    selectedBranch: args.selectedBranch,
    stateUpdated: args.stateUpdated,
  });

  return {
    resultCode: knownSolutionEval.resultCode,
    isCorrect: knownSolutionEval.isCorrect,
    isVariable: isOnlyVariable(args.subEquationPostfix),
    stepWithoutSolution: false,
    correctResult: knownSolutionEval.correctResult,
    selectedBranch: knownSolutionEval.selectedBranch,
    stateUpdated: knownSolutionEval.stateUpdated,
  };
}

async function evaluateNumericAttemptOnEmptySolutionEquation(
  repo: EquationRepository,
  args: {
    userEquationId: string;
    currentResolutionId: number;
    subEquationPostfix: string[];
    selectedBranch: string;
    stateUpdated: boolean;
  }
): Promise<StepEvaluation> {
  const priorFailures = await repo.countEmptySolutionWrongNumericAttempts(
    args.userEquationId,
    args.currentResolutionId
  );
  let resultCode: string = RESOLUTION_CODES.STEP_INCORRECT;
  if (priorFailures >= 5) {
    resultCode = RESOLUTION_CODES.NO_SOLUTION;
  } else if (priorFailures === 2) {
    resultCode = RESOLUTION_CODES.FIRST_WARNING;
  }
  return {
    resultCode,
    isCorrect: false,
    isVariable: isOnlyVariable(args.subEquationPostfix),
    stepWithoutSolution: true,
    correctResult: undefined,
    selectedBranch: args.selectedBranch,
    stateUpdated: args.stateUpdated,
  };
}

async function evaluateWhenSolutionsAreKnown(
  repo: EquationRepository,
  args: {
    userEquationId: string;
    currentResolutionId: number;
    resolutionStepStatus: number;
    equationPostfixTokens: string[];
    subEquationPostfix: string[];
    subEquation: string;
    answerValue?: number;
    solutions: number[];
    isVariable: boolean;
    selectedBranch: string;
    stateUpdated: boolean;
  }
): Promise<KnownSolutionEvalOutcome> {
  const { isCorrect: matchedIsCorrect, correctResult } = matchAnswerAgainstKnownSolutions(
    args.subEquationPostfix,
    args.solutions,
    args.answerValue
  );
  let isCorrect = matchedIsCorrect;
  let incorrectResultCode: string | undefined;

  if (isCorrect && !args.isVariable) {
    const previousStepIsValid = await isPreviousStepValid(
      repo,
      args.userEquationId,
      args.currentResolutionId,
      args.subEquationPostfix,
      args.answerValue ?? 0,
      args.resolutionStepStatus
    );
    if (!previousStepIsValid) {
      isCorrect = false;
    } else {
      const subEquationSimpler = await isSubEquationSimplerThanPrevious(
        repo,
        args.userEquationId,
        args.currentResolutionId,
        args.subEquation,
        args.resolutionStepStatus
      );
      if (!subEquationSimpler) {
        isCorrect = false;
        incorrectResultCode = RESOLUTION_CODES.STEP_REGRESSION;
      }
    }
  }

  const stepDecision: KnownStepDecision = args.isVariable
    ? await decideKnownVariableResult(repo, {
        userEquationId: args.userEquationId,
        currentResolutionId: args.currentResolutionId,
        solutions: args.solutions,
        subEquation: args.subEquation,
        selectedBranch: args.selectedBranch,
        stateUpdated: args.stateUpdated,
        isCorrect,
        correctResult,
      })
    : await decideKnownNonVariableResult(repo, {
        userEquationId: args.userEquationId,
        currentResolutionId: args.currentResolutionId,
        resolutionStepStatus: args.resolutionStepStatus,
        equationPostfixTokens: args.equationPostfixTokens,
        subEquationPostfix: args.subEquationPostfix,
        subEquation: args.subEquation,
        answerValue: args.answerValue ?? 0,
        isCorrect,
        incorrectResultCode,
        selectedBranch: args.selectedBranch,
        stateUpdated: args.stateUpdated,
      });

  return { ...stepDecision, correctResult };
}

async function decideKnownVariableResult(
  repo: EquationRepository,
  args: {
    userEquationId: string;
    currentResolutionId: number;
    solutions: number[];
    subEquation: string;
    selectedBranch: string;
    stateUpdated: boolean;
    isCorrect: boolean;
    correctResult?: number;
  }
): Promise<KnownStepDecision> {
  if (!args.isCorrect || args.correctResult === undefined) {
    return makeKnownStepDecision(
      RESOLUTION_CODES.RESULT_INCORRECT,
      false,
      args.selectedBranch,
      args.stateUpdated
    );
  }

  const answerValue = args.correctResult;
  const loggedSolutions = await repo.getDistinctLoggedSolutions(
    args.userEquationId,
    args.currentResolutionId
  );
  const solutionSet = [...new Set(args.solutions)];
  let resultCode: string = RESOLUTION_CODES.RESULT_CORRECT;
  let selectedBranch = args.selectedBranch;
  let stateUpdated = args.stateUpdated;

  if (listContainsElement(loggedSolutions, answerValue)) {
    resultCode = RESOLUTION_CODES.RESULT_REPEATED;
  } else if (loggedSolutions.length + 1 === solutionSet.length) {
    resultCode = RESOLUTION_CODES.PENDING_FINISH;
  } else if (selectedBranch.length === 0) {
    selectedBranch = args.subEquation;
    stateUpdated = true;
  }

  return makeKnownStepDecision(resultCode, true, selectedBranch, stateUpdated);
}

async function decideKnownNonVariableResult(
  repo: EquationRepository,
  args: {
    userEquationId: string;
    currentResolutionId: number;
    resolutionStepStatus: number;
    equationPostfixTokens: string[];
    subEquationPostfix: string[];
    subEquation: string;
    answerValue: number;
    isCorrect: boolean;
    incorrectResultCode?: string;
    selectedBranch: string;
    stateUpdated: boolean;
  }
): Promise<KnownStepDecision> {
  if (!args.isCorrect) {
    return makeKnownStepDecision(
      args.incorrectResultCode ?? RESOLUTION_CODES.STEP_INCORRECT,
      false,
      args.selectedBranch,
      args.stateUpdated
    );
  }

  const isRepeatedBranchAnswer = await hasRepeatedBranchResult(
    repo,
    args.userEquationId,
    args.currentResolutionId,
    args.resolutionStepStatus,
    args.answerValue
  );
  if (isRepeatedBranchAnswer) {
    return makeKnownStepDecision(
      RESOLUTION_CODES.RESULT_REPEATED,
      false,
      args.selectedBranch,
      args.stateUpdated
    );
  }

  if (
    args.resolutionStepStatus === RESOLUTION_STEP_NO_BRANCH &&
    isQuadratic(args.equationPostfixTokens, args.subEquationPostfix)
  ) {
    const previousStep = await repo.getPreviousStep(
      args.userEquationId,
      args.currentResolutionId,
      false,
      args.resolutionStepStatus
    );
    if (!previousStep) {
      return makeKnownStepDecision(RESOLUTION_CODES.STEP_CORRECT, true, args.subEquation, true);
    }
  }

  return makeKnownStepDecision(
    RESOLUTION_CODES.STEP_CORRECT,
    true,
    args.selectedBranch,
    args.stateUpdated
  );
}

export async function isPreviousStepValid(
  repo: EquationRepository,
  userEquationId: string,
  resolutionSessionId: number,
  subEquationPostfix: string[],
  answerValue: number,
  resolutionStatus: number
): Promise<boolean> {
  const previousStep = await repo.getPreviousStep(
    userEquationId,
    resolutionSessionId,
    false,
    resolutionStatus
  );
  if (!previousStep) return true;

  const previousAnswerValues = parseStoredResultValues(previousStep.resultValue);

  const userEq = await repo.findByIdWithEquation(userEquationId);
  if (!userEq?.equation) return true;

  const infix = userEq.equation.infixExpression ?? userEq.equation.postfixExpression ?? '';
  const equationPostfix = infixToPostfix(tokenizeInfix(infix));
  if (!equationPostfix) return true;
  const replaced = replaceSubListInPostfix(
    equationPostfix,
    subEquationPostfix,
    String(answerValue)
  );
  if (!replaced) return true;

  const tree = postfixToTree(replaced);
  if (!tree || tree.type !== 'OPERATOR_BINARY' || tree.value !== '=' || !tree.left || !tree.right)
    return true;

  const knownSolutions = parseSolutionValues(userEq.equation.solutionValues);
  if (knownSolutions.length > 0) {
    for (const s of knownSolutions) {
      const leftVals = evaluateTree(tree.left, false, s);
      const rightVals = evaluateTree(tree.right, false, s);
      for (const value of previousAnswerValues) {
        if (listContainsElement(leftVals, value) || listContainsElement(rightVals, value)) return true;
      }
      if (equationSidesShareNumericValue(leftVals, rightVals)) return true;
    }
    return false;
  }

  const leftVals = evaluateTree(tree.left, false);
  const rightVals = evaluateTree(tree.right, false);
  for (const value of previousAnswerValues) {
    if (listContainsElement(leftVals, value) || listContainsElement(rightVals, value)) return true;
  }

  return false;
}

export async function hasRepeatedBranchResult(
  repo: EquationRepository,
  userEquationId: string,
  resolutionSessionId: number,
  resolutionStepStatus: number,
  answerValue: number
): Promise<boolean> {
  if (resolutionStepStatus === RESOLUTION_STEP_NO_BRANCH) return false;
  const previousStep = await repo.getPreviousStep(
    userEquationId,
    resolutionSessionId,
    true,
    RESOLUTION_STEP_NO_BRANCH
  );
  if (!previousStep) return false;
  return listContainsElement(parseStoredResultValues(previousStep.resultValue), answerValue);
}
