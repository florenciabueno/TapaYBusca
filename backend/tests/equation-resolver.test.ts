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
import { infixToPostfix } from '../src/modules/equations/equation-solver/infix-to-postfix.js';
import { postfixToTree } from '../src/modules/equations/equation-solver/postfix-to-tree.js';
import {
  replaceSubListInPostfix,
  validateSubEquation,
} from '../src/modules/equations/equation-solver/resolve-helpers.js';
import { ResolutionService } from '../src/modules/equations/resolution.service.js';

vi.mock('../src/modules/equations/equation.repository.js', () => {
  const findByIdWithEquation = vi.fn();
  const findResolutionsByUserEquation = vi.fn();
  const updateResolutionState = vi.fn();
  const createResolution = vi.fn();
  const getDistinctLoggedSolutions = vi.fn();
  const getPreviousStep = vi.fn();
  const countStepsWithoutSolution = vi.fn();
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
        message: 'La subecuación es obligatoria',
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
        { subEquation: subEquationPostfix.join(''), proposedResult: '7' },
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
        { subEquation: subEquationPostfix.join(''), proposedResult: '7' },
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
        resultLatex: '\\emptyset',
      });
      expect(response.body.steps[1]).toMatchObject({
        subEquationLatex: 'x+2',
        resultLatex: '\\frac{3}{4}',
      });
      expect(response.body.solutionSet).toEqual([2, -6]);
      expect(response.body.expectedDistinctSolutionCount).toBe(1);
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

    it('MS desde NOT_STARTED guarda el intento en la misma sesión que el próximo resolveStep', async () => {
      repoMocks.findByIdWithEquation.mockResolvedValue(makeUserEquation());
      repoMocks.getMaxResolutionSessionId.mockResolvedValue(0);
      repoMocks.getDistinctLoggedSolutions.mockResolvedValue([]);

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

describe('ResolutionService internal branches (existing test file)', () => {
  function createService(repoOverrides: Record<string, unknown> = {}) {
    const repo = {
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

    return {
      service: new ResolutionService(repo as never),
      repo,
    };
  }

  it('isPreviousStepValid returns true when no previous step exists', async () => {
    const { service } = createService();
    const valid = await (service as any).isPreviousStepValid(
      'ue-1',
      1,
      toPostfixTokens('x+5'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(true);
  });

  it('isPreviousStepValid returns true when equation is missing in repository row', async () => {
    const { service } = createService({
      getPreviousStep: vi.fn().mockResolvedValue({ resultValue: '7' }),
      findByIdWithEquation: vi.fn().mockResolvedValue({ id: 'ue-1' }),
    });

    const valid = await (service as any).isPreviousStepValid(
      'ue-1',
      1,
      toPostfixTokens('x+5'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(true);
  });

  it('isPreviousStepValid returns true when subEquation cannot be replaced', async () => {
    const { service } = createService({
      getPreviousStep: vi.fn().mockResolvedValue({ resultValue: '7' }),
    });

    const valid = await (service as any).isPreviousStepValid(
      'ue-1',
      1,
      toPostfixTokens('x+99'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(true);
  });

  it('isPreviousStepValid returns true when replaced tree is not a binary equality', async () => {
    const { service } = createService({
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

    const valid = await (service as any).isPreviousStepValid(
      'ue-1',
      1,
      toPostfixTokens('x+5'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(true);
  });

  it('isPreviousStepValid returns true when previous result appears in evaluated sides', async () => {
    const { service } = createService({
      getPreviousStep: vi.fn().mockResolvedValue({ resultValue: '7;foo' }),
    });

    const valid = await (service as any).isPreviousStepValid(
      'ue-1',
      1,
      toPostfixTokens('x+5'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(true);
  });

  it('isPreviousStepValid returns false when previous values do not match evaluated sides', async () => {
    const { service } = createService({
      getPreviousStep: vi.fn().mockResolvedValue({ resultValue: '9;11' }),
    });

    const valid = await (service as any).isPreviousStepValid(
      'ue-1',
      1,
      toPostfixTokens('x+5'),
      7,
      RESOLUTION_STEP_NO_BRANCH
    );
    expect(valid).toBe(false);
  });

  it('isPreviousStepValid accepts sqrt-chain step when sides balance at a known solution', async () => {
    const { service } = createService({
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

    const valid = await (service as any).isPreviousStepValid(
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
    const { service } = createService({ getPreviousStep });

    const noBranch = await (service as any).hasRepeatedBranchResult('ue-1', 1, RESOLUTION_STEP_NO_BRANCH, 4);
    expect(noBranch).toBe(false);

    const noPrevious = await (service as any).hasRepeatedBranchResult('ue-1', 1, 2, 4);
    expect(noPrevious).toBe(false);

    const repeated = await (service as any).hasRepeatedBranchResult('ue-1', 1, 2, 5);
    expect(repeated).toBe(true);
  });
});
