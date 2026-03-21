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
  evaluatePostfixWithVariable,
  getSubEquationResult,
  checkStepHasSolution,
  isOnlyVariable,
  isQuadratic,
  listContainsElement,
} from './equation-solver/resolve-helpers.js';
import { infixToLatex, resultToLatex } from './infix-to-latex.js';

const RESULT_VALUE_SEPARATOR = ';';

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
    payload: {
      subEquationPostfix?: string[];
      subEquationInfix?: string;
      answer: string;
      resolutionStepStatus: number;
    }
  ): Promise<{ code: string; message?: string }> {
    let subEquationPostfix = payload.subEquationPostfix;
    if (
      !subEquationPostfix?.length &&
      typeof payload.subEquationInfix === 'string' &&
      payload.subEquationInfix.trim()
    ) {
      const tokens = tokenizeInfix(payload.subEquationInfix.trim());
      const postfix = infixToPostfix(tokens);
      subEquationPostfix = postfix ?? [];
    }
    if (!subEquationPostfix?.length) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: 'Subequation is required' };
    }
    const { answer, resolutionStepStatus } = payload;

    const userEq = await this.equationRepository.findByIdWithEquation(userEquationId);
    if (!userEq) return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: 'Equation not found' };
    if (userEq.userId !== userId) return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: 'No permissions' };

    const equation = userEq.equation;
    const infix = equation.infixExpression ?? equation.postfixExpression ?? '';
    const equationPostfixTokens = infixToPostfix(tokenizeInfix(infix));
    if (!equationPostfixTokens) return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: 'Invalid equation' };

    if (validateSubEquation(equationPostfixTokens, subEquationPostfix)) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT };
    }

    const solutions = parseSolutionValues(equation.solutionValues);
    let stateUpdated = false;
    let currentResolutionId = userEq.currentResolutionId ?? 0;
    let selectedBranch = userEq.selectedBranch ?? '';

    if (userEq.status === EquationStatus.NOT_STARTED || userEq.status === EquationStatus.SOLVED) {
      currentResolutionId += 1;
      stateUpdated = true;
    }

    const subEquation = subEquationPostfix.join('');
    const loggedSteps = await this.equationRepository.findResolutionsByUserEquation(
      userEquationId,
      currentResolutionId
    );
    if (loggedSteps.length > 0) {
      const last = loggedSteps[loggedSteps.length - 1]!;
      if (last.subEquation === subEquation && last.proposedResult === answer) {
        return { code: RESOLUTION_CODES.STEP_REPEATED };
      }
    }

    let resultCode: string = RESOLUTION_CODES.STEP_INCORRECT;
    let isCorrect = false;
    let isVariable = isOnlyVariable(subEquationPostfix);
    let stepWithoutSolution = false;
    const correctResults: number[] = [];

    if (answer === EMPTY_SET) {
      const loggedResolutions = await this.equationRepository.findResolutionsByUserEquation(
        userEquationId,
        currentResolutionId
      );
      if (loggedResolutions.length === 0) {
        const { hasSolution } = checkStepHasSolution(equationPostfixTokens, subEquationPostfix);
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
    } else {
      let localResultCode: string = RESOLUTION_CODES.STEP_INCORRECT;
      const answers = parseAnswerValues(answer);
      if (solutions.length > 0) {
        for (const resultado of solutions) {
          const evaluation = evaluatePostfixWithVariable(resultado, subEquationPostfix, false);
          for (const valResp of answers) {
            if (listContainsElement(evaluation, valResp)) {
              isCorrect = true;
              correctResults.push(valResp);
              break;
            }
          }
        }
        if (isCorrect && !isVariable) {
          const previousStepIsValid = await this.isPreviousStepValid(
            userEquationId,
            currentResolutionId,
            subEquationPostfix,
            answers[0] ?? 0,
            resolutionStepStatus
          );
          if (!previousStepIsValid) isCorrect = false;
        }
        if (isVariable) {
          if (!isCorrect) {
            localResultCode = RESOLUTION_CODES.RESULT_INCORRECT;
          } else {
            const loggedSolutions = await this.equationRepository.getDistinctLoggedSolutions(
              userEquationId,
              currentResolutionId
            );
            const solutionSet = [...new Set(solutions)];
            localResultCode = RESOLUTION_CODES.RESULT_CORRECT;
            for (const valResp of correctResults) {
              if (loggedSolutions.some((s) => Math.abs(s - valResp) <= 1e-9)) {
                localResultCode = RESOLUTION_CODES.RESULT_REPEATED;
                break;
              }
              if (loggedSolutions.length + 1 === solutionSet.length) {
                localResultCode = RESOLUTION_CODES.RESOLUTION_FINISHED;
                break;
              }
              if (selectedBranch.length === 0) {
                selectedBranch = subEquation;
                stateUpdated = true;
              }
              break;
            }
          }
        } else if (isCorrect) {
          const isRepeatedBranchAnswer = await this.hasRepeatedBranchResult(
            userEquationId,
            currentResolutionId,
            resolutionStepStatus,
            answers[0] ?? 0
          );
          if (isRepeatedBranchAnswer) {
            localResultCode = RESOLUTION_CODES.RESULT_REPEATED;
            isCorrect = false;
          } else {
            const originalEquationPostfix = equationPostfixTokens;
            if (
              resolutionStepStatus === RESOLUTION_STEP_NO_BRANCH &&
              isQuadratic(originalEquationPostfix, subEquationPostfix)
            ) {
              const previousStep = await this.equationRepository.getPreviousStep(
                userEquationId,
                currentResolutionId,
                false,
                resolutionStepStatus
              );
              if (!previousStep) {
                localResultCode = RESOLUTION_CODES.MORE_SOLUTIONS;
                selectedBranch = subEquation;
                stateUpdated = true;
              } else {
                localResultCode = RESOLUTION_CODES.STEP_CORRECT;
              }
            } else {
              localResultCode = RESOLUTION_CODES.STEP_CORRECT;
            }
          }
        } else {
          localResultCode = RESOLUTION_CODES.STEP_INCORRECT;
        }
        resultCode = localResultCode;
      } else {
        const resultsToValidate = getSubEquationResult(
          equationPostfixTokens,
          subEquationPostfix,
          'x',
          false
        );
        if (resultsToValidate.length > 0) {
          let found = false;
          for (const valRes of answers) {
            if (listContainsElement(resultsToValidate, valRes)) {
              isCorrect = true;
              correctResults.push(valRes);
              resultCode = RESOLUTION_CODES.STEP_CORRECT;
              found = true;
              break;
            }
          }
          if (!found) resultCode = RESOLUTION_CODES.STEP_INCORRECT;
          if (isVariable && isCorrect && resultsToValidate.length === 1) {
            resultCode = RESOLUTION_CODES.RESOLUTION_FINISHED;
          }
        } else {
          stepWithoutSolution = true;
          const attemptsCount = await this.equationRepository.countStepsWithoutSolution(
            userEquationId,
            currentResolutionId
          );
          if (attemptsCount + 1 === 3) resultCode = RESOLUTION_CODES.FIRST_WARNING;
          else if (attemptsCount + 1 === 5) resultCode = RESOLUTION_CODES.NO_SOLUTION;
          else resultCode = RESOLUTION_CODES.STEP_INCORRECT;
        }
      }
    }

    const newStatus =
      resultCode === RESOLUTION_CODES.RESOLUTION_FINISHED ||
      resultCode === RESOLUTION_CODES.NO_SOLUTION
        ? EquationStatus.SOLVED
        : EquationStatus.IN_PROGRESS;
    if (
      resultCode === RESOLUTION_CODES.RESOLUTION_FINISHED ||
      resultCode === RESOLUTION_CODES.NO_SOLUTION
    ) {
      stateUpdated = true;
    }

    if (stateUpdated) {
      await this.equationRepository.updateResolutionState(userEquationId, {
        status: newStatus,
        currentResolutionId,
        selectedBranch,
      });
    }

    await this.equationRepository.createResolution({
      userEquationId,
      resolutionSessionId: currentResolutionId,
      subEquation,
      subEquationInfix: payload.subEquationInfix?.trim() || undefined,
      proposedResult: answer,
      resultValue: formatResultValue(correctResults),
      stepWithoutSolution,
      isCorrect,
      isVariable,
      resolutionSide: resolutionStepStatus,
    });

    return { code: resultCode };
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
    const replaced = this.replaceSubListInPostfix(
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

  private replaceSubListInPostfix(original: string[], subList: string[], replacement: string): string[] | null {
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
      if (match) return [...original.slice(0, i), replacement, ...original.slice(i + m)];
    }
    return null;
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
