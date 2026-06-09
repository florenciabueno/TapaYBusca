import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import { EquationStatus } from '../src/modules/equations/equation.types.js';
import {
  EMPTY_SET,
  RESOLUTION_CODES,
  RESOLUTION_STEP_NO_BRANCH,
  RESOLUTION_STEP_FINISH_ATTEMPT,
  RESOLUTION_STEP_INVALID_SUBEQUATION_ATTEMPT,
} from '../src/modules/equations/equation-solver/resolution-constants.js';
import { tokenizeInfix } from '../src/modules/equations/equation-solver/tokenizer.js';
import { normalizeUserInfix, stripUnaryPlus } from '../src/modules/equations/equation-solver/user-infix-normalize.js';
import { infixToPostfix } from '../src/modules/equations/equation-solver/infix-to-postfix.js';
import { postfixToTree } from '../src/modules/equations/equation-solver/postfix-to-tree.js';
import {
  computeEffectiveResolutionSessionId,
  replaceSubListInPostfix,
  validateSubEquation,
  validateEquivalentEquationStep,
  loggedSolutionDisplayInfix,
} from '../src/modules/equations/equation-solver/resolve-helpers.js';
import { ResolutionService } from '../src/modules/equations/resolution.service.js';
import {
  hasRepeatedBranchResult,
  isPreviousStepValid,
} from '../src/modules/equations/resolution-step-evaluation.js';

vi.mock('../src/modules/equations/equation.repository.js', () => {
  const findByIdWithEquation = vi.fn();
  const findResolutionsByUserEquation = vi.fn();
  const updateResolutionState = vi.fn();
  const createResolution = vi.fn();
  const getDistinctLoggedSolutions = vi.fn();
  const getPreviousStep = vi.fn();
  const countStepsWithoutSolution = vi.fn();
  const countEmptySolutionWrongNumericAttempts = vi.fn();
  const canUserModify = vi.fn();
  const deleteResolutionsByUserEquation = vi.fn();
  const getMaxResolutionSessionId = vi.fn();

  return {
    EquationRepository: class MockEquationRepository {
      findByIdWithEquation = findByIdWithEquation;
      findResolutionsByUserEquation = findResolutionsByUserEquation;
      updateResolutionState = updateResolutionState;
      createResolution = createResolution;
      getDistinctLoggedSolutions = getDistinctLoggedSolutions;
      getPreviousStep = getPreviousStep;
      countStepsWithoutSolution = countStepsWithoutSolution;
      countEmptySolutionWrongNumericAttempts = countEmptySolutionWrongNumericAttempts;
      canUserModify = canUserModify;
      deleteResolutionsByUserEquation = deleteResolutionsByUserEquation;
      getMaxResolutionSessionId = getMaxResolutionSessionId;
    },
    __resolutionRepoMocks: {
      findByIdWithEquation,
      findResolutionsByUserEquation,
      updateResolutionState,
      createResolution,
      getDistinctLoggedSolutions,
      getPreviousStep,
      countStepsWithoutSolution,
      countEmptySolutionWrongNumericAttempts,
      canUserModify,
      deleteResolutionsByUserEquation,
      getMaxResolutionSessionId,
    },
  };
});

import app from '../src/app.js';
const repoModule = await import('../src/modules/equations/equation.repository.js');
const repoMocks = (repoModule as { __resolutionRepoMocks?: Record<string, ReturnType<typeof vi.fn>> })
  .__resolutionRepoMocks!;

const DEFAULT_EQUATIONS = {
  linear: 'x+5=12',
  quadratic: 'pot2(x+2)+10=26',
  noRealSolution: '((pot2(x)+9)/(5))=1',
} as const;

