import { EquationRepository } from './equation.repository.js';
import { EquationStatus } from './equation.types.js';
import { tokenizeInfix } from './equation-solver/tokenizer.js';
import { infixToPostfix } from './equation-solver/infix-to-postfix.js';
import {
  RESOLUTION_CODES,
  RESOLUTION_STEP_NO_BRANCH,
  EMPTY_SET,
} from './equation-solver/resolution-constants.js';
import {
  validateSubEquation,
  parseAnswerValues,
  getSubEquationResult,
  checkStepHasSolution,
  isOnlyVariable,
  isQuadratic,
  matchAnswerAgainstKnownSolutions,
  replaceSubListInPostfix,
  listContainsElement,
} from './equation-solver/resolve-helpers.js';
import { infixToLatex, resultToLatex } from './infix-to-latex.js';

const RESULT_VALUE_SEPARATOR = ';';
const MESSAGE_RESOLVE_SUBEQUATION_REQUIRED = 'La subecuación es obligatoria.';
const MESSAGE_RESOLVE_EQUATION_NOT_FOUND = 'Ecuación no encontrada.';
const MESSAGE_RESOLVE_NO_PERMISSIONS = 'No tienes permisos para resolver esta ecuación.';
const MESSAGE_RESOLVE_INVALID_EQUATION = 'La ecuación almacenada es inválida.';
type ResolveStepPayload = {
  subEquationInfix?: string;
  answer: string;
  resolutionStepStatus: number;
};

type ResolutionSessionState = {
  currentResolutionId: number;
  selectedBranch: string;
  stateUpdated: boolean;
};

type StepEvaluation = {
  resultCode: string;
  isCorrect: boolean;
  isVariable: boolean;
  stepWithoutSolution: boolean;
  correctResults: number[];
  selectedBranch: string;
  stateUpdated: boolean;
};

function parseSolutionValues(json: unknown): number[] {
  if (json == null) return [];
  if (Array.isArray(json)) return json.filter((x) => typeof x === 'number' && Number.isFinite(x));
  return [];
}

function formatResultValue(values: number[]): string {
  return values.map((v) => String(v)).join(RESULT_VALUE_SEPARATOR);
}

export class ResolutionService {
  constructor(private equationRepository: EquationRepository) {}

  async resolveStep(
    userEquationId: string,
    userId: string,
    payload: ResolveStepPayload
  ): Promise<{ code: string; message?: string }> {
    const subEquationInfix = payload.subEquationInfix?.trim();
    const subEquationPostfix = this.parseSubEquationPostfix(subEquationInfix);
    if (subEquationPostfix.length === 0) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_SUBEQUATION_REQUIRED };
    }

    const userEq = await this.equationRepository.findByIdWithEquation(userEquationId);
    if (!userEq) return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_EQUATION_NOT_FOUND };
    if (userEq.userId !== userId) return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_NO_PERMISSIONS };

    const equationPostfixTokens = this.parseEquationPostfix(userEq.equation);
    if (!equationPostfixTokens) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_INVALID_EQUATION };
    }
    if (!validateSubEquation(equationPostfixTokens, subEquationPostfix)) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT };
    }

    const session = this.initializeSessionState(userEq);
    const subEquation = subEquationPostfix.join('');
    const isRepeatedStep = await this.isRepeatedSubmittedStep(
      userEquationId,
      session.currentResolutionId,
      subEquation,
      payload.answer
    );
    if (isRepeatedStep) {
      return { code: RESOLUTION_CODES.STEP_REPEATED };
    }

    const evaluation = await this.evaluateStep({
      userEquationId,
      answer: payload.answer,
      resolutionStepStatus: payload.resolutionStepStatus,
      equationPostfixTokens,
      subEquationPostfix,
      subEquation,
      currentResolutionId: session.currentResolutionId,
      selectedBranch: session.selectedBranch,
      stateUpdated: session.stateUpdated,
      solutions: parseSolutionValues(userEq.equation.solutionValues),
    });

    await this.persistResolutionOutcome({
      userEquationId,
      currentResolutionId: session.currentResolutionId,
      subEquation,
      subEquationInfix,
      answer: payload.answer,
      resolutionStepStatus: payload.resolutionStepStatus,
      evaluation,
    });

    return { code: evaluation.resultCode };
  }

  private parseSubEquationPostfix(subEquationInfix?: string): string[] {
    if (!subEquationInfix) return [];
    return infixToPostfix(tokenizeInfix(subEquationInfix)) ?? [];
  }

  private parseEquationPostfix(equation: {
    infixExpression?: string | null;
    postfixExpression?: string | null;
  }): string[] | null {
    const infix = equation.infixExpression ?? equation.postfixExpression ?? '';
    return infixToPostfix(tokenizeInfix(infix));
  }

  private initializeSessionState(userEq: {
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

  private async isRepeatedSubmittedStep(
    userEquationId: string,
    currentResolutionId: number,
    subEquation: string,
    answer: string
  ): Promise<boolean> {
    const loggedSteps = await this.equationRepository.findResolutionsByUserEquation(
      userEquationId,
      currentResolutionId
    );
    if (loggedSteps.length === 0) return false;
    const last = loggedSteps[loggedSteps.length - 1]!;
    return last.subEquation === subEquation && last.proposedResult === answer;
  }

  private async evaluateStep(args: {
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
  }): Promise<StepEvaluation> {
    if (args.answer === EMPTY_SET) {
      return this.evaluateEmptySetStep(args);
    }
    return this.evaluateStandardStep(args);
  }

  private async evaluateEmptySetStep(args: {
    userEquationId: string;
    equationPostfixTokens: string[];
    subEquationPostfix: string[];
    currentResolutionId: number;
    selectedBranch: string;
    stateUpdated: boolean;
  }): Promise<StepEvaluation> {
    let resultCode: string = RESOLUTION_CODES.STEP_INCORRECT;
    let isCorrect = false;
    let stateUpdated = args.stateUpdated;
    const loggedResolutions = await this.equationRepository.findResolutionsByUserEquation(
      args.userEquationId,
      args.currentResolutionId
    );
    if (loggedResolutions.length === 0) {
      const { hasSolution } = checkStepHasSolution(args.equationPostfixTokens, args.subEquationPostfix);
      if (hasSolution) {
        resultCode = RESOLUTION_CODES.RESULT_INCORRECT;
      } else {
        resultCode = RESOLUTION_CODES.RESOLUTION_FINISHED;
        isCorrect = true;
      }
    } else {
      resultCode = RESOLUTION_CODES.RESULT_INCORRECT;
      stateUpdated = true;
    }
    return {
      resultCode,
      isCorrect,
      isVariable: isOnlyVariable(args.subEquationPostfix),
      stepWithoutSolution: false,
      correctResults: [],
      selectedBranch: args.selectedBranch,
      stateUpdated,
    };
  }

  private async evaluateStandardStep(args: {
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
  }): Promise<StepEvaluation> {
    const parsedAnswers = parseAnswerValues(args.answer);
    const answerValue = parsedAnswers[0];
    let resultCode: string = RESOLUTION_CODES.STEP_INCORRECT;
    let isCorrect = false;
    const isVariable = isOnlyVariable(args.subEquationPostfix);
    let stepWithoutSolution = false;
    const correctResults: number[] = [];
    let selectedBranch = args.selectedBranch;
    let stateUpdated = args.stateUpdated;

    if (args.solutions.length > 0) {
      const knownSolutionEval = await this.evaluateWhenSolutionsAreKnown({
        userEquationId: args.userEquationId,
        currentResolutionId: args.currentResolutionId,
        resolutionStepStatus: args.resolutionStepStatus,
        equationPostfixTokens: args.equationPostfixTokens,
        subEquationPostfix: args.subEquationPostfix,
        subEquation: args.subEquation,
        answerValue,
        solutions: args.solutions,
        isVariable,
        selectedBranch,
        stateUpdated,
      });
      resultCode = knownSolutionEval.resultCode;
      isCorrect = knownSolutionEval.isCorrect;
      selectedBranch = knownSolutionEval.selectedBranch;
      stateUpdated = knownSolutionEval.stateUpdated;
      correctResults.push(...knownSolutionEval.correctResults);
    } else {
      const unknownSolutionEval = await this.evaluateWhenSolutionsAreNotKnown({
        userEquationId: args.userEquationId,
        currentResolutionId: args.currentResolutionId,
        equationPostfixTokens: args.equationPostfixTokens,
        subEquationPostfix: args.subEquationPostfix,
        answerValue,
        isVariable,
      });
      resultCode = unknownSolutionEval.resultCode;
      isCorrect = unknownSolutionEval.isCorrect;
      stepWithoutSolution = unknownSolutionEval.stepWithoutSolution;
      correctResults.push(...unknownSolutionEval.correctResults);
    }

    return {
      resultCode,
      isCorrect,
      isVariable,
      stepWithoutSolution,
      correctResults,
      selectedBranch,
      stateUpdated,
    };
  }

  private async evaluateWhenSolutionsAreKnown(args: {
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
  }): Promise<{
    resultCode: string;
    isCorrect: boolean;
    correctResults: number[];
    selectedBranch: string;
    stateUpdated: boolean;
  }> {
    const { isCorrect: matchedIsCorrect, correctResults } = matchAnswerAgainstKnownSolutions(
      args.subEquationPostfix,
      args.solutions,
      args.answerValue
    );
    let isCorrect = matchedIsCorrect;
    let selectedBranch = args.selectedBranch;
    let stateUpdated = args.stateUpdated;

    if (isCorrect && !args.isVariable) {
      const previousStepIsValid = await this.isPreviousStepValid(
        args.userEquationId,
        args.currentResolutionId,
        args.subEquationPostfix,
        args.answerValue ?? 0,
        args.resolutionStepStatus
      );
      if (!previousStepIsValid) isCorrect = false;
    }

    if (args.isVariable) {
      const variableDecision = await this.decideKnownVariableResult({
        userEquationId: args.userEquationId,
        currentResolutionId: args.currentResolutionId,
        solutions: args.solutions,
        subEquation: args.subEquation,
        selectedBranch,
        stateUpdated,
        isCorrect,
        correctResults,
      });
      return {
        resultCode: variableDecision.resultCode,
        isCorrect: variableDecision.isCorrect,
        correctResults,
        selectedBranch: variableDecision.selectedBranch,
        stateUpdated: variableDecision.stateUpdated,
      };
    }

    const nonVariableDecision = await this.decideKnownNonVariableResult({
      userEquationId: args.userEquationId,
      currentResolutionId: args.currentResolutionId,
      resolutionStepStatus: args.resolutionStepStatus,
      equationPostfixTokens: args.equationPostfixTokens,
      subEquationPostfix: args.subEquationPostfix,
      subEquation: args.subEquation,
      answerValue: args.answerValue ?? 0,
      isCorrect,
      selectedBranch,
      stateUpdated,
    });

    return {
      resultCode: nonVariableDecision.resultCode,
      isCorrect: nonVariableDecision.isCorrect,
      correctResults,
      selectedBranch: nonVariableDecision.selectedBranch,
      stateUpdated: nonVariableDecision.stateUpdated,
    };
  }

  private async decideKnownVariableResult(args: {
    userEquationId: string;
    currentResolutionId: number;
    solutions: number[];
    subEquation: string;
    selectedBranch: string;
    stateUpdated: boolean;
    isCorrect: boolean;
    correctResults: number[];
  }): Promise<{
    resultCode: string;
    isCorrect: boolean;
    selectedBranch: string;
    stateUpdated: boolean;
  }> {
    if (!args.isCorrect || args.correctResults.length === 0) {
      return {
        resultCode: RESOLUTION_CODES.RESULT_INCORRECT,
        isCorrect: false,
        selectedBranch: args.selectedBranch,
        stateUpdated: args.stateUpdated,
      };
    }

    const answerValue = args.correctResults[0]!;
    const loggedSolutions = await this.equationRepository.getDistinctLoggedSolutions(
      args.userEquationId,
      args.currentResolutionId
    );
    const solutionSet = [...new Set(args.solutions)];
    let resultCode: string = RESOLUTION_CODES.RESULT_CORRECT;
    let selectedBranch = args.selectedBranch;
    let stateUpdated = args.stateUpdated;

    if (loggedSolutions.some((s) => Math.abs(s - answerValue) <= 1e-9)) {
      resultCode = RESOLUTION_CODES.RESULT_REPEATED;
    } else if (loggedSolutions.length + 1 === solutionSet.length) {
      resultCode = RESOLUTION_CODES.RESOLUTION_FINISHED;
    } else if (selectedBranch.length === 0) {
      selectedBranch = args.subEquation;
      stateUpdated = true;
    }

    return {
      resultCode,
      isCorrect: true,
      selectedBranch,
      stateUpdated,
    };
  }

  private async decideKnownNonVariableResult(args: {
    userEquationId: string;
    currentResolutionId: number;
    resolutionStepStatus: number;
    equationPostfixTokens: string[];
    subEquationPostfix: string[];
    subEquation: string;
    answerValue: number;
    isCorrect: boolean;
    selectedBranch: string;
    stateUpdated: boolean;
  }): Promise<{
    resultCode: string;
    isCorrect: boolean;
    selectedBranch: string;
    stateUpdated: boolean;
  }> {
    if (!args.isCorrect) {
      return {
        resultCode: RESOLUTION_CODES.STEP_INCORRECT,
        isCorrect: false,
        selectedBranch: args.selectedBranch,
        stateUpdated: args.stateUpdated,
      };
    }

    const isRepeatedBranchAnswer = await this.hasRepeatedBranchResult(
      args.userEquationId,
      args.currentResolutionId,
      args.resolutionStepStatus,
      args.answerValue
    );
    if (isRepeatedBranchAnswer) {
      return {
        resultCode: RESOLUTION_CODES.RESULT_REPEATED,
        isCorrect: false,
        selectedBranch: args.selectedBranch,
        stateUpdated: args.stateUpdated,
      };
    }

    if (
      args.resolutionStepStatus === RESOLUTION_STEP_NO_BRANCH &&
      isQuadratic(args.equationPostfixTokens, args.subEquationPostfix)
    ) {
      const previousStep = await this.equationRepository.getPreviousStep(
        args.userEquationId,
        args.currentResolutionId,
        false,
        args.resolutionStepStatus
      );
      if (!previousStep) {
        return {
          resultCode: RESOLUTION_CODES.MORE_SOLUTIONS,
          isCorrect: true,
          selectedBranch: args.subEquation,
          stateUpdated: true,
        };
      }
    }

    return {
      resultCode: RESOLUTION_CODES.STEP_CORRECT,
      isCorrect: true,
      selectedBranch: args.selectedBranch,
      stateUpdated: args.stateUpdated,
    };
  }

  private async evaluateWhenSolutionsAreNotKnown(args: {
    userEquationId: string;
    currentResolutionId: number;
    equationPostfixTokens: string[];
    subEquationPostfix: string[];
    answerValue?: number;
    isVariable: boolean;
  }): Promise<{
    resultCode: string;
    isCorrect: boolean;
    stepWithoutSolution: boolean;
    correctResults: number[];
  }> {
    const resultsToValidate = getSubEquationResult(
      args.equationPostfixTokens,
      args.subEquationPostfix,
      'x',
      false
    );
    let resultCode: string = RESOLUTION_CODES.STEP_INCORRECT;
    let isCorrect = false;
    let stepWithoutSolution = false;
    const correctResults: number[] = [];

    if (resultsToValidate.length > 0) {
      const found =
        args.answerValue !== undefined && listContainsElement(resultsToValidate, args.answerValue);
      if (found && args.answerValue !== undefined) {
        isCorrect = true;
        correctResults.push(args.answerValue);
        resultCode = RESOLUTION_CODES.STEP_CORRECT;
      }
      if (!found) resultCode = RESOLUTION_CODES.STEP_INCORRECT;
      if (args.isVariable && isCorrect && resultsToValidate.length === 1) {
        resultCode = RESOLUTION_CODES.RESOLUTION_FINISHED;
      }
      return { resultCode, isCorrect, stepWithoutSolution, correctResults };
    }

    stepWithoutSolution = true;
    const attemptsCount = await this.equationRepository.countStepsWithoutSolution(
      args.userEquationId,
      args.currentResolutionId
    );
    if (attemptsCount + 1 === 3) resultCode = RESOLUTION_CODES.FIRST_WARNING;
    else if (attemptsCount + 1 === 5) resultCode = RESOLUTION_CODES.NO_SOLUTION;
    else resultCode = RESOLUTION_CODES.STEP_INCORRECT;

    return { resultCode, isCorrect, stepWithoutSolution, correctResults };
  }

  private async persistResolutionOutcome(args: {
    userEquationId: string;
    currentResolutionId: number;
    subEquation: string;
    subEquationInfix?: string;
    answer: string;
    resolutionStepStatus: number;
    evaluation: StepEvaluation;
  }): Promise<void> {
    const solved =
      args.evaluation.resultCode === RESOLUTION_CODES.RESOLUTION_FINISHED ||
      args.evaluation.resultCode === RESOLUTION_CODES.NO_SOLUTION;
    const stateUpdated = args.evaluation.stateUpdated || solved;
    const newStatus = solved ? EquationStatus.SOLVED : EquationStatus.IN_PROGRESS;

    if (stateUpdated) {
      await this.equationRepository.updateResolutionState(args.userEquationId, {
        status: newStatus,
        currentResolutionId: args.currentResolutionId,
        selectedBranch: args.evaluation.selectedBranch,
      });
    }

    await this.equationRepository.createResolution({
      userEquationId: args.userEquationId,
      resolutionSessionId: args.currentResolutionId,
      subEquation: args.subEquation,
      subEquationInfix: args.subEquationInfix || undefined,
      proposedResult: args.answer,
      resultValue: formatResultValue(args.evaluation.correctResults),
      stepWithoutSolution: args.evaluation.stepWithoutSolution,
      isCorrect: args.evaluation.isCorrect,
      isVariable: args.evaluation.isVariable,
      resolutionSide: args.resolutionStepStatus,
    });
  }

  private async isPreviousStepValid(
    userEquationId: string,
    resolutionSessionId: number,
    subEquationPostfix: string[],
    answerValue: number,
    resolutionStatus: number
  ): Promise<boolean> {
    const previousStep = await this.equationRepository.getPreviousStep(
      userEquationId,
      resolutionSessionId,
      false,
      resolutionStatus
    );
    if (!previousStep) return true;

    const answerValues = previousStep.resultValue
      .split(RESULT_VALUE_SEPARATOR)
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));

    const userEq = await this.equationRepository.findByIdWithEquation(userEquationId);
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

    const { postfixToTree } = await import('./equation-solver/postfix-to-tree.js');
    const tree = postfixToTree(replaced);
    if (!tree || tree.type !== 'OPERATOR_BINARY' || tree.value !== '=' || !tree.left || !tree.right)
      return true;

    const { evaluateTree } = await import('./equation-solver/evaluate-tree.js');
    const leftVals = evaluateTree(tree.left, false);
    const rightVals = evaluateTree(tree.right, false);
    for (const value of answerValues) {
      if (leftVals.some((v) => Math.abs(v - value) <= 1e-9) || rightVals.some((v) => Math.abs(v - value) <= 1e-9))
        return true;
    }
    
    return false;
  }

  private async hasRepeatedBranchResult(
    userEquationId: string,
    resolutionSessionId: number,
    resolutionStepStatus: number,
    answerValue: number
  ): Promise<boolean> {
    if (resolutionStepStatus === RESOLUTION_STEP_NO_BRANCH) return false;
    const previousStep = await this.equationRepository.getPreviousStep(
      userEquationId,
      resolutionSessionId,
      true,
      RESOLUTION_STEP_NO_BRANCH
    );
    if (!previousStep) return false;
    const values = previousStep.resultValue
      .split(RESULT_VALUE_SEPARATOR)
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    return listContainsElement(values, answerValue);
  }

  async getResolution(userEquationId: string, userId: string) {
    const userEq = await this.equationRepository.findByIdWithEquation(userEquationId);
    if (!userEq || userEq.userId !== userId) return null;
    const currentResolutionId = userEq.currentResolutionId ?? 0;
    const rawSteps = await this.equationRepository.findResolutionsByUserEquation(
      userEquationId,
      currentResolutionId
    );
    const steps = rawSteps.map((step) => ({
      subEquation: step.subEquation,
      proposedResult: step.proposedResult,
      isCorrect: step.isCorrect,
      subEquationLatex:
        step.subEquationInfix?.trim() ? infixToLatex(step.subEquationInfix.trim()) : undefined,
      resultLatex: resultToLatex(step.proposedResult),
    }));
    const solutionSet = await this.equationRepository.getDistinctLoggedSolutions(
      userEquationId,
      currentResolutionId
    );
    return {
      userEquation: userEq,
      steps,
      solutionSet,
      currentResolutionId,
    };
  }

  async resetResolution(userEquationId: string, userId: string): Promise<boolean> {
    const canModify = await this.equationRepository.canUserModify(userEquationId, userId);
    if (!canModify) return false;
    await this.equationRepository.deleteResolutionsByUserEquation(userEquationId);
    await this.equationRepository.updateResolutionState(userEquationId, {
      status: EquationStatus.NOT_STARTED,
      selectedBranch: '',
    });
    return true;
  }
}
