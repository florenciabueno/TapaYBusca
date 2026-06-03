import { EquationRepository } from './equation.repository.js';
import { EquationStatus } from './equation.types.js';
import {
  RESOLUTION_CODES,
  RESOLUTION_STEP_FINISH_ATTEMPT,
  RESOLUTION_STEP_INVALID_SUBEQUATION_ATTEMPT,
  RESOLUTION_STEP_NO_BRANCH,
  EMPTY_SET,
} from './equation-solver/resolution-constants.js';
import {
  validateSubEquation,
  validateEquivalentEquationStep,
  pickExpressionAndAnswer,
  computeEffectiveResolutionSessionId,
  loggedSolutionDisplayInfix,
  isAbsXSolutionStep,
  formatLoggedStepLatex,
  isAbsXPostfix,
  parseAbsWrappedConstantValue,
} from './equation-solver/resolve-helpers.js';
import { resultToLatex } from './infix-to-latex.js';
import {
  EMPTY_SET_WITHOUT_SUBEQUATION_KEY,
  FINISH_ATTEMPT_SUBEQUATION_KEY,
  formatResultValue,
  initializeSessionState,
  isKnownSolutionSetComplete,
  MESSAGE_RESOLVE_EQUATION_NOT_FOUND,
  MESSAGE_RESOLVE_INVALID_EQUATION,
  MESSAGE_RESOLVE_NO_PERMISSIONS,
  MESSAGE_RESOLVE_SUBEQUATION_REQUIRED,
  needsResolutionStateSync,
  parseEquationPostfix,
  parseSolutionValues,
  parseSubEquationPostfix,
  parseStoredResultValues,
  type ResolutionSessionState,
  type StepEvaluation,
} from './resolution.service.helpers.js';
import {
  evaluateStep,
  isRepeatedSubmittedStep,
} from './resolution-step-evaluation.js';