function createAuthToken(userId: string = 'test-user-id'): string {
  return jwt.sign({ userId, email: 'test@example.com' }, config.jwtSecret, { expiresIn: '1h' });
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function toPostfixTokens(infix: string): string[] {
  const postfix = infixToPostfix(tokenizeInfix(infix));
  if (!postfix) throw new Error(`No se pudo convertir a postfix: ${infix}`);
  return postfix;
}

function makeUserEquation(
  overrides: Partial<{
    id: string;
    userId: string;
    status: EquationStatus;
    currentResolutionId: number;
    selectedBranch: string;
    equation: { infixExpression: string; postfixExpression?: string; solutionValues?: unknown };
  }> = {}
) {
  return {
    id: 'ue-1',
    userId: 'test-user-id',
    status: EquationStatus.NOT_STARTED,
    currentResolutionId: 0,
    selectedBranch: '',
    equation: {
      infixExpression: DEFAULT_EQUATIONS.linear,
      postfixExpression: DEFAULT_EQUATIONS.linear,
      solutionValues: [7],
    },
    ...overrides,
  };
}

describe('Equation resolver API', () => {
  const token = createAuthToken();

  beforeEach(() => {
    vi.clearAllMocks();
    repoMocks.findByIdWithEquation.mockResolvedValue(makeUserEquation());
    repoMocks.findResolutionsByUserEquation.mockResolvedValue([]);
    repoMocks.updateResolutionState.mockResolvedValue(undefined);
    repoMocks.createResolution.mockResolvedValue(undefined);
    repoMocks.getDistinctLoggedSolutions.mockResolvedValue([]);
    repoMocks.getPreviousStep.mockResolvedValue(null);
    repoMocks.countStepsWithoutSolution.mockResolvedValue(0);
    repoMocks.countEmptySolutionWrongNumericAttempts.mockImplementation(async () => {
      const calls = repoMocks.createResolution.mock.calls as Array<
        [
          {
            stepWithoutSolution?: boolean;
            isCorrect?: boolean;
            resolutionSide?: number;
          },
        ]
      >;
      return calls.filter(
        (c) =>
          c[0]?.stepWithoutSolution === true &&
          c[0]?.isCorrect === false &&
          c[0]?.resolutionSide === RESOLUTION_STEP_NO_BRANCH
      ).length;
    });
    repoMocks.canUserModify.mockResolvedValue(true);
    repoMocks.deleteResolutionsByUserEquation.mockResolvedValue(undefined);
    repoMocks.getMaxResolutionSessionId.mockResolvedValue(0);
  });

  describe('POST /api/equations/:id/resolve', () => {
    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .send({ subEquationInfix: 'x', answer: '7', resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('returns SI when subEquation is not provided', async () => {
      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({ answer: '7', resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        code: RESOLUTION_CODES.SYNTAX_INCORRECT,
        message: 'La ecuación equivalente es obligatoria',
      });
    });

    it('accepts variable side in the answer field (constant first, expression second)', async () => {
      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: '7',
          answer: 'x',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect([RESOLUTION_CODES.RESULT_CORRECT, RESOLUTION_CODES.PENDING_FINISH]).toContain(response.body.code);
    });

    it('accepts an equivalent equation after multiplying both sides by -1', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: 'x+5=10',
            postfixExpression: 'x+5=10',
            solutionValues: [5],
          },
        })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: '-x-5',
          answer: '-10',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(RESOLUTION_CODES.STEP_CORRECT);
      expect(repoMocks.createResolution).toHaveBeenCalledWith(
        expect.objectContaining({
          subEquationInfix: '-x-5',
          proposedResult: '-10',
          isCorrect: true,
        })
      );
    });

    it('returns SI when equation does not exist', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/equations/ue-404/resolve')
        .set(authHeader(token))
        .send({ subEquationInfix: 'x', answer: '7', resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        code: RESOLUTION_CODES.SYNTAX_INCORRECT,
        message: 'Ecuación no encontrada.',
      });
    });

    it('returns SI when the user has no permission over equation', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({ userId: 'another-user-id' })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({ subEquationInfix: 'x', answer: '7', resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        code: RESOLUTION_CODES.SYNTAX_INCORRECT,
        message: 'No tienes permisos para resolver esta ecuación.',
      });
    });

    it('returns SI when stored equation infix is invalid', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: '(x+5=12',
            postfixExpression: '(x+5=12',
            solutionValues: [],
          },
        })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({ subEquationInfix: 'x', answer: '7', resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        code: RESOLUTION_CODES.SYNTAX_INCORRECT,
        message: 'La ecuación almacenada es inválida.',
      });
    });

    it('returns SI when subEquation is not part of the equation', async () => {
      const subEquationPostfix = toPostfixTokens('x+99');

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x+99',
          answer: '7',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.SYNTAX_INCORRECT });
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith(
        'ue-1',
        expect.objectContaining({
          status: EquationStatus.IN_PROGRESS,
          currentResolutionId: 1,
        })
      );
      expect(repoMocks.createResolution).toHaveBeenCalledWith(
        expect.objectContaining({
          userEquationId: 'ue-1',
          resolutionSessionId: 1,
          subEquation: subEquationPostfix.join(''),
          subEquationInfix: 'x+99',
          proposedResult: '7',
          isCorrect: false,
          resolutionSide: RESOLUTION_STEP_INVALID_SUBEQUATION_ATTEMPT,
        })
      );
    });

    it('returns PR when invalid subequation attempt is repeated', async () => {
      const subEquationPostfix = toPostfixTokens('x+99');
      repoMocks.findResolutionsByUserEquation.mockResolvedValue([
        {
          subEquation: subEquationPostfix.join(''),
          subEquationInfix: 'x+99',
          proposedResult: '7',
        },
      ]);

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x+99',
          answer: '7',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(RESOLUTION_CODES.STEP_REPEATED);
      expect(repoMocks.createResolution).not.toHaveBeenCalled();
    });

    it('logs invalid subequation in the same session when currentResolutionId lags behind stored steps', async () => {
      const subEquationPostfix = toPostfixTokens('x+99');
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          status: EquationStatus.IN_PROGRESS,
          currentResolutionId: 0,
        })
      );
      repoMocks.getMaxResolutionSessionId.mockResolvedValue(2);

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x+99',
          answer: '7',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.SYNTAX_INCORRECT });
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith(
        'ue-1',
        expect.objectContaining({
          status: EquationStatus.IN_PROGRESS,
          currentResolutionId: 2,
        })
      );
      expect(repoMocks.createResolution).toHaveBeenCalledWith(
        expect.objectContaining({
          resolutionSessionId: 2,
          subEquation: subEquationPostfix.join(''),
          resolutionSide: RESOLUTION_STEP_INVALID_SUBEQUATION_ATTEMPT,
        })
      );
    });

    it('returns PR when the step is repeated', async () => {
      const subEquationInfix = 'x+5';
      const subEquationPostfix = toPostfixTokens(subEquationInfix);
      repoMocks.findResolutionsByUserEquation.mockResolvedValue([
        {
          subEquation: subEquationPostfix.join(''),
          subEquationInfix,
          proposedResult: '7',
        },
      ]);

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix,
          answer: '7',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.STEP_REPEATED });
      expect(repoMocks.createResolution).not.toHaveBeenCalled();
    });

    it('returns PR when the step matches an earlier logged step, not only the last one', async () => {
      const firstStepInfix = 'x+5';
      const firstStepPostfix = toPostfixTokens(firstStepInfix);
      const secondStepInfix = 'x';
      const secondStepPostfix = toPostfixTokens(secondStepInfix);
      repoMocks.findResolutionsByUserEquation.mockResolvedValue([
        {
          subEquation: firstStepPostfix.join(''),
          subEquationInfix: firstStepInfix,
          proposedResult: '7',
        },
        {
          subEquation: secondStepPostfix.join(''),
          subEquationInfix: secondStepInfix,
          proposedResult: '2',
        },
      ]);

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: firstStepInfix,
          answer: '7',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.STEP_REPEATED });
      expect(repoMocks.createResolution).not.toHaveBeenCalled();
    });

    it('persists correct step in max resolution session when currentResolutionId lags in DB', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          status: EquationStatus.IN_PROGRESS,
          currentResolutionId: 0,
        })
      );
      repoMocks.getMaxResolutionSessionId.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x',
          answer: '7',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.PENDING_FINISH });
      expect(repoMocks.createResolution).toHaveBeenCalledWith(
        expect.objectContaining({
          resolutionSessionId: 1,
        })
      );
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith(
        'ue-1',
        expect.objectContaining({
          currentResolutionId: 1,
        })
      );
    });

    it('returns PF for a correct variable answer when the conjunto solución está completo en el paso (default linear equation)', async () => {
      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x',
          answer: '7',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.PENDING_FINISH });
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith('ue-1', {
        status: EquationStatus.IN_PROGRESS,
        currentResolutionId: 1,
        selectedBranch: '',
      });
      expect(repoMocks.createResolution).toHaveBeenCalledWith(
        expect.objectContaining({
          userEquationId: 'ue-1',
          proposedResult: '7',
          isCorrect: true,
          isVariable: true,
          stepWithoutSolution: false,
          resolutionSide: RESOLUTION_STEP_NO_BRANCH,
        })
      );
    });

    it('returns RI when answer is empty-set and the step has solutions', async () => {
      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x',
          answer: EMPTY_SET,
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESULT_INCORRECT });
    });

    it('returns RI for empty-set when there are already logged steps in the session', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({ status: EquationStatus.IN_PROGRESS, currentResolutionId: 3 })
      );
      repoMocks.findResolutionsByUserEquation.mockResolvedValue([
        { subEquation: 'x', proposedResult: '7' },
      ]);

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x',
          answer: EMPTY_SET,
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESULT_INCORRECT });
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith('ue-1', {
        status: EquationStatus.IN_PROGRESS,
        currentResolutionId: 3,
        selectedBranch: '',
      });
    });

    it('returns RT when equation has no precalculated solutions and empty-set is correct', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: DEFAULT_EQUATIONS.noRealSolution,
            postfixExpression: DEFAULT_EQUATIONS.noRealSolution,
            solutionValues: [],
          },
        })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x',
          answer: EMPTY_SET,
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESOLUTION_FINISHED });
      expect(repoMocks.createResolution).toHaveBeenCalled();
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith('ue-1', {
        status: EquationStatus.SOLVED,
        currentResolutionId: 1,
        selectedBranch: '',
      });
    });

    it('returns RT when empty-set is correct without subequation (no real solutions)', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: DEFAULT_EQUATIONS.noRealSolution,
            postfixExpression: DEFAULT_EQUATIONS.noRealSolution,
            solutionValues: [],
          },
        })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          answer: EMPTY_SET,
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESOLUTION_FINISHED });
    });

    it('returns RT for empty-set with subequation when equation has no real solutions (any moment)', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: 'pot2(x)+1=0',
            postfixExpression: 'pot2(x)+1=0',
            solutionValues: [],
          },
        })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'pot2(x)',
          answer: EMPTY_SET,
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESOLUTION_FINISHED });
    });

    it('empty-solution equation: six wrong numeric answers on x → PI, PI, PA, PI, PI, SS and session solved', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: 'pot2(x)+1=0',
            postfixExpression: 'pot2(x)+1=0',
            solutionValues: [],
          },
        })
      );
      const codes: string[] = [];
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/equations/ue-1/resolve')
          .set(authHeader(token))
          .send({
            subEquationInfix: 'x',
            answer: String(i + 2),
            resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
          });
        expect(response.status).toBe(200);
        codes.push(response.body.code);
      }
      expect(codes).toEqual([
        RESOLUTION_CODES.STEP_INCORRECT,
        RESOLUTION_CODES.STEP_INCORRECT,
        RESOLUTION_CODES.FIRST_WARNING,
        RESOLUTION_CODES.STEP_INCORRECT,
        RESOLUTION_CODES.STEP_INCORRECT,
        RESOLUTION_CODES.NO_SOLUTION,
      ]);
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith(
        'ue-1',
        expect.objectContaining({ status: EquationStatus.SOLVED })
      );
      const lastCreate = repoMocks.createResolution.mock.calls.at(-1)?.[0] as {
        isCorrect?: boolean;
        proposedResult?: string;
      };
      expect(lastCreate).toMatchObject({ proposedResult: '7', isCorrect: false });
    });

    it('empty-solution equation: PA on 3rd wrong counts across subequations (pot2(x) vs x)', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: 'pot2(x)+1=0',
            postfixExpression: 'pot2(x)+1=0',
            solutionValues: [],
          },
        })
      );
      const steps = [
        { subEquationInfix: 'pot2(x)', answer: '3' },
        { subEquationInfix: 'x', answer: '5' },
        { subEquationInfix: 'pot2(x)', answer: '7' },
      ];
      const codes: string[] = [];
      for (const step of steps) {
        const response = await request(app)
          .post('/api/equations/ue-1/resolve')
          .set(authHeader(token))
          .send({ ...step, resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH });
        expect(response.status).toBe(200);
        codes.push(response.body.code);
      }
      expect(codes).toEqual([
        RESOLUTION_CODES.STEP_INCORRECT,
        RESOLUTION_CODES.STEP_INCORRECT,
        RESOLUTION_CODES.FIRST_WARNING,
      ]);
    });

    it('empty-solution equation: correct intermediate non-variable step returns PC', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: 'pot2(x)+8=-8',
            postfixExpression: 'pot2(x)+8=-8',
            solutionValues: [],
          },
        })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'pot2(x)',
          answer: '-16',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.STEP_CORRECT });
      const created = repoMocks.createResolution.mock.calls[0]?.[0] as {
        isCorrect?: boolean;
        stepWithoutSolution?: boolean;
      };
      expect(created).toMatchObject({ isCorrect: true, stepWithoutSolution: false });
    });

    it('empty-solution equation: wrong intermediate step is still counted toward warnings', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: 'pot2(x)+8=-8',
            postfixExpression: 'pot2(x)+8=-8',
            solutionValues: [],
          },
        })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'pot2(x)',
          answer: '5',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.STEP_INCORRECT });
      const created = repoMocks.createResolution.mock.calls[0]?.[0] as {
        isCorrect?: boolean;
        stepWithoutSolution?: boolean;
      };
      expect(created).toMatchObject({ isCorrect: false, stepWithoutSolution: true });
    });

    it('empty-solution equation: correct intermediate step then empty-set completes resolution', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: 'pot2(x)+8=-8',
            postfixExpression: 'pot2(x)+8=-8',
            solutionValues: [],
          },
        })
      );

      const step1 = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'pot2(x)',
          answer: '-16',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });
      expect(step1.status).toBe(200);
      expect(step1.body).toEqual({ code: RESOLUTION_CODES.STEP_CORRECT });

      const step2 = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x',
          answer: EMPTY_SET,
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });
      expect(step2.status).toBe(200);
      expect(step2.body).toEqual({ code: RESOLUTION_CODES.RESOLUTION_FINISHED });
      expect(repoMocks.updateResolutionState).toHaveBeenLastCalledWith(
        'ue-1',
        expect.objectContaining({ status: EquationStatus.SOLVED })
      );
    });

    it('empty-solution equation: correct intermediate step does not count toward wrong-answer warnings', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: 'pot2(x)+8=-8',
            postfixExpression: 'pot2(x)+8=-8',
            solutionValues: [],
          },
        })
      );

      const steps = [
        { subEquationInfix: 'pot2(x)', answer: '-16' }, // correct intermediate → PC, not counted
        { subEquationInfix: 'x', answer: '5' },          // wrong on x → PI (1st failure)
        { subEquationInfix: 'x', answer: '6' },          // wrong on x → PI (2nd failure)
        { subEquationInfix: 'x', answer: '7' },          // wrong on x → PA (3rd failure)
      ];
      const codes: string[] = [];
      for (const step of steps) {
        const response = await request(app)
          .post('/api/equations/ue-1/resolve')
          .set(authHeader(token))
          .send({ ...step, resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH });
        expect(response.status).toBe(200);
        codes.push(response.body.code);
      }
      expect(codes).toEqual([
        RESOLUTION_CODES.STEP_CORRECT,
        RESOLUTION_CODES.STEP_INCORRECT,
        RESOLUTION_CODES.STEP_INCORRECT,
        RESOLUTION_CODES.FIRST_WARNING,
      ]);
    });

    it('returns RI when empty-set without subequation but equation has known solutions', async () => {
      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          answer: EMPTY_SET,
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESULT_INCORRECT });
    });

    it('returns PC for first correct non-variable quadratic branch step (sin mensaje MS hasta finalizar)', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: DEFAULT_EQUATIONS.quadratic,
            postfixExpression: DEFAULT_EQUATIONS.quadratic,
            solutionValues: [2, -6],
          },
        })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x+2',
          answer: '4',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.STEP_CORRECT });
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith('ue-1', {
        status: EquationStatus.IN_PROGRESS,
        currentResolutionId: 1,
        selectedBranch: toPostfixTokens('x+2').join(''),
      });
    });

    it('returns PC for quadratic branch when there is a previous correct step', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: DEFAULT_EQUATIONS.quadratic,
            postfixExpression: DEFAULT_EQUATIONS.quadratic,
            solutionValues: [2, -6],
          },
        })
      );
      repoMocks.getPreviousStep
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 10, resultValue: '4' });

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x+2',
          answer: '4',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.STEP_CORRECT });
    });

    it('returns RC for correct variable result when more solutions remain', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: DEFAULT_EQUATIONS.quadratic,
            postfixExpression: DEFAULT_EQUATIONS.quadratic,
            solutionValues: [2, -6],
          },
        })
      );
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x',
          answer: '2',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESULT_CORRECT });
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith('ue-1', {
        status: EquationStatus.IN_PROGRESS,
        currentResolutionId: 1,
        selectedBranch: 'x',
      });
    });

    it('returns RR when a variable solution was already logged', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: DEFAULT_EQUATIONS.quadratic,
            postfixExpression: DEFAULT_EQUATIONS.quadratic,
            solutionValues: [2, -6],
          },
        })
      );
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([2]);

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x',
          answer: '2',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESULT_REPEATED });
      expect(repoMocks.createResolution).toHaveBeenCalledWith(
        expect.objectContaining({ isCorrect: false, isVariable: true })
      );
    });

    it('accepts explicit positive answer +7 for x-3=4', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: 'x-3=4',
            postfixExpression: 'x-3=4',
            solutionValues: [7],
          },
        })
      );
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x',
          answer: '+7',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(RESOLUTION_CODES.PENDING_FINISH);
      expect(repoMocks.createResolution).toHaveBeenCalledWith(
        expect.objectContaining({ isCorrect: true, isVariable: true, proposedResult: '+7' })
      );
    });

    it('returns RR and rejects step when -7 repeats a logged 9-16 solution', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: 'x+16=9',
            postfixExpression: 'x+16=9',
            solutionValues: [-7],
          },
        })
      );
      repoMocks.getDistinctLoggedSolutions.mockResolvedValueOnce([]).mockResolvedValueOnce([-7]);

      const first = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x',
          answer: '9-16',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(first.status).toBe(200);
      expect(first.body.code).toBe(RESOLUTION_CODES.PENDING_FINISH);

      const second = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x',
          answer: '-7',
          resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH,
        });

      expect(second.status).toBe(200);
      expect(second.body).toEqual({ code: RESOLUTION_CODES.RESULT_REPEATED });
      expect(repoMocks.createResolution).toHaveBeenLastCalledWith(
        expect.objectContaining({ isCorrect: false, isVariable: true, proposedResult: '-7' })
      );
    });

    it('returns RR on repeated branch answer for non-variable step', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: DEFAULT_EQUATIONS.quadratic,
            postfixExpression: DEFAULT_EQUATIONS.quadratic,
            solutionValues: [2, -6],
          },
        })
      );
      repoMocks.getPreviousStep
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 99, resultValue: '4' });

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({
          subEquationInfix: 'x+2',
          answer: '4',
          resolutionStepStatus: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESULT_REPEATED });
    });

    it('rejects a step that uses a different variable than the equation', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: { infixExpression: 'y+5=12', postfixExpression: 'y+5=12', solutionValues: [7] },
        })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({ subEquationInfix: 'x', answer: '7', resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH });

      expect(response.body.code).toBe(RESOLUTION_CODES.SYNTAX_INCORRECT);
    });

    it('accepts a step with the equation variable letter', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          equation: { infixExpression: 'y+5=12', postfixExpression: 'y+5=12', solutionValues: [7] },
        })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/resolve')
        .set(authHeader(token))
        .send({ subEquationInfix: 'y', answer: '7', resolutionStepStatus: RESOLUTION_STEP_NO_BRANCH });

      expect(response.body.code).toBe(RESOLUTION_CODES.PENDING_FINISH);
    });
  });
});

