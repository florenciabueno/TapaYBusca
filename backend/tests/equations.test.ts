import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import { infixToLatex } from '../src/modules/equations/infix-to-latex.js';
import { EquationOrigin, EquationStatus } from '../src/modules/equations/equation.types.js';

vi.mock('../src/modules/equations/equation.repository.js', () => {
  const createImpl = async (data: { expression: string; userId: string; latexExpression?: string }) => {
    const expression = (data.expression ?? '').trim();
    return {
      id: 'mock-equation-id',
      origin: 'CREATED',
      status: 'NOT_STARTED',
      updatedAt: new Date(),
      isActive: true,
      equation: {
        infixExpression: expression,
        postfixExpression: expression,
        latexExpression: data.latexExpression ?? null,
      },
    };
  };
  const create = vi.fn().mockImplementation(createImpl);
  const findAllForUser = vi.fn();
  const countForUser = vi.fn();
  const findById = vi.fn();
  const update = vi.fn();
  const softDelete = vi.fn();
  const hardDeleteNotStartedUserEquation = vi.fn();
  const canUserModify = vi.fn();
  const findDefaultEquations = vi.fn();
  const countDefaultEquations = vi.fn();
  const findCreatedForUser = vi.fn();
  const getPublishedEquationIdsForUser = vi.fn();
  const findUserEquationByIdAndUser = vi.fn();
  const isEquationPublishedByUser = vi.fn();
  const createPublishedEquation = vi.fn();
  const findPublishedInDateRange = vi.fn();
  const getEquationIdsOwnedByUser = vi.fn();
  const addEquationsToUser = vi.fn();
  const addDefaultEquationsToUser = vi.fn().mockResolvedValue(undefined);

  return {
    EquationRepository: class MockEquationRepository {
      create = create;
      findAllForUser = findAllForUser;
      countForUser = countForUser;
      findById = findById;
      update = update;
      softDelete = softDelete;
      hardDeleteNotStartedUserEquation = hardDeleteNotStartedUserEquation;
      canUserModify = canUserModify;
      findDefaultEquations = findDefaultEquations;
      countDefaultEquations = countDefaultEquations;
      findCreatedForUser = findCreatedForUser;
      getPublishedEquationIdsForUser = getPublishedEquationIdsForUser;
      findUserEquationByIdAndUser = findUserEquationByIdAndUser;
      isEquationPublishedByUser = isEquationPublishedByUser;
      createPublishedEquation = createPublishedEquation;
      findPublishedInDateRange = findPublishedInDateRange;
      getEquationIdsOwnedByUser = getEquationIdsOwnedByUser;
      addEquationsToUser = addEquationsToUser;
      addDefaultEquationsToUser = addDefaultEquationsToUser;
    },
    __equationRepoMocks: {
      findAllForUser,
      countForUser,
      findById,
      update,
      softDelete,
      hardDeleteNotStartedUserEquation,
      canUserModify,
      findDefaultEquations,
      countDefaultEquations,
      findCreatedForUser,
      getPublishedEquationIdsForUser,
      findUserEquationByIdAndUser,
      isEquationPublishedByUser,
      createPublishedEquation,
      findPublishedInDateRange,
      getEquationIdsOwnedByUser,
      addEquationsToUser,
    },
  };
});

import app from '../src/app.js';
// Mock adds __equationRepoMocks at runtime (not in real module types)
const equationRepoModule = await import('../src/modules/equations/equation.repository.js');
const repoMocks = (equationRepoModule as { __equationRepoMocks?: Record<string, ReturnType<typeof vi.fn>> }).__equationRepoMocks!;

