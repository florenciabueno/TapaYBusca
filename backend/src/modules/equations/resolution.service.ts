import { EquationRepository } from './equation.repository.js';
import { EquationStatus } from './equation.types.js';
import { tokenizeInfix } from './equation-solver/tokenizer.js';
import { infixToPostfix } from './equation-solver/infix-to-postfix.js';
import { evaluateTree } from './equation-solver/evaluate-tree.js';
import { postfixToTree } from './equation-solver/postfix-to-tree.js';
import {
  RESOLUTION_CODES,
  RESOLUTION_STEP_NO_BRANCH,
  RESOLUTION_STEP_FINISH_ATTEMPT,
  RESOLUTION_STEP_INVALID_SUBEQUATION_ATTEMPT,
  EMPTY_SET,
} from './equation-solver/resolution-constants.js';
import { DEFAULT_FLOAT_TOLERANCE } from './equation-solver/constants.js';
import {
  validateSubEquation,
  parseAnswerValues,
  isOnlyVariable,
  isQuadratic,
  matchAnswerAgainstKnownSolutions,
  replaceSubListInPostfix,
  listContainsElement,
  pickExpressionAndAnswer,
  computeEffectiveResolutionSessionId,
} from './equation-solver/resolve-helpers.js';
import { listContainsList } from './equation-solver/evaluate-tree.js';
import { infixToLatex, resultToLatex } from './infix-to-latex.js';

const RESULT_VALUE_SEPARATOR = ';';
const MESSAGE_RESOLVE_SUBEQUATION_REQUIRED = 'La subecuación es obligatoria';
const MESSAGE_RESOLVE_EQUATION_NOT_FOUND = 'Ecuación no encontrada.';
const MESSAGE_RESOLVE_NO_PERMISSIONS = 'No tienes permisos para resolver esta ecuación.';
const MESSAGE_RESOLVE_INVALID_EQUATION = 'La ecuación almacenada es inválida.';

const FINISH_ATTEMPT_SUBEQUATION_KEY = '__finish_attempt__';
const EMPTY_SET_WITHOUT_SUBEQUATION_KEY = '__empty_set_no_sub__';

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
  correctResult?: number;
  selectedBranch: string;
  stateUpdated: boolean;
};

type KnownStepDecision = {
  resultCode: string;
  isCorrect: boolean;
  selectedBranch: string;
  stateUpdated: boolean;
};

type KnownSolutionEvalOutcome = KnownStepDecision & { correctResult?: number };

function parseSolutionValues(json: unknown): number[] {
  if (json == null) return [];
  if (Array.isArray(json)) return json.filter((x) => typeof x === 'number' && Number.isFinite(x));
  return [];
}

function formatResultValue(value?: number): string {
  return value === undefined ? '' : String(value);
}

function parseStoredResultValues(resultValue: string): number[] {
  return resultValue
    .split(RESULT_VALUE_SEPARATOR)
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
}

function makeKnownStepDecision(
  resultCode: string,
  isCorrect: boolean,
  selectedBranch: string,
  stateUpdated: boolean
): KnownStepDecision {
  return { resultCode, isCorrect, selectedBranch, stateUpdated };
}

export class ResolutionService {
  constructor(private equationRepository: EquationRepository) {}