describe('postfixToTree (coverage on existing test file)', () => {
  it('builds a binary tree for a simple valid postfix equation', () => {
    const tree = postfixToTree(['x', '5', '+']);

    expect(tree).toMatchObject({
      type: 'OPERATOR_BINARY',
      value: '+',
      left: { type: 'VARIABLE', value: 'x' },
      right: { type: 'NUMBER', value: '5' },
    });
  });

  it('returns null for unknown token', () => {
    expect(postfixToTree(['x', '?'])).toBeNull();
  });

  it('returns null when binary operator has insufficient operands', () => {
    expect(postfixToTree(['+'])).toBeNull();
  });

  it('returns null when unary operator has insufficient operands', () => {
    expect(postfixToTree(['sqrt'])).toBeNull();
  });

  it('maps special unary powers to equivalent nodes', () => {
    const minusOne = postfixToTree(['x', 'pot_1']);
    expect(minusOne).toMatchObject({
      type: 'OPERATOR_BINARY',
      value: '/',
      left: { type: 'NUMBER', value: '1' },
      right: { type: 'VARIABLE', value: 'x' },
    });

    const minusTwo = postfixToTree(['x', 'pot_2']);
    expect(minusTwo).toMatchObject({
      type: 'OPERATOR_BINARY',
      value: '/',
      left: { type: 'NUMBER', value: '1' },
      right: { type: 'OPERATOR_UNARY', value: 'pot2' },
    });

    const minusThree = postfixToTree(['x', 'pot_3']);
    expect(minusThree).toMatchObject({
      type: 'OPERATOR_BINARY',
      value: '/',
      left: { type: 'NUMBER', value: '1' },
      right: { type: 'OPERATOR_UNARY', value: 'pot3' },
    });
  });

  it('maps half and third powers to roots', () => {
    const half = postfixToTree(['x', 'pot1_2']);
    expect(half).toMatchObject({
      type: 'OPERATOR_UNARY',
      value: 'sqrt',
      right: { type: 'VARIABLE', value: 'x' },
    });

    const third = postfixToTree(['x', 'pot1_3']);
    expect(third).toMatchObject({
      type: 'OPERATOR_UNARY',
      value: 'cbrt',
      right: { type: 'VARIABLE', value: 'x' },
    });
  });

  it('supports regular unary operators and numeric leaves', () => {
    const tree = postfixToTree(['-3.5', '~']);
    expect(tree).toMatchObject({
      type: 'OPERATOR_UNARY',
      value: '~',
      right: { type: 'NUMBER', value: '-3.5' },
    });
  });

  it('returns null when stack does not end with a single root node', () => {
    expect(postfixToTree(['2', '3'])).toBeNull();
  });

  it('treats empty and standalone minus tokens as invalid numbers', () => {
    expect(postfixToTree([''])).toBeNull();
    expect(postfixToTree(['-'])).toBeNull();
  });
});

describe('Equation resolution lifecycle endpoints', () => {
  const token = createAuthToken();

  beforeEach(() => {
    vi.clearAllMocks();
    repoMocks.findByIdWithEquation.mockResolvedValue(makeUserEquation({ currentResolutionId: 2 }));
    repoMocks.findResolutionsByUserEquation.mockResolvedValue([]);
    repoMocks.getDistinctLoggedSolutions.mockResolvedValue([]);
    repoMocks.canUserModify.mockResolvedValue(true);
    repoMocks.deleteResolutionsByUserEquation.mockResolvedValue(undefined);
    repoMocks.updateResolutionState.mockResolvedValue(undefined);
  });

  describe('GET /api/equations/:id/resolution', () => {
    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).get('/api/equations/ue-1/resolution');
      expect(response.status).toBe(401);
    });

    it('returns 404 when equation is not found for user', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/equations/ue-404/resolution')
        .set(authHeader(token));

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 200 and maps latex values for step and result', async () => {
      repoMocks.findResolutionsByUserEquation.mockResolvedValue([
        {
          subEquation: 'x',
          subEquationInfix: 'sqrt(x+5)',
          proposedResult: '{}',
          isCorrect: false,
        },
        {
          subEquation: 'x',
          subEquationInfix: 'x+2',
          proposedResult: '3/4',
          isCorrect: true,
        },
      ]);
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([2, -6]);

      const response = await request(app)
        .get('/api/equations/ue-1/resolution')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.currentResolutionId).toBe(2);
      expect(response.body.steps[0]).toMatchObject({
        subEquation: 'x',
        isCorrect: false,
        subEquationLatex: '\\sqrt{x+5}',
        resultLatex: '\\{\\}',
      });
      expect(response.body.steps[1]).toMatchObject({
        subEquationLatex: 'x+2',
        resultLatex: '\\frac{3}{4}',
      });
      expect(response.body.solutionSet).toEqual([2, -6]);
      expect(response.body.expectedDistinctSolutionCount).toBe(1);
    });

    it('keeps left/right field order when x is in the answer input', async () => {
      repoMocks.findResolutionsByUserEquation.mockResolvedValue([
        {
          subEquation: 'x20*',
          subEquationInfix: '100',
          proposedResult: 'x*20',
          isCorrect: true,
          resolutionSide: RESOLUTION_STEP_NO_BRANCH,
        },
      ]);
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([5]);

      const response = await request(app)
        .get('/api/equations/ue-1/resolution')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.steps[0]).toMatchObject({
        subEquationLatex: '100',
        resultLatex: 'x*20',
      });
    });

    it('returns solutionSetLatex using logged infix values', async () => {
      repoMocks.findResolutionsByUserEquation.mockResolvedValue([
        {
          subEquation: 'x',
          subEquationInfix: '-1/2',
          proposedResult: 'x',
          resultValue: '-0.5',
          isVariable: true,
          isCorrect: true,
          resolutionSide: RESOLUTION_STEP_NO_BRANCH,
        },
      ]);
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([-0.5]);

      const response = await request(app)
        .get('/api/equations/ue-1/resolution')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.solutionSet).toEqual([-0.5]);
      expect(response.body.solutionSetLatex).toEqual(['-\\frac{1}{2}']);
    });

    it('returns solutionSetLatex preserving explicit unary plus', async () => {
      repoMocks.findResolutionsByUserEquation.mockResolvedValue([
        {
          subEquation: 'x',
          subEquationInfix: 'x',
          proposedResult: '+7',
          resultValue: '7',
          isVariable: true,
          isCorrect: true,
          resolutionSide: RESOLUTION_STEP_NO_BRANCH,
        },
      ]);
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([7]);

      const response = await request(app)
        .get('/api/equations/ue-1/resolution')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.solutionSetLatex).toEqual(['+7']);
      expect(response.body.steps[0]).toMatchObject({
        subEquationLatex: 'x',
        resultLatex: '+7',
      });
    });
  });

  describe('POST /api/equations/:id/finish-resolution', () => {
    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).post('/api/equations/ue-1/finish-resolution');
      expect(response.status).toBe(401);
    });

    it('returns MS when falta alguna raíz del conjunto solución', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          status: EquationStatus.IN_PROGRESS,
          currentResolutionId: 1,
          equation: {
            infixExpression: DEFAULT_EQUATIONS.quadratic,
            postfixExpression: DEFAULT_EQUATIONS.quadratic,
            solutionValues: [2, -6],
          },
        })
      );
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([2]);

      const response = await request(app)
        .post('/api/equations/ue-1/finish-resolution')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.MORE_SOLUTIONS });
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith('ue-1', {
        status: EquationStatus.IN_PROGRESS,
        currentResolutionId: 1,
        selectedBranch: '',
      });
      expect(repoMocks.createResolution).toHaveBeenCalledWith(
        expect.objectContaining({
          userEquationId: 'ue-1',
          resolutionSessionId: 1,
          isCorrect: false,
          resolutionSide: RESOLUTION_STEP_FINISH_ATTEMPT,
        })
      );
    });

    it('returns MS when at least one solution is already logged but another is missing (consistent session)', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          status: EquationStatus.IN_PROGRESS,
          currentResolutionId: 1,
          equation: {
            infixExpression: DEFAULT_EQUATIONS.quadratic,
            postfixExpression: DEFAULT_EQUATIONS.quadratic,
            solutionValues: [2, -6],
          },
        })
      );
      repoMocks.getMaxResolutionSessionId.mockResolvedValue(0);
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([2]);

      const response = await request(app)
        .post('/api/equations/ue-1/finish-resolution')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.MORE_SOLUTIONS });
      expect(repoMocks.createResolution).toHaveBeenCalledWith(
        expect.objectContaining({
          resolutionSessionId: 1,
          resolutionSide: RESOLUTION_STEP_FINISH_ATTEMPT,
        })
      );
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith('ue-1', {
        status: EquationStatus.IN_PROGRESS,
        currentResolutionId: 1,
        selectedBranch: '',
      });
    });

    it('returns RT and marks SOLVED when there are no logged steps and the equation has no real solutions (Finish = S={})', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          status: EquationStatus.NOT_STARTED,
          currentResolutionId: 0,
          equation: {
            infixExpression: DEFAULT_EQUATIONS.noRealSolution,
            postfixExpression: DEFAULT_EQUATIONS.noRealSolution,
            solutionValues: [],
          },
        })
      );
      repoMocks.getMaxResolutionSessionId.mockResolvedValue(0);
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([]);
      repoMocks.findResolutionsByUserEquation.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/equations/ue-1/finish-resolution')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESOLUTION_FINISHED });
      expect(repoMocks.createResolution).toHaveBeenCalledWith(
        expect.objectContaining({
          proposedResult: EMPTY_SET,
          isCorrect: true,
        })
      );
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith(
        'ue-1',
        expect.objectContaining({ status: EquationStatus.SOLVED })
      );
    });

    it('returns RI when there are no logged steps but the equation has solutions (Finish = S={} is incorrect)', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(makeUserEquation());
      repoMocks.getMaxResolutionSessionId.mockResolvedValue(0);
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([]);
      repoMocks.findResolutionsByUserEquation.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/equations/ue-1/finish-resolution')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESULT_INCORRECT });
      expect(repoMocks.createResolution).toHaveBeenCalledWith(
        expect.objectContaining({
          proposedResult: EMPTY_SET,
          isCorrect: false,
        })
      );
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith(
        'ue-1',
        expect.objectContaining({ status: EquationStatus.IN_PROGRESS })
      );
    });

    it('returns RT and marks SOLVED when todas las raíces están registradas', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          status: EquationStatus.IN_PROGRESS,
          currentResolutionId: 1,
          equation: {
            infixExpression: DEFAULT_EQUATIONS.quadratic,
            postfixExpression: DEFAULT_EQUATIONS.quadratic,
            solutionValues: [2, -6],
          },
        })
      );
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([2, -6]);

      const response = await request(app)
        .post('/api/equations/ue-1/finish-resolution')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESOLUTION_FINISHED });
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith('ue-1', {
        status: EquationStatus.SOLVED,
        currentResolutionId: 1,
        selectedBranch: '',
      });
    });

    it('returns RT when la ecuación ya estaba resuelta', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(
        makeUserEquation({
          status: EquationStatus.SOLVED,
          currentResolutionId: 1,
        })
      );

      const response = await request(app)
        .post('/api/equations/ue-1/finish-resolution')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ code: RESOLUTION_CODES.RESOLUTION_FINISHED });
      expect(repoMocks.getDistinctLoggedSolutions).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/equations/:id/reset-resolution', () => {
    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).post('/api/equations/ue-1/reset-resolution');
      expect(response.status).toBe(401);
    });

    it('returns 403 when user cannot reset equation', async () => {
      repoMocks.canUserModify.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/equations/ue-1/reset-resolution')
        .set(authHeader(token));

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('permisos');
    });

    it('returns 200 and resets state when user can modify equation', async () => {
      const response = await request(app)
        .post('/api/equations/ue-1/reset-resolution')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(repoMocks.deleteResolutionsByUserEquation).toHaveBeenCalledWith('ue-1');
      expect(repoMocks.updateResolutionState).toHaveBeenCalledWith('ue-1', {
        status: EquationStatus.NOT_STARTED,
        selectedBranch: '',
      });
    });
  });
});

describe('Resolution step evaluation', () => {
  function createRepo(repoOverrides: Record<string, unknown> = {}) {
    return {
      getPreviousStep: vi.fn().mockResolvedValue(null),
      findByIdWithEquation: vi.fn().mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: DEFAULT_EQUATIONS.linear,
            postfixExpression: DEFAULT_EQUATIONS.linear,
            solutionValues: [],
          },
        })
      ),
      ...repoOverrides,
    };
  }

  it('isPreviousStepValid returns true when no previous step exists', async () => {
    const repo = createRepo();
    const valid = await isPreviousStepValid(
      repo as never,
      'ue-1',
      1,
      toPostfixTokens('x+5'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(true);
  });

  it('isPreviousStepValid returns true when equation is missing in repository row', async () => {
    const repo = createRepo({
      getPreviousStep: vi.fn().mockResolvedValue({ resultValue: '7' }),
      findByIdWithEquation: vi.fn().mockResolvedValue({ id: 'ue-1' }),
    });

    const valid = await isPreviousStepValid(
      repo as never,
      'ue-1',
      1,
      toPostfixTokens('x+5'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(true);
  });

  it('isPreviousStepValid returns true when subEquation cannot be replaced', async () => {
    const repo = createRepo({
      getPreviousStep: vi.fn().mockResolvedValue({ resultValue: '7' }),
    });

    const valid = await isPreviousStepValid(
      repo as never,
      'ue-1',
      1,
      toPostfixTokens('x+99'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(true);
  });

  it('isPreviousStepValid returns true when replaced tree is not a binary equality', async () => {
    const repo = createRepo({
      getPreviousStep: vi.fn().mockResolvedValue({ resultValue: '7' }),
      findByIdWithEquation: vi.fn().mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: 'x+5',
            postfixExpression: 'x+5',
            solutionValues: [],
          },
        })
      ),
    });

    const valid = await isPreviousStepValid(
      repo as never,
      'ue-1',
      1,
      toPostfixTokens('x+5'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(true);
  });

  it('isPreviousStepValid returns true when previous result appears in evaluated sides', async () => {
    const repo = createRepo({
      getPreviousStep: vi.fn().mockResolvedValue({ resultValue: '7;foo' }),
    });

    const valid = await isPreviousStepValid(
      repo as never,
      'ue-1',
      1,
      toPostfixTokens('x+5'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(true);
  });

  it('isPreviousStepValid returns false when previous values do not match evaluated sides', async () => {
    const repo = createRepo({
      getPreviousStep: vi.fn().mockResolvedValue({ resultValue: '9;11' }),
    });

    const valid = await isPreviousStepValid(
      repo as never,
      'ue-1',
      1,
      toPostfixTokens('x+5'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(false);
  });

  it('isPreviousStepValid accepts sqrt-chain step when sides balance at a known solution', async () => {
    const repo = createRepo({
      getPreviousStep: vi.fn().mockResolvedValue({ resultValue: '1' }),
      findByIdWithEquation: vi.fn().mockResolvedValue(
        makeUserEquation({
          equation: {
            infixExpression: '-1=sqrt(1+sqrt(x))-2',
            postfixExpression: '',
            solutionValues: [0],
          },
        })
      ),
    });

    const valid = await isPreviousStepValid(
      repo as never,
      'ue-1',
      1,
      toPostfixTokens('1+sqrt(x)'),
      1,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(true);
  });

  it('normalizeInfix: (x+7)^2 tokenizes to same postfix as pot2(x+7)', () => {
    const a = infixToPostfix(tokenizeInfix('(x+7)^2'));
    const b = infixToPostfix(tokenizeInfix('pot2(x+7)'));
    expect(a).toEqual(b);
  });

  it('validateSubEquation accepts (x+7)^2 as subexpression of pot2(x+7)+10=74', () => {
    const eq = infixToPostfix(tokenizeInfix('pot2(x+7)+10=74'))!;
    const sub = infixToPostfix(tokenizeInfix('(x+7)^2'))!;
    expect(validateSubEquation(eq, sub)).toBe(true);
  });

  it('normalizeInfix: -(2*x) and -2*x produce the same postfix (neg distributes over mul)', () => {
    const a = infixToPostfix(tokenizeInfix('-(2*x)'));
    const b = infixToPostfix(tokenizeInfix('-2*x'));
    expect(a).toEqual(b);
  });

  it('validateSubEquation accepts -2*x+5 as subexpression of -(2*x)+5=20', () => {
    const eq = infixToPostfix(tokenizeInfix('-(2*x)+5=20'))!;
    const sub = infixToPostfix(tokenizeInfix('-2*x+5'))!;
    expect(validateSubEquation(eq, sub)).toBe(true);
  });

  it('validateSubEquation accepts -2*x as subexpression of -(2*x)+5=20', () => {
    const eq = infixToPostfix(tokenizeInfix('-(2*x)+5=20'))!;
    const sub = infixToPostfix(tokenizeInfix('-2*x'))!;
    expect(validateSubEquation(eq, sub)).toBe(true);
  });

  it('validateSubEquation does NOT accept -x+1*2 as subexpression of -(x+1)*2=10 (sum inside parens)', () => {
    const eq = infixToPostfix(tokenizeInfix('-(x+1)*2=10'))!;
    const sub = infixToPostfix(tokenizeInfix('-x+1*2'))!;
    expect(validateSubEquation(eq, sub)).toBe(false);
  });

  it('validateSubEquation does NOT accept -2/x+1 as subexpression of -(2/x)+1=5 (division inside parens)', () => {
    const eq = infixToPostfix(tokenizeInfix('-(2/x)+1=5'))!;
    const sub = infixToPostfix(tokenizeInfix('-2/x+1'))!;
    expect(validateSubEquation(eq, sub)).toBe(false);
  });

  it('normalizeInfix: nested ((x+1)^3)^2 parses to postfix containing pot', () => {
    const p = infixToPostfix(tokenizeInfix('((x+1)^3)^2'));
    expect(p).not.toBeNull();
    expect(p!.join('')).toContain('pot');
  });

  it('replaceSubListInPostfix handles empty sublist and missing matches', () => {
    const original = ['x', '5', '+', '12', '='];

    const cloned = replaceSubListInPostfix(original, [], '7');
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);

    const noMatch = replaceSubListInPostfix(original, ['x', '9', '+'], '7');
    expect(noMatch).toBeNull();
  });

  it('hasRepeatedBranchResult covers branch/no-previous/previous-match branches', async () => {
    const getPreviousStep = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
      resultValue: '4;5',
    });
    const repo = createRepo({ getPreviousStep });

    const noBranch = await hasRepeatedBranchResult(repo as never, 'ue-1', 1, RESOLUTION_STEP_NO_BRANCH, 4);
    expect(noBranch).toBe(false);

    const noPrevious = await hasRepeatedBranchResult(repo as never, 'ue-1', 1, 2, 4);
    expect(noPrevious).toBe(false);

    const repeated = await hasRepeatedBranchResult(repo as never, 'ue-1', 1, 2, 5);
    expect(repeated).toBe(true);
  });
});

describe('computeEffectiveResolutionSessionId', () => {
  it('toma el máximo entre sesión calculada, valor en BD y sesiones existentes', () => {
    expect(computeEffectiveResolutionSessionId(1, 0, 0)).toBe(1);
    expect(computeEffectiveResolutionSessionId(0, 0, 2)).toBe(2);
    expect(computeEffectiveResolutionSessionId(0, 1, 1)).toBe(1);
  });
});

describe('resultToLatex', () => {
  it('renders a positive simple fraction as \\frac{n}{d}', async () => {
    const { resultToLatex } = await import('../src/modules/equations/infix-to-latex.js');
    expect(resultToLatex('3/4')).toBe('\\frac{3}{4}');
  });

  it('renders a negative simple fraction with the minus outside the fraction', async () => {
    const { resultToLatex } = await import('../src/modules/equations/infix-to-latex.js');
    expect(resultToLatex('-1/2')).toBe('-\\frac{1}{2}');
  });

  it('renders inline fractions inside expressions', async () => {
    const { resultToLatex } = await import('../src/modules/equations/infix-to-latex.js');
    expect(resultToLatex('x+1/2')).toBe('x+\\frac{1}{2}');
  });

  it('renders parenthesized numerator fractions', async () => {
    const { resultToLatex } = await import('../src/modules/equations/infix-to-latex.js');
    expect(resultToLatex('(8*x^2+3)/5')).toBe('\\frac{8*x^2+3}{5}');
    expect(resultToLatex('(8*x^2+3)/5=1')).toBe('\\frac{8*x^2+3}{5}=1');
  });

  it('renders parenthesized denominator fractions', async () => {
    const { resultToLatex } = await import('../src/modules/equations/infix-to-latex.js');
    expect(resultToLatex('55/(41-30)')).toBe('\\frac{55}{41-30}');
    expect(resultToLatex('55/(41-30)=x')).toBe('\\frac{55}{41-30}=x');
  });

  it('preserves explicit unary plus in display', async () => {
    const { resultToLatex } = await import('../src/modules/equations/infix-to-latex.js');
    expect(resultToLatex('+7')).toBe('+7');
  });
});

describe('loggedSolutionDisplayInfix', () => {
  it('returns the non-x side when x is on the right', () => {
    expect(loggedSolutionDisplayInfix('-1/2', 'x')).toBe('-1/2');
  });

  it('returns the non-x side when x is on the left', () => {
    expect(loggedSolutionDisplayInfix('x', '-1/2')).toBe('-1/2');
  });
});

describe('validateEquivalentEquationStep', () => {
  it('accepts multiply both sides by -1 on x+5=10', () => {
    const eq = infixToPostfix(tokenizeInfix('x+5=10'))!;
    expect(validateEquivalentEquationStep('-x-5', '-10', eq, [5])).toBe(true);
  });

  it('rejects unrelated equation', () => {
    const eq = infixToPostfix(tokenizeInfix('x+5=10'))!;
    expect(validateEquivalentEquationStep('x', '99', eq, [5])).toBe(false);
  });
});

describe('normalizeUserInfix', () => {
  it('turns comma decimals into dots', () => {
    expect(normalizeUserInfix('0,5*x=1')).toBe('0.5*x=1');
  });

  it('inserts implicit multiplication for 3x', () => {
    expect(normalizeUserInfix('3x+2=8')).toBe('3*x+2=8');
  });

  it('inserts implicit multiplication before parentheses', () => {
    expect(normalizeUserInfix('2(x+1)=8')).toBe('2*(x+1)=8');
  });

  it('does not corrupt function names like pot2 and pot3', () => {
    expect(normalizeUserInfix('pot2(x)=9')).toBe('pot2(x)=9');
    expect(normalizeUserInfix('pot3(x)=8')).toBe('pot3(x)=8');
  });

  it('produces the same postfix for 3x and 3*x', () => {
    expect(infixToPostfix(tokenizeInfix('3x+2'))).toEqual(
      infixToPostfix(tokenizeInfix('3*x+2'))
    );
  });
});

describe('stripUnaryPlus', () => {
  it('removes unary plus before numbers', () => {
    expect(stripUnaryPlus('+7')).toBe('7');
    expect(stripUnaryPlus('x=+7')).toBe('x=7');
  });

  it('keeps binary plus between operands', () => {
    expect(stripUnaryPlus('4+5')).toBe('4+5');
    expect(stripUnaryPlus('x+5')).toBe('x+5');
  });
});

describe('parseAnswerValues with unary plus', () => {
  it('parses +7 as 7', async () => {
    const { parseAnswerValues } = await import(
      '../src/modules/equations/equation-solver/resolve-helpers.js'
    );
    expect(parseAnswerValues('+7')).toEqual([7]);
  });
});

describe('absolute value (pipe notation)', () => {
  it('converts |x| to abs(x) for parsing', async () => {
    const { convertPipeAbsToAbsCall } = await import(
      '../src/modules/equations/equation-solver/user-infix-normalize.js'
    );
    expect(convertPipeAbsToAbsCall('|x|')).toBe('abs(x)');
    expect(convertPipeAbsToAbsCall('|x|=1')).toBe('abs(x)=1');
  });

  it('solves |x|=1 as ±1', async () => {
    const { solveEquation } = await import('../src/modules/equations/equation-solver/index.js');
    const result = solveEquation('|x|=1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.solutions.sort((a, b) => a - b)).toEqual([-1, 1]);
  });

  it('renders |x|=1 in LaTeX with bars', async () => {
    const { resultToLatex } = await import('../src/modules/equations/infix-to-latex.js');
    expect(resultToLatex('|x|')).toBe('\\left|x\\right|');
    expect(resultToLatex('|x|=1')).toBe('\\left|x\\right|=1');
  });

  it('matches |x|=1 against ±1 solutions', async () => {
    const { matchAbsXAnswer, isAbsXSolutionStep, isAbsXPostfix } = await import(
      '../src/modules/equations/equation-solver/resolve-helpers.js'
    );
    const postfix = infixToPostfix(tokenizeInfix('|x|'))!;
    expect(isAbsXPostfix(postfix)).toBe(true);
    expect(matchAbsXAnswer(postfix, 1, [1, -1])).toEqual({
      isCorrect: true,
      correctResult: 1,
    });
    expect(isAbsXSolutionStep('|x|', '1', [1, -1])).toBe(true);
  });

  it('treats x=|sqrt(2)| as registering both ±sqrt(2) roots', async () => {
    const { isAbsWrappedPlusMinusAnswer, formatAbsXResultValue } = await import(
      '../src/modules/equations/equation-solver/resolve-helpers.js'
    );
    const { solveEquation } = await import('../src/modules/equations/equation-solver/index.js');
    const result = solveEquation('x^2=2');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const solutions = result.solutions;
    const subPostfix = infixToPostfix(tokenizeInfix('x'))!;
    expect(isAbsWrappedPlusMinusAnswer('|sqrt(2)|', subPostfix, solutions)).toBe(true);
    expect(formatAbsXResultValue(Math.sqrt(2))).toContain(';');
  });
});