function createAuthToken(userId: string = 'test-user-id'): string {
  return jwt.sign(
    { userId, email: 'test@example.com' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
}

async function createEquation(app: Application, token: string, equation: string) {
  return request(app)
    .post('/api/equations')
    .set('Authorization', `Bearer ${token}`)
    .send({ equation });
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function makeUserEquationRow(overrides: Partial<{
  id: string;
  equationId: string;
  origin: string;
  status: string;
  updatedAt: Date;
  isActive: boolean;
  equation: { latexExpression?: string | null; infixExpression?: string | null; postfixExpression?: string | null };
}> = {}) {
  return {
    id: 'ue-1',
    origin: EquationOrigin.CREATED,
    status: EquationStatus.NOT_STARTED,
    updatedAt: new Date(),
    isActive: true,
    equation: { infixExpression: 'x+1=5', postfixExpression: 'x+1=5', latexExpression: 'x+1=5' },
    ...overrides,
  };
}

function makeDefaultEquationRow(overrides: Partial<{ id: string; createdAt: Date; latexExpression?: string | null }> = {}) {
  return {
    id: 'eq-default-1',
    createdAt: new Date(),
    latexExpression: 'x+5=12',
    infixExpression: 'x+5=12',
    postfixExpression: 'x+5=12',
    ...overrides,
  };
}

const DEFAULT_EQUATIONS_INFIX = [
  'x+5=12',
  '2*(x+5)=12',
  '((150)/(x+10))=30',
  'sqrt(x+5)=4',
  '25=pot2(x)',
  'pot2(x+2)+10=26',
  'cbrt(((40)/(x+1)))=2',
  '20=84-pot3(x)',
  '((360)/(pot2(x)-13))=10',
  'x+15=10',
  '2*x+9=7',
  '10=3*x+4',
  '9=sqrt(1+sqrt(x))',
  '3=((15)/(x+2))',
  '((8)/(1+((2)/(1+((5)/(x))))))=4',
  '39=pot2(x)-10',
  '5=12-x',
  '((4*(x+5))/(3))=4',
  'pot3(x)+1=28',
  '9=sqrt(-(x)+15)',
  'x+16=9',
  '7=-(2*x)+6',
  '((-15)/(x-2))=5',
  '((20)/(1+((12)/(1+((14)/(x))))))=4',
  '-(5*x)=30',
  'sqrt(x+25)=10',
  '5=12+x',
  '((8*pot2(x)+3)/(5))=1',
  'pot3(x)-100=25',
  '((120)/(x+10))=20',
  '((-24)/(pot2(x)-13))=-2',
  '-10=pot3(x)-2',
  '-2*(x+5)=12',
  '-1=sqrt(1+sqrt(x))-2',
  '25*pot2(x)+8=9',
  '((55)/(x))+30=41',
  'cbrt(((40)/((-x)+1)))=2',
  '7=2*x+6',
  'pot2(x+7)+10=74',
];

const VALID_EQUATIONS_ADDITIONAL = [
  'x=1',
  'x=0',
  'x=-3',
  '2*x=10',
  '3*x+1=7',
  '10=2*x+4',
  'x/2=5',
  'pot2(x)=9',
  'pot2(x)=0',
  'x^2=4',
  'pot3(x)=8',
  'pot3(x)=-27',
  'sqrt(x)=5',
  'sqrt(x)=2',
  'cbrt(x)=3',
  'cbrt(x)=2',
  '-(x)=5',
  '12-x=8',
  '1+sqrt(x)=4',
  'pot2(x)+1=10',
  '2*x+3=11',
];

const INVALID_EQUATIONS: Array<{ equation: string; description: string }> = [
  { equation: '', description: 'ecuación vacía' },
  { equation: '   ', description: 'solo espacios' },
  { equation: 'x+5', description: 'sin signo =' },
  { equation: 'x+5=12=3', description: 'más de un =' },
  { equation: 'x+5=x+3', description: 'x en ambos lados' },
  { equation: '5=12', description: 'ningún lado tiene x' },
  { equation: 'x+x=4', description: 'más de una ocurrencia de x' },
  { equation: 'sin(x)=1', description: 'función no permitida (sin)' },
  { equation: 'cos(x)=0', description: 'función no permitida (cos)' },
  { equation: 'log(x)=1', description: 'función no permitida (log)' },
  { equation: 'x^4=1', description: 'grado mayor que 3 (x^4)' },
  { equation: 'x^5=1', description: 'grado mayor que 3 (x^5)' },
  { equation: '(x+1=5', description: 'paréntesis desbalanceados' },
  { equation: 'x+1)=5', description: 'paréntesis desbalanceados' },
  { equation: '=5', description: 'lado izquierdo vacío' },
  { equation: 'x+1=', description: 'lado derecho vacío' },
  { equation: 'x@1=5', description: 'carácter no permitido (@)' },
  { equation: 'x#2=3', description: 'carácter no permitido (#)' },
];


/** Conjunto solución vacío en ℝ: deben poder darse de alta (solutionValues []). */
const EQUATIONS_EMPTY_REAL_SOLUTION: Array<{ equation: string; reason: string }> = [
  { equation: '((pot2(x)+9)/(5))=1', reason: '(x²+9)/5=1 → x²=-4 sin solución real' },
  { equation: 'pot2(x)=-9', reason: 'x² no puede ser negativo' },
  { equation: 'x^2=-1', reason: 'x² no puede ser negativo' },
  { equation: 'pot2(x)+1=0', reason: 'x² = -1 sin solución real' },
  { equation: 'pot2(x)+5=3', reason: 'x² = -2 sin solución real' },
  { equation: 'pot2(x+1)=-4', reason: '(x+1)² no puede ser negativo' },
  { equation: '-(pot2(x))=5', reason: 'equivale a x² = -5, sin solución real' },
  { equation: 'sqrt(x)=-4', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: 'sqrt(x)=-1', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: 'sqrt(x+1)=-5', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: 'sqrt(x+10)=-3', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: '2*sqrt(x)=-6', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: 'sqrt(2*x)=-2', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: 'sqrt(-(x))=-1', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: 'sqrt(pot2(x)+1)=-1', reason: '√(x²+1) ≥ 1, no puede ser negativo' },
  { equation: '0*x=1', reason: '0·x nunca es 1' },
  { equation: '0*x=5', reason: '0·x nunca es 5' },
  { equation: '1/x=0', reason: '1/x nunca es 0 en reales' },
  { equation: '5/(x+1)=0', reason: 'cociente constante/expr nunca es 0' },
  { equation: '((10)/(x))=0', reason: 'cociente constante/expr nunca es 0' },
];

const EQUATIONS_LITERAL_DIVISION_BY_ZERO: Array<{ equation: string; description: string }> = [
  { equation: 'x=((5)/(0))', description: 'divisor constante cero' },
];

describe('Equations API', () => {
  const token = createAuthToken();

  describe('POST /api/equations (create equation)', () => {
    describe('authentication', () => {
      it('returns 401 when Authorization header is missing', async () => {
        const response = await request(app)
          .post('/api/equations')
          .send({ equation: 'x = 1' });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });

      it('returns 401 when token is invalid', async () => {
        const response = await request(app)
          .post('/api/equations')
          .set('Authorization', 'Bearer invalid-token')
          .send({ equation: 'x = 1' });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('default equations (seed) - each must be created successfully', () => {
      DEFAULT_EQUATIONS_INFIX.forEach((equation) => {
        it(`creates equation: ${equation}`, async () => {
          const response = await createEquation(app, token, equation);
          expect(response.status).toBe(201);
          expect(response.body).toMatchObject({
            equation: infixToLatex(equation.trim()),
            origin: 'CREATED',
            status: 'NOT_STARTED',
            isActive: true,
          });
          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('date');
          expect(response.body).toHaveProperty('steps');
        });
      });
    });

    describe('valid equations (allowed structure f(x)=k or k=f(x))', () => {
      VALID_EQUATIONS_ADDITIONAL.forEach((equation) => {
        it(`creates equation: ${equation}`, async () => {
          const response = await createEquation(app, token, equation);
          expect(response.status).toBe(201);
          expect(response.body).toMatchObject({
            equation: infixToLatex(equation.trim()),
            origin: 'CREATED',
            status: 'NOT_STARTED',
            isActive: true,
          });
          expect(response.body).toHaveProperty('id');
        });
      });
    });

    describe('invalid equations - must be rejected with 400', () => {
      INVALID_EQUATIONS.forEach(({ equation, description }) => {
        it(`rejects: ${description} (${equation || '(empty)'})`, async () => {
          const response = await createEquation(app, token, equation);
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toBeTruthy();
        });
      });
    });

    describe('equations with empty real solution set - must be accepted with 201', () => {
      EQUATIONS_EMPTY_REAL_SOLUTION.forEach(({ equation, reason }) => {
        it(`creates empty-solution equation: ${equation} (${reason})`, async () => {
          const response = await createEquation(app, token, equation);
          expect(response.status).toBe(201);
          expect(response.body).toMatchObject({
            equation: infixToLatex(equation.trim()),
            origin: 'CREATED',
            status: 'NOT_STARTED',
            isActive: true,
          });
        });
      });
    });

    describe('literal division by zero - must be rejected with 400', () => {
      EQUATIONS_LITERAL_DIVISION_BY_ZERO.forEach(({ equation, description }) => {
        it(`rejects: ${description} (${equation})`, async () => {
          const response = await createEquation(app, token, equation);
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error');
          expect(String(response.body.error)).toMatch(/divisi|infinit|indetermin|no válid/i);
        });
      });
    });
  });

  describe('GET /api/equations (getAllEquations)', () => {
    beforeEach(() => {
      repoMocks.findAllForUser.mockResolvedValue([]);
      repoMocks.countForUser.mockResolvedValue(0);
    });

    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).get('/api/equations');
      expect(response.status).toBe(401);
    });

    it('returns 200 with paginated data', async () => {
      const row = makeUserEquationRow({ id: 'ue-1', equation: { latexExpression: 'x=1', infixExpression: 'x=1', postfixExpression: 'x=1' } });
      repoMocks.findAllForUser.mockResolvedValue([row]);
      repoMocks.countForUser.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/equations')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: [{ id: 'ue-1', equation: 'x=1', origin: EquationOrigin.CREATED, status: EquationStatus.NOT_STARTED, isActive: true }],
        total: 1,
        page: 1,
        limit: 9,
        totalPages: 1,
      });
    });

    it('accepts page and limit query params', async () => {
      const response = await request(app)
        .get('/api/equations?page=2&limit=5')
        .set(authHeader(token));
      expect(response.status).toBe(200);
      expect(repoMocks.findAllForUser).toHaveBeenCalledWith(
        'test-user-id',
        2,
        5,
        undefined,
        undefined,
        undefined,
        undefined,
        false
      );
    });

    it('passes includeDeleted when statuses include DELETED', async () => {
      const row = makeUserEquationRow({
        id: 'ue-del',
        isActive: false,
        status: EquationStatus.SOLVED,
        equation: { latexExpression: 'x=2', infixExpression: 'x=2', postfixExpression: 'x=2' },
      });
      repoMocks.findAllForUser.mockResolvedValue([row]);
      repoMocks.countForUser.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/equations?statuses=DELETED')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(repoMocks.findAllForUser).toHaveBeenCalledWith(
        'test-user-id',
        1,
        9,
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );
      expect(repoMocks.countForUser).toHaveBeenCalledWith(
        'test-user-id',
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );
      expect(response.body.data[0]).toMatchObject({
        id: 'ue-del',
        status: EquationStatus.SOLVED,
        isActive: false,
      });
    });

    it('combines DELETED with workflow status filters', async () => {
      await request(app)
        .get('/api/equations?statuses=DELETED,SOLVED')
        .set(authHeader(token));

      expect(repoMocks.findAllForUser).toHaveBeenCalledWith(
        'test-user-id',
        1,
        9,
        undefined,
        [EquationStatus.SOLVED],
        undefined,
        undefined,
        true
      );
    });
  });

  describe('GET /api/equations/public (getPublicEquations)', () => {
    it('returns 200 without auth', async () => {
      repoMocks.findDefaultEquations.mockResolvedValue([]);
      repoMocks.countDefaultEquations.mockResolvedValue(0);

      const response = await request(app).get('/api/equations/public');
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ data: [], total: 0, page: 1, limit: 9, totalPages: 1 });
    });

    it('returns default equations when statuses include NOT_STARTED', async () => {
      const defaultRow = makeDefaultEquationRow({ id: 'def-1' });
      repoMocks.findDefaultEquations.mockResolvedValue([defaultRow]);
      repoMocks.countDefaultEquations.mockResolvedValue(1);

      const response = await request(app).get('/api/equations/public?page=1&limit=9');
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({ id: 'def-1', origin: EquationOrigin.DEFAULT, status: EquationStatus.NOT_STARTED });
    });

    it('ignores DELETED in statuses and still returns default equations', async () => {
      const defaultRow = makeDefaultEquationRow({ id: 'def-1' });
      repoMocks.findDefaultEquations.mockResolvedValue([defaultRow]);
      repoMocks.countDefaultEquations.mockResolvedValue(1);

      const response = await request(app).get('/api/equations/public?statuses=DELETED');
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(repoMocks.findDefaultEquations).toHaveBeenCalled();
    });
  });

  describe('GET /api/equations/for-upload (getEquationsForUpload)', () => {
    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).get('/api/equations/for-upload');
      expect(response.status).toBe(401);
    });

    it('returns 200 with data and isPublished flags', async () => {
      const row = makeUserEquationRow({ id: 'ue-1', equationId: 'eq-1', equation: { latexExpression: 'x=2', infixExpression: 'x=2', postfixExpression: 'x=2' } });
      repoMocks.findCreatedForUser.mockResolvedValue([row]);
      repoMocks.getPublishedEquationIdsForUser.mockResolvedValue(['eq-1']);

      const response = await request(app)
        .get('/api/equations/for-upload')
        .set(authHeader(token));
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/equations/:id (getEquationById)', () => {
    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).get('/api/equations/some-id');
      expect(response.status).toBe(401);
    });

    it('returns 404 when equation not found', async () => {
      repoMocks.findById.mockResolvedValue(null);
      const response = await request(app)
        .get('/api/equations/non-existent-id')
        .set(authHeader(token));
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Ecuación no encontrada');
    });

    it('returns 200 with equation when found', async () => {
      const row = makeUserEquationRow({ id: 'ue-1', equation: { latexExpression: 'x+1=5', infixExpression: 'x+1=5', postfixExpression: 'x+1=5' } });
      repoMocks.findById.mockResolvedValue(row);
      const response = await request(app)
        .get('/api/equations/ue-1')
        .set(authHeader(token));
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 'ue-1',
        equation: 'x+1=5',
        origin: EquationOrigin.CREATED,
        status: EquationStatus.NOT_STARTED,
        isActive: true,
      });
    });
  });

  describe('PUT /api/equations/:id (updateEquation)', () => {
    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).put('/api/equations/ue-1').send({ status: EquationStatus.IN_PROGRESS });
      expect(response.status).toBe(401);
    });

    it('returns 403 when user cannot modify equation', async () => {
      repoMocks.canUserModify.mockResolvedValue(false);
      const response = await request(app)
        .put('/api/equations/ue-1')
        .set(authHeader(token))
        .send({ status: EquationStatus.IN_PROGRESS });
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('permisos');
    });

    it('returns 200 with updated equation when user can modify', async () => {
      repoMocks.canUserModify.mockResolvedValue(true);
      const updatedRow = makeUserEquationRow({ id: 'ue-1', status: EquationStatus.IN_PROGRESS });
      repoMocks.update.mockResolvedValue(updatedRow);
      const response = await request(app)
        .put('/api/equations/ue-1')
        .set(authHeader(token))
        .send({ status: EquationStatus.IN_PROGRESS });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: 'ue-1', status: EquationStatus.IN_PROGRESS });
    });
  });

  describe('DELETE /api/equations/:id (deleteEquation)', () => {
    beforeEach(() => {
      repoMocks.findById.mockReset();
      repoMocks.softDelete.mockReset();
      repoMocks.hardDeleteNotStartedUserEquation.mockReset();
    });

    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).delete('/api/equations/ue-1');
      expect(response.status).toBe(401);
    });

    it('returns 403 when user cannot modify equation', async () => {
      repoMocks.canUserModify.mockResolvedValue(false);
      const response = await request(app)
        .delete('/api/equations/ue-1')
        .set(authHeader(token));
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('permisos');
    });

    it('returns 204 and hard-deletes when status is NOT_STARTED', async () => {
      repoMocks.canUserModify.mockResolvedValue(true);
      repoMocks.findById.mockResolvedValue(makeUserEquationRow({ status: EquationStatus.NOT_STARTED }));
      repoMocks.hardDeleteNotStartedUserEquation.mockResolvedValue(undefined);
      const response = await request(app)
        .delete('/api/equations/ue-1')
        .set(authHeader(token));
      expect(response.status).toBe(204);
      expect(repoMocks.hardDeleteNotStartedUserEquation).toHaveBeenCalledWith('ue-1');
      expect(repoMocks.softDelete).not.toHaveBeenCalled();
    });

    it('returns 204 and soft-deletes when status is not NOT_STARTED', async () => {
      repoMocks.canUserModify.mockResolvedValue(true);
      repoMocks.findById.mockResolvedValue(makeUserEquationRow({ status: EquationStatus.IN_PROGRESS }));
      repoMocks.softDelete.mockResolvedValue(undefined);
      const response = await request(app)
        .delete('/api/equations/ue-1')
        .set(authHeader(token));
      expect(response.status).toBe(204);
      expect(repoMocks.softDelete).toHaveBeenCalledWith('ue-1');
      expect(repoMocks.hardDeleteNotStartedUserEquation).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/equations/upload (uploadEquations)', () => {
    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).post('/api/equations/upload').send({ userEquationIds: ['ue-1'] });
      expect(response.status).toBe(401);
    });

    it('returns 400 when one equation not found or not owned', async () => {
      repoMocks.findUserEquationByIdAndUser.mockResolvedValue(null);
      const response = await request(app)
        .post('/api/equations/upload')
        .set(authHeader(token))
        .send({ userEquationIds: ['ue-1'] });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('no existen o no te pertenecen');
    });

    it('returns 400 when one equation already published', async () => {
      const row = { id: 'ue-1', equationId: 'eq-1', equation: { infixExpression: 'x=1' } };
      repoMocks.findUserEquationByIdAndUser.mockResolvedValue(row);
      repoMocks.isEquationPublishedByUser.mockResolvedValue(true);
      const response = await request(app)
        .post('/api/equations/upload')
        .set(authHeader(token))
        .send({ userEquationIds: ['ue-1'] });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ya fueron subidas');
    });

    it('returns 200 and creates published when valid', async () => {
      const row = { id: 'ue-1', equationId: 'eq-1', equation: { infixExpression: 'x=1' } };
      repoMocks.findUserEquationByIdAndUser.mockResolvedValue(row);
      repoMocks.isEquationPublishedByUser.mockResolvedValue(false);
      repoMocks.createPublishedEquation.mockResolvedValue(undefined);
      const response = await request(app)
        .post('/api/equations/upload')
        .set(authHeader(token))
        .send({ userEquationIds: ['ue-1'] });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ ok: true });
    });
  });

  describe('POST /api/equations/download (downloadEquations)', () => {
    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).post('/api/equations/download').send({ quantity: 5 });
      expect(response.status).toBe(401);
    });

    it('returns 400 when quantity is out of range', async () => {
      const response = await request(app)
        .post('/api/equations/download')
        .set(authHeader(token))
        .send({ quantity: 0 });
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Cantidad debe estar entre/);
    });

    it('returns 400 when fromDate is invalid', async () => {
      const response = await request(app)
        .post('/api/equations/download')
        .set(authHeader(token))
        .send({ quantity: 5, fromDate: 'invalid-date' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Fecha desde');
    });

    it('returns 400 when toDate is invalid', async () => {
      const response = await request(app)
        .post('/api/equations/download')
        .set(authHeader(token))
        .send({ quantity: 5, toDate: 'invalid-date' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Fecha hasta');
    });

    it('returns 400 when fromDate > toDate', async () => {
      const response = await request(app)
        .post('/api/equations/download')
        .set(authHeader(token))
        .send({ quantity: 5, fromDate: '2025-02-01', toDate: '2025-01-01' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('posterior');
    });

    it('returns 200 with added count when valid', async () => {
      repoMocks.findPublishedInDateRange.mockResolvedValue([{ equationId: 'eq-1' }, { equationId: 'eq-2' }]);
      repoMocks.getEquationIdsOwnedByUser.mockResolvedValue([]);
      repoMocks.addEquationsToUser.mockResolvedValue(2);
      const response = await request(app)
        .post('/api/equations/download')
        .set(authHeader(token))
        .send({ quantity: 5 });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ added: 2, totalRequested: 5 });
    });
  });
});