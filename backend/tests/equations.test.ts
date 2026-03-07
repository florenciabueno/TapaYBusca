import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

vi.mock('../src/modules/equations/equation.repository.js', () => ({
  EquationRepository: class MockEquationRepository {
    async create() {
      return {
        id: 'mock-equation-id',
        origin: 'CREATED',
        status: 'NOT_STARTED',
        updatedAt: new Date(),
        isActive: true,
        equation: {
          infixExpression: 'x = 1',
          postfixExpression: 'x = 1',
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

describe('Equations API', () => {
  describe('POST /api/equations (create equation)', () => {
    it('returns 201 and created equation when body is valid and user is authenticated', async () => {
      const token = createAuthToken();
      const response = await request(app)
        .post('/api/equations')
        .set('Authorization', `Bearer ${token}`)
        .send({ equation: 'x = 1' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 'mock-equation-id',
        equation: 'x = 1',
        origin: 'CREATED',
        status: 'NOT_STARTED',
        isActive: true,
      });
      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('steps');
    });

    it('returns 400 when equation is empty', async () => {
      const token = createAuthToken();
      const response = await request(app)
        .post('/api/equations')
        .set('Authorization', `Bearer ${token}`)
        .send({ equation: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBeTruthy();
    });

    it('returns 400 when equation has invalid syntax', async () => {
      const token = createAuthToken();
      const response = await request(app)
        .post('/api/equations')
        .set('Authorization', `Bearer ${token}`)
        .send({ equation: 'invalid equation without equals' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

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
});