  async resolveStep(
    userEquationId: string,
    userId: string,
    payload: ResolveStepPayload
  ): Promise<{ code: string; message?: string }> {
    const rawSub = (payload.subEquationInfix ?? '').trim();
    const rawAnswer = (payload.answer ?? '').trim();
    const isEmptySetAnswer = rawAnswer === EMPTY_SET;
    const picked = isEmptySetAnswer
      ? { expressionInfix: rawSub, answerContent: rawAnswer }
      : pickExpressionAndAnswer(rawSub, rawAnswer);
    const subEquationInfix = picked.expressionInfix;
    const subEquationPostfix = this.parseSubEquationPostfix(subEquationInfix);
    if (subEquationPostfix.length === 0 && !isEmptySetAnswer) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_SUBEQUATION_REQUIRED };
    }

    const userEq = await this.equationRepository.findByIdWithEquation(userEquationId);
    if (!userEq) return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_EQUATION_NOT_FOUND };
    if (userEq.userId !== userId) return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_NO_PERMISSIONS };

    const equationPostfixTokens = this.parseEquationPostfix(userEq.equation);
    if (!equationPostfixTokens) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_INVALID_EQUATION };
    }

    const subEquation =
      subEquationPostfix.length === 0 && isEmptySetAnswer
        ? EMPTY_SET_WITHOUT_SUBEQUATION_KEY
        : subEquationPostfix.join('');
    const answerForStep = isEmptySetAnswer ? rawAnswer : picked.answerContent;

    const { session, effectiveResolutionId } = await this.loadEffectiveResolutionSession(
      userEquationId,
      userEq
    );

    const skipSubequationValidation = isEmptySetAnswer && subEquationPostfix.length === 0;
    const subEquationInfixForStep = skipSubequationValidation ? '\\emptyset' : subEquationInfix.trim();
    if (!skipSubequationValidation && !validateSubEquation(equationPostfixTokens, subEquationPostfix)) {
      return this.persistInvalidSubequationAttempt({
        userEquationId,
        userEq,
        session,
        effectiveResolutionId,
        subEquation,
        subEquationInfix,
        answerForStep,
      });
    }

    const knownSolutions = parseSolutionValues(userEq.equation.solutionValues);

    const isRepeatedStep = await this.isRepeatedSubmittedStep(
      userEquationId,
      effectiveResolutionId,
      subEquation,
      answerForStep
    );
    if (isRepeatedStep) {
      return { code: RESOLUTION_CODES.STEP_REPEATED };
    }

    const evaluation = await this.evaluateStep({
      userEquationId,
      answer: answerForStep,
      resolutionStepStatus: payload.resolutionStepStatus,
      equationPostfixTokens,
      subEquationPostfix,
      subEquation,
      currentResolutionId: effectiveResolutionId,
      selectedBranch: session.selectedBranch,
      stateUpdated: session.stateUpdated,
      solutions: knownSolutions,
    });

    await this.persistResolutionOutcome({
      userEquationId,
      currentResolutionId: effectiveResolutionId,
      subEquation,
      subEquationInfix: subEquationInfixForStep,
      answer: answerForStep,
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

  private async loadEffectiveResolutionSession(
    userEquationId: string,
    userEq: { status: string; currentResolutionId?: number | null; selectedBranch?: string | null }
  ): Promise<{ session: ResolutionSessionState; effectiveResolutionId: number }> {
    const session = this.initializeSessionState(userEq);
    const maxExistingSession = await this.equationRepository.getMaxResolutionSessionId(userEquationId);
    const effectiveResolutionId = computeEffectiveResolutionSessionId(
      session.currentResolutionId,
      userEq.currentResolutionId ?? 0,
      maxExistingSession
    );
    return { session, effectiveResolutionId };
  }

  private needsResolutionStateSync(
    session: ResolutionSessionState,
    userEq: { currentResolutionId?: number | null },
    effectiveResolutionId: number
  ): boolean {
    return session.stateUpdated || (userEq.currentResolutionId ?? 0) !== effectiveResolutionId;
  }

  private async syncInProgressResolutionState(
    userEquationId: string,
    effectiveResolutionId: number,
    selectedBranch: string
  ): Promise<void> {
    await this.equationRepository.updateResolutionState(userEquationId, {
      status: EquationStatus.IN_PROGRESS,
      currentResolutionId: effectiveResolutionId,
      selectedBranch,
    });
  }

  private async persistInvalidSubequationAttempt(params: {
    userEquationId: string;
    userEq: { currentResolutionId?: number | null; selectedBranch?: string | null };
    session: ResolutionSessionState;
    effectiveResolutionId: number;
    subEquation: string;
    subEquationInfix: string;
    answerForStep: string;
  }): Promise<{ code: string }> {
    const {
      userEquationId,
      userEq,
      session,
      effectiveResolutionId,
      subEquation,
      subEquationInfix,
      answerForStep,
    } = params;

    const isRepeated = await this.isRepeatedSubmittedStep(
      userEquationId,
      effectiveResolutionId,
      subEquation,
      answerForStep
    );
    if (isRepeated) {
      return { code: RESOLUTION_CODES.STEP_REPEATED };
    }

    if (this.needsResolutionStateSync(session, userEq, effectiveResolutionId)) {
      await this.syncInProgressResolutionState(
        userEquationId,
        effectiveResolutionId,
        session.selectedBranch
      );
    }

    await this.equationRepository.createResolution({
      userEquationId,
      resolutionSessionId: effectiveResolutionId,
      subEquation,
      subEquationInfix: subEquationInfix,
      proposedResult: answerForStep,
      resultValue: '',
      stepWithoutSolution: false,
      isCorrect: false,
      isVariable: false,
      resolutionSide: RESOLUTION_STEP_INVALID_SUBEQUATION_ATTEMPT,
    });
    return { code: RESOLUTION_CODES.SYNTAX_INCORRECT };
  }

  private isKnownSolutionSetComplete(knownSolutions: number[], logged: number[]): boolean {
    if (knownSolutions.length === 0) return false;
    return logged.length === knownSolutions.length && listContainsList(logged, knownSolutions);
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
      return this.evaluateEmptySetStep({
        userEquationId: args.userEquationId,
        equationPostfixTokens: args.equationPostfixTokens,
        subEquationPostfix: args.subEquationPostfix,
        currentResolutionId: args.currentResolutionId,
        selectedBranch: args.selectedBranch,
        stateUpdated: args.stateUpdated,
        knownSolutions: args.solutions,
      });
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
    knownSolutions: number[];
  }): Promise<StepEvaluation> {
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

    const loggedResolutions = await this.equationRepository.findResolutionsByUserEquation(
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
    if (args.solutions.length === 0 && parsedAnswers.length > 0 && answerValue !== undefined) {
      return this.evaluateNumericAttemptOnEmptySolutionEquation({
        userEquationId: args.userEquationId,
        currentResolutionId: args.currentResolutionId,
        subEquationPostfix: args.subEquationPostfix,
        selectedBranch: args.selectedBranch,
        stateUpdated: args.stateUpdated,
      });
    }

    let resultCode: string = RESOLUTION_CODES.STEP_INCORRECT;
    let isCorrect = false;
    const isVariable = isOnlyVariable(args.subEquationPostfix);
    let stepWithoutSolution = false;
    let correctResult: number | undefined;
    let selectedBranch = args.selectedBranch;
    let stateUpdated = args.stateUpdated;

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
    correctResult = knownSolutionEval.correctResult;

    return {
      resultCode,
      isCorrect,
      isVariable,
      stepWithoutSolution,
      correctResult,
      selectedBranch,
      stateUpdated,
    };
  }

  private async evaluateNumericAttemptOnEmptySolutionEquation(args: {
    userEquationId: string;
    currentResolutionId: number;
    subEquationPostfix: string[];
    selectedBranch: string;
    stateUpdated: boolean;
  }): Promise<StepEvaluation> {
    const priorFailures = await this.equationRepository.countEmptySolutionWrongNumericAttempts(
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
  }): Promise<KnownSolutionEvalOutcome> {
    const { isCorrect: matchedIsCorrect, correctResult } = matchAnswerAgainstKnownSolutions(
      args.subEquationPostfix,
      args.solutions,
      args.answerValue
    );
    let isCorrect = matchedIsCorrect;

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

    const stepDecision: KnownStepDecision = args.isVariable
      ? await this.decideKnownVariableResult({
          userEquationId: args.userEquationId,
          currentResolutionId: args.currentResolutionId,
          solutions: args.solutions,
          subEquation: args.subEquation,
          selectedBranch: args.selectedBranch,
          stateUpdated: args.stateUpdated,
          isCorrect,
          correctResult,
        })
      : await this.decideKnownNonVariableResult({
          userEquationId: args.userEquationId,
          currentResolutionId: args.currentResolutionId,
          resolutionStepStatus: args.resolutionStepStatus,
          equationPostfixTokens: args.equationPostfixTokens,
          subEquationPostfix: args.subEquationPostfix,
          subEquation: args.subEquation,
          answerValue: args.answerValue ?? 0,
          isCorrect,
          selectedBranch: args.selectedBranch,
          stateUpdated: args.stateUpdated,
        });

    return { ...stepDecision, correctResult };
  }

  private async decideKnownVariableResult(args: {
    userEquationId: string;
    currentResolutionId: number;
    solutions: number[];
    subEquation: string;
    selectedBranch: string;
    stateUpdated: boolean;
    isCorrect: boolean;
    correctResult?: number;
  }): Promise<KnownStepDecision> {
    if (!args.isCorrect || args.correctResult === undefined) {
      return makeKnownStepDecision(
        RESOLUTION_CODES.RESULT_INCORRECT,
        false,
        args.selectedBranch,
        args.stateUpdated
      );
    }

    const answerValue = args.correctResult;
    const loggedSolutions = await this.equationRepository.getDistinctLoggedSolutions(
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
  }): Promise<KnownStepDecision> {
    if (!args.isCorrect) {
      return makeKnownStepDecision(
        RESOLUTION_CODES.STEP_INCORRECT,
        false,
        args.selectedBranch,
        args.stateUpdated
      );
    }

    const isRepeatedBranchAnswer = await this.hasRepeatedBranchResult(
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
      const previousStep = await this.equationRepository.getPreviousStep(
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
    const newStatus = solved ? EquationStatus.SOLVED : EquationStatus.IN_PROGRESS;

    await this.equationRepository.updateResolutionState(args.userEquationId, {
      status: newStatus,
      currentResolutionId: args.currentResolutionId,
      selectedBranch: args.evaluation.selectedBranch,
    });

    await this.equationRepository.createResolution({
      userEquationId: args.userEquationId,
      resolutionSessionId: args.currentResolutionId,
      subEquation: args.subEquation,
      subEquationInfix: args.subEquationInfix || undefined,
      proposedResult: args.answer,
      resultValue: formatResultValue(args.evaluation.correctResult),
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

    const previousAnswerValues = parseStoredResultValues(previousStep.resultValue);

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
        if (this.equationSidesShareNumericValue(leftVals, rightVals)) return true;
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

  private equationSidesShareNumericValue(leftVals: number[], rightVals: number[]): boolean {
    for (const a of leftVals) {
      for (const b of rightVals) {
        if (Math.abs(a - b) <= DEFAULT_FLOAT_TOLERANCE) return true;
      }
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
    return listContainsElement(parseStoredResultValues(previousStep.resultValue), answerValue);
  }

  async getResolution(userEquationId: string, userId: string) {
    const userEq = await this.equationRepository.findByIdWithEquation(userEquationId);
    if (!userEq || userEq.userId !== userId) return null;
    const currentResolutionId = userEq.currentResolutionId ?? 0;
    const rawSteps = await this.equationRepository.findResolutionsByUserEquation(
      userEquationId,
      currentResolutionId
    );
    const steps = rawSteps.map((step) => {
      const finishAttempt = step.resolutionSide === RESOLUTION_STEP_FINISH_ATTEMPT;
      const infix = step.subEquationInfix?.trim() ?? '';
      return {
        subEquation: step.subEquation,
        proposedResult: step.proposedResult,
        isCorrect: step.isCorrect,
        finishAttempt,
        subEquationLatex:
          finishAttempt || !infix ? undefined : infixToLatex(infix),
        resultLatex: finishAttempt ? undefined : resultToLatex(step.proposedResult),
      };
    });
    const solutionSet = await this.equationRepository.getDistinctLoggedSolutions(
      userEquationId,
      currentResolutionId
    );
    const expectedDistinctSolutionCount = [...new Set(parseSolutionValues(userEq.equation.solutionValues))].length;
    return {
      userEquation: userEq,
      steps,
      solutionSet,
      expectedDistinctSolutionCount,
      currentResolutionId,
    };
  }

  async finishResolution(userEquationId: string, userId: string): Promise<{ code: string; message?: string }> {
    const userEq = await this.equationRepository.findByIdWithEquation(userEquationId);
    if (!userEq) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_EQUATION_NOT_FOUND };
    }
    if (userEq.userId !== userId) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_NO_PERMISSIONS };
    }
    if (userEq.status === EquationStatus.SOLVED) {
      return { code: RESOLUTION_CODES.RESOLUTION_FINISHED };
    }

    const knownSolutions = [...new Set(parseSolutionValues(userEq.equation.solutionValues))];

    const { effectiveResolutionId } = await this.loadEffectiveResolutionSession(userEquationId, userEq);

    const logged = await this.equationRepository.getDistinctLoggedSolutions(
      userEquationId,
      effectiveResolutionId
    );

    const complete = this.isKnownSolutionSetComplete(knownSolutions, logged);

    if (!complete) {
      await this.equationRepository.createResolution({
        userEquationId,
        resolutionSessionId: effectiveResolutionId,
        subEquation: FINISH_ATTEMPT_SUBEQUATION_KEY,
        subEquationInfix: 'Terminar resolución',
        proposedResult: '',
        resultValue: '',
        stepWithoutSolution: false,
        isCorrect: false,
        isVariable: false,
        resolutionSide: RESOLUTION_STEP_FINISH_ATTEMPT,
      });
      await this.syncInProgressResolutionState(
        userEquationId,
        effectiveResolutionId,
        userEq.selectedBranch ?? ''
      );
      return { code: RESOLUTION_CODES.MORE_SOLUTIONS };
    }

    await this.equationRepository.updateResolutionState(userEquationId, {
      status: EquationStatus.SOLVED,
      currentResolutionId: effectiveResolutionId,
      selectedBranch: userEq.selectedBranch ?? '',
    });

    return { code: RESOLUTION_CODES.RESOLUTION_FINISHED };
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
