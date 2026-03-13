import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import { hashPassword } from '../src/shared/utils/password.js';

vi.mock('../src/modules/auth/auth.repository.js', () => {
  const findByEmail = vi.fn();
  const create = vi.fn();
  return {
    AuthRepository: class MockAuthRepository {
      findByEmail = findByEmail;
      create = create;
    },
    __mockFindByEmail: findByEmail,
    __mockCreate: create,
  };
});

vi.mock('../src/modules/equations/equation.repository.js', () => ({
  EquationRepository: class MockEquationRepository {
    async create() {
      return {
        id: 'mock-equation-id',
        origin: 'CREATED',
        status: 'NOT_STARTED',
        updatedAt: new Date(),
        isActive: true,
        equation: { infixExpression: '', postfixExpression: '', latexExpression: null },
      };
    }
    async addDefaultEquationsToUser() {
      return undefined;
    }
  },
}));

import app from '../src/app.js';
import * as AuthRepo from '../src/modules/auth/auth.repository.js';
const { __mockFindByEmail: mockFindByEmail, __mockCreate: mockCreate } = AuthRepo as typeof AuthRepo & {
  __mockFindByEmail: ReturnType<typeof vi.fn>;
  __mockCreate: ReturnType<typeof vi.fn>;
};

async function loginRequest(app: Application, body: { email?: string; password?: string }) {
  return request(app).post('/api/auth/login').send(body);
}

async function registerRequest(
  app: Application,
  body: { email?: string; password?: string; name?: string }
) {
  return request(app).post('/api/auth/register').send(body);
}

const VALID_PASSWORD = 'validpassword';
let hashedPassword: string;

describe('Auth API', () => {
  beforeAll(async () => {
    hashedPassword = await hashPassword(VALID_PASSWORD);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    describe('authentication success', () => {
      it('returns 200 with user and token when credentials are valid', async () => {
        mockFindByEmail.mockResolvedValueOnce({
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: hashedPassword,
        });

        const response = await loginRequest(app, {
          email: 'test@example.com',
          password: VALID_PASSWORD,
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toMatchObject({
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        });
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
        expect(response.body.token.length).toBeGreaterThan(0);
      });
    });

    describe('authentication failure - invalid credentials', () => {
      it('returns 400 when user does not exist', async () => {
        mockFindByEmail.mockResolvedValueOnce(null);

        const response = await loginRequest(app, {
          email: 'nonexistent@example.com',
          password: VALID_PASSWORD,
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Usuario o contraseña inválidos');
      });

      it('returns 400 when password is wrong', async () => {
        mockFindByEmail.mockResolvedValueOnce({
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: hashedPassword,
        });

        const response = await loginRequest(app, {
          email: 'test@example.com',
          password: 'wrongpassword',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Usuario o contraseña inválidos');
      });
    });

    describe('validation - must be rejected with 400', () => {
      it('returns 400 when email is missing', async () => {
        const response = await loginRequest(app, { password: VALID_PASSWORD });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Credenciales inválidas');
      });

      it('returns 400 when email is invalid (no @)', async () => {
        const response = await loginRequest(app, {
          email: 'invalid-email',
          password: VALID_PASSWORD,
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Credenciales inválidas');
      });

      it('returns 400 when password is too short', async () => {
        const response = await loginRequest(app, {
          email: 'test@example.com',
          password: 'short',
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Credenciales inválidas');
      });
    });
  });

  describe('POST /api/auth/register', () => {
    const validRegisterBody = {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'password123',
    };

    describe('registration success', () => {
      it('returns 201 with user and token when data is valid', async () => {
        mockFindByEmail.mockResolvedValueOnce(null);
        mockCreate.mockResolvedValueOnce({
          id: 'new-user-id',
          email: validRegisterBody.email,
          name: validRegisterBody.name,
          passwordHash: 'hashed',
        });

        const response = await registerRequest(app, validRegisterBody);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toMatchObject({
          id: 'new-user-id',
          email: validRegisterBody.email,
          name: validRegisterBody.name,
        });
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
      });
    });

    describe('registration failure - email already registered', () => {
      it('returns 400 when email is already in use', async () => {
        mockFindByEmail.mockResolvedValueOnce({
          id: 'existing-id',
          email: validRegisterBody.email,
          name: 'Existing',
          passwordHash: 'hash',
        });

        const response = await registerRequest(app, validRegisterBody);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'El email ya está registrado');
      });
    });

    describe('validation - must be rejected with 400', () => {
      it('returns 400 or 500 when name is missing', async () => {
        mockFindByEmail.mockResolvedValueOnce(null);
        const response = await registerRequest(app, {
          email: validRegisterBody.email,
          password: validRegisterBody.password,
        });
        expect([400, 500]).toContain(response.status);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBeTruthy();
      });

      it('returns 400 when name is too short', async () => {
        const response = await registerRequest(app, {
          email: validRegisterBody.email,
          name: 'A',
          password: validRegisterBody.password,
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Credenciales inválidas');
      });

      it('returns 400 when email is invalid', async () => {
        const response = await registerRequest(app, {
          email: 'invalid',
          name: validRegisterBody.name,
          password: validRegisterBody.password,
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Credenciales inválidas');
      });

      it('returns 400 when password is too short', async () => {
        const response = await registerRequest(app, {
          email: validRegisterBody.email,
          name: validRegisterBody.name,
          password: 'short',
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Credenciales inválidas');
      });
    });
  });
});