type ResolveStepPayload = {
  subEquationInfix?: string;
  answer: string;
  resolutionStepStatus: number;
};

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
    const subEquationPostfix = parseSubEquationPostfix(subEquationInfix);
    if (subEquationPostfix.length === 0 && !isEmptySetAnswer) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_SUBEQUATION_REQUIRED };
    }

    const userEq = await this.equationRepository.findByIdWithEquation(userEquationId);
    if (!userEq) return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_EQUATION_NOT_FOUND };
    if (userEq.userId !== userId) return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_RESOLVE_NO_PERMISSIONS };

    const equationPostfixTokens = parseEquationPostfix(userEq.equation);
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

    const knownSolutions = parseSolutionValues(userEq.equation.solutionValues);

    const skipSubequationValidation = isEmptySetAnswer && subEquationPostfix.length === 0;
    const subEquationInfixForStep = skipSubequationValidation ? EMPTY_SET : rawSub;
    const subEquationValid =
      validateSubEquation(equationPostfixTokens, subEquationPostfix) ||
      isAbsXSolutionStep(rawSub, rawAnswer, knownSolutions);
    const equivalentEquationStep =
      !skipSubequationValidation &&
      !subEquationValid &&
      validateEquivalentEquationStep(rawSub, rawAnswer, equationPostfixTokens, knownSolutions);

    if (!skipSubequationValidation && !subEquationValid && !equivalentEquationStep) {
      return this.persistInvalidSubequationAttempt({
        userEquationId,
        userEq,
        session,
        effectiveResolutionId,
        subEquation,
        subEquationInfix: rawSub,
        proposedResult: rawAnswer,
      });
    }

    if (
      await isRepeatedSubmittedStep(
        this.equationRepository,
        userEquationId,
        effectiveResolutionId,
        rawSub,
        rawAnswer
      )
    ) {
      return { code: RESOLUTION_CODES.STEP_REPEATED };
    }

    const evaluation = await evaluateStep(this.equationRepository, {
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
      answer: rawAnswer,
      resolutionStepStatus: payload.resolutionStepStatus,
      evaluation,
    });

    return { code: evaluation.resultCode };
  }

  private async loadEffectiveResolutionSession(
    userEquationId: string,
    userEq: { status: string; currentResolutionId?: number | null; selectedBranch?: string | null }
  ): Promise<{ session: ResolutionSessionState; effectiveResolutionId: number }> {
    const session = initializeSessionState(userEq);
    const maxExistingSession = await this.equationRepository.getMaxResolutionSessionId(userEquationId);
    const effectiveResolutionId = computeEffectiveResolutionSessionId(
      session.currentResolutionId,
      userEq.currentResolutionId ?? 0,
      maxExistingSession
    );
    return { session, effectiveResolutionId };
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
    proposedResult: string;
  }): Promise<{ code: string }> {
    const {
      userEquationId,
      userEq,
      session,
      effectiveResolutionId,
      subEquation,
      subEquationInfix,
      proposedResult,
    } = params;

    if (
      await isRepeatedSubmittedStep(
        this.equationRepository,
        userEquationId,
        effectiveResolutionId,
        subEquationInfix,
        proposedResult
      )
    ) {
      return { code: RESOLUTION_CODES.STEP_REPEATED };
    }

    if (needsResolutionStateSync(session, userEq, effectiveResolutionId)) {
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
      subEquationInfix,
      proposedResult,
      resultValue: '',
      stepWithoutSolution: false,
      isCorrect: false,
      isVariable: false,
      resolutionSide: RESOLUTION_STEP_INVALID_SUBEQUATION_ATTEMPT,
    });
    return { code: RESOLUTION_CODES.SYNTAX_INCORRECT };
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
      resultValue: args.evaluation.resultValue ?? formatResultValue(args.evaluation.correctResult),
      stepWithoutSolution: args.evaluation.stepWithoutSolution,
      isCorrect: args.evaluation.isCorrect,
      isVariable: args.evaluation.isVariable,
      resolutionSide: args.resolutionStepStatus,
    });
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
          finishAttempt || !infix ? undefined : resultToLatex(infix),
        resultLatex:
          finishAttempt || !step.proposedResult.trim()
            ? undefined
            : resultToLatex(step.proposedResult),
      };
    });
    const solutionSet = await this.equationRepository.getDistinctLoggedSolutions(
      userEquationId,
      currentResolutionId
    );
    const solutionSetLatex = this.buildSolutionSetLatex(rawSteps);
    const expectedDistinctSolutionCount = [...new Set(parseSolutionValues(userEq.equation.solutionValues))].length;
    return {
      userEquation: userEq,
      steps,
      solutionSet,
      solutionSetLatex,
      expectedDistinctSolutionCount,
      currentResolutionId,
    };
  }

  private buildSolutionSetLatex(
    steps: Array<{
      subEquationInfix?: string | null;
      proposedResult: string;
      resultValue: string;
      isVariable: boolean;
      isCorrect: boolean;
    }>
  ): string[] {
    const seen = new Set<number>();
    const seenAbsSteps = new Set<string>();
    const out: string[] = [];
    for (const step of steps) {
      if (!step.isVariable || !step.isCorrect) continue;

      const left = step.subEquationInfix ?? '';
      const right = step.proposedResult;
      const subPostfix = parseSubEquationPostfix(left);
      if (isAbsXPostfix(subPostfix)) {
        const absKey = `${left}|${right}`;
        if (seenAbsSteps.has(absKey)) continue;
        seenAbsSteps.add(absKey);
        out.push(formatLoggedStepLatex(left, right));
        continue;
      }

      if (parseAbsWrappedConstantValue(right) !== undefined) {
        const absKey = `${left}|${right}`;
        if (seenAbsSteps.has(absKey)) continue;
        seenAbsSteps.add(absKey);
        out.push(formatLoggedStepLatex(left, right));
        continue;
      }

      const nums = parseStoredResultValues(step.resultValue);
      const num = nums[0];
      if (num === undefined || seen.has(num)) continue;
      seen.add(num);
      const infix = loggedSolutionDisplayInfix(left, right);
      out.push(resultToLatex(infix));
    }
    return out;
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

    if (logged.length === 0) {
      return this.resolveStep(userEquationId, userId, {
        subEquationInfix: undefined,
        answer: EMPTY_SET,
        resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
      });
    }

    const complete = isKnownSolutionSetComplete(knownSolutions, logged);

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
