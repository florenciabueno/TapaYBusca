import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

vi.mock('../src/modules/equations/equation.repository.js', () => ({
  EquationRepository: class MockEquationRepository {
    async create(data: { expression: string; userId: string }) {
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
          latexExpression: null,
        },
      };
    }
  },
}));

import app from '../src/app.js';

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

/** 40 ecuaciones por defecto del seed (notación infija), f(x)=k o k=f(x), hasta 3er grado, racionales, radicales */
const DEFAULT_EQUATIONS_INFIX = [
  'x+5=12',
  '2*(x+5)=12',
  '((150)/(x+10))=30',
  'raiz2(x+5)=4',
  '25=pot2(x)',
  'pot2(x+2)+10=26',
  'raiz3(((40)/(x+1)))=2',
  '20=84-pot3(x)',
  '((360)/(pot2(x)-13))=10',
  'x+15=10',
  '2*x+9=7',
  '10=3*x+4',
  '9=raiz2(1+raiz2(x))',
  '3=((15)/(x+2))',
  '((8)/(1+((2)/(1+((5)/(x))))))=4',
  '39=pot2(x)-10',
  '5=12-x',
  '((4*(x+5))/(3))=4',
  '((pot2(x)+9)/(5))=1',
  'pot3(x)+1=28',
  '9=raiz2(neg(x)+15)',
  'x+16=9',
  '7=neg(2*x)+6',
  '((neg(15))/(x-2))=5',
  '((20)/(1+((12)/(1+((14)/(x))))))=4',
  'neg(5*x)=30',
  'raiz2(x+25)=10',
  '5=12+x',
  '((8*pot2(x)+3)/(5))=1',
  'pot3(x)-100=25',
  '((120)/(x+10))=20',
  '((neg(24))/(pot2(x)-13))=neg(2)',
  'neg(10)=pot3(x)-2',
  'neg(2)*(x+5)=12',
  'neg(1)=raiz2(1+raiz2(x))-2',
  '25*pot2(x)+8=9',
  '((55)/(x))+30=41',
  'raiz3(((40)/(neg(x)+1)))=2',
  '7=2*x+6',
  'pot2(x+7)+10=74',
];

/** Ecuaciones válidas adicionales: combinaciones permitidas (lineal, cuadrático, cúbico, raíz, neg) */
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
  'raiz2(x)=5',
  'sqrt(x)=2',
  'raiz3(x)=3',
  'cbrt(x)=2',
  'neg(x)=5',
  '12-x=8',
  '1+raiz2(x)=4',
  'pot2(x)+1=10',
  '2*x+3=11',
];

/** Ecuaciones no permitidas: deben rechazarse con 400 */
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

/**
 * Ecuaciones sintácticamente correctas pero sin solución (reales): deben rechazarse con 400.
 */
const EQUATIONS_NO_SOLUTION: Array<{ equation: string; reason: string }> = [
  { equation: 'pot2(x)=-9', reason: 'x² no puede ser negativo' },
  { equation: 'x^2=-1', reason: 'x² no puede ser negativo' },
  { equation: 'pot2(x)+1=0', reason: 'x² = -1 sin solución real' },
  { equation: 'pot2(x)+5=3', reason: 'x² = -2 sin solución real' },
  { equation: 'pot2(x+1)=-4', reason: '(x+1)² no puede ser negativo' },
  { equation: 'raiz2(x)=-4', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: 'sqrt(x)=-1', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: 'raiz2(x+1)=-5', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: 'raiz2(x+10)=-3', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: '2*raiz2(x)=-6', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: 'raiz2(2*x)=-2', reason: 'raíz cuadrada no puede ser negativa' },
  { equation: 'raiz2(neg(x))=-1', reason: 'raíz cuadrada no puede ser negativa' },
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
            equation: equation.trim(),
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
            equation: equation.trim(),
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

    describe('equations with no solution - must be rejected with 400', () => {
      EQUATIONS_NO_SOLUTION.forEach(({ equation, reason }) => {
        it(`rejects no solution: ${equation} (${reason})`, async () => {
          const response = await createEquation(app, token, equation);
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toBeTruthy();
        });
      });
    });
  });
});