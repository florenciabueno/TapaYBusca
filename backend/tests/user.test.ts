import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import { hashPassword } from '../src/shared/utils/password.js';

vi.mock('../src/modules/user/user.repository.js', () => {
  const findById = vi.fn();
  const update = vi.fn();
  return {
    UserRepository: class MockUserRepository {
      findById = findById;
      update = update;
    },
    __mockFindById: findById,
    __mockUpdate: update,
  };
});

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
import * as UserRepo from '../src/modules/user/user.repository.js';
const { __mockFindById: mockFindById, __mockUpdate: mockUpdate } = UserRepo as typeof UserRepo & {
  __mockFindById: ReturnType<typeof vi.fn>;
  __mockUpdate: ReturnType<typeof vi.fn>;
};

function createAuthToken(userId: string = 'test-user-id'): string {
  return jwt.sign(
    { userId, email: 'test@example.com' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function getProfileRequest(app: Application, token: string) {
  return request(app).get('/api/user/profile').set(authHeader(token));
}

async function updateProfileRequest(
  app: Application,
  token: string,
  body: { name?: string; password?: string; currentPassword?: string }
) {
  return request(app).put('/api/user/profile').set(authHeader(token)).send(body);
}

const USER_ID = 'test-user-id';
const CURRENT_PASSWORD = 'currentpass123';
let hashedCurrentPassword: string;

const mockUser = {
  id: USER_ID,
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: '' as string,
};

describe('User API', () => {
  const token = createAuthToken(USER_ID);

  beforeAll(async () => {
    hashedCurrentPassword = await hashPassword(CURRENT_PASSWORD);
    mockUser.passwordHash = hashedCurrentPassword;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/user/profile', () => {
    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).get('/api/user/profile');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set(authHeader('invalid-token'));
      expect(response.status).toBe(401);
    });

    it('returns 404 when user does not exist', async () => {
      mockFindById.mockResolvedValueOnce(null);

      const response = await getProfileRequest(app, token);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Usuario no encontrado');
    });

    it('returns 200 with profile when user exists', async () => {
      mockFindById.mockResolvedValueOnce({ ...mockUser });

      const response = await getProfileRequest(app, token);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: USER_ID,
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('returns 401 with "Token expirado" when token is expired (auth middleware)', async () => {
      const expiredToken = jwt.sign(
        { userId: USER_ID, email: 'test@example.com' },
        config.jwtSecret,
        { expiresIn: '-1s' }
      );
      const response = await getProfileRequest(app, expiredToken);
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Token expirado');
    });

    it('returns 500 with "Error en autenticación" when jwt.verify throws unexpected error (auth middleware)', async () => {
      const verifySpy = vi.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw new Error('unexpected');
      });
      const response = await getProfileRequest(app, token);
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error en autenticación');
      verifySpy.mockRestore();
    });
  });

  describe('PUT /api/user/profile', () => {
    it('returns 401 when Authorization is missing', async () => {
      const response = await request(app).put('/api/user/profile').send({ name: 'New Name' });
      expect(response.status).toBe(401);
    });

    it('returns 400 when no fields to update (no name and no password)', async () => {
      const response = await updateProfileRequest(app, token, {});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('al menos un campo para actualizar');
    });

    it('returns 400 when name is too short', async () => {
      const response = await updateProfileRequest(app, token, { name: 'A' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBeTruthy();
    });

    it('returns 200 and updates name when name is valid', async () => {
      mockFindById.mockResolvedValueOnce({ ...mockUser });
      const updatedUser = {
        id: USER_ID,
        email: 'test@example.com',
        name: 'New Name',
        passwordHash: hashedCurrentPassword,
      };
      mockUpdate.mockResolvedValueOnce(updatedUser);

      const response = await updateProfileRequest(app, token, { name: 'New Name' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: USER_ID,
        email: 'test@example.com',
        name: 'New Name',
      });
      expect(mockUpdate).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ name: 'New Name' })
      );
    });

    it('returns 400 when changing password without currentPassword', async () => {
      const response = await updateProfileRequest(app, token, {
        password: 'newpassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('contraseña actual');
    });

    it('returns 400 when new password is too short', async () => {
      mockFindById.mockResolvedValueOnce({ ...mockUser });

      const response = await updateProfileRequest(app, token, {
        password: 'short',
        currentPassword: CURRENT_PASSWORD,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 400 when current password is wrong', async () => {
      mockFindById.mockResolvedValueOnce({ ...mockUser });

      const response = await updateProfileRequest(app, token, {
        password: 'newpassword123',
        currentPassword: 'wrongcurrent',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('contraseña actual');
    });

    it('returns 200 and updates password when current password is correct', async () => {
      mockFindById
        .mockResolvedValueOnce({ ...mockUser })
        .mockResolvedValueOnce({ ...mockUser });
      const newHash = await hashPassword('newpassword123');
      const updatedUser = {
        id: USER_ID,
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: newHash,
      };
      mockUpdate.mockResolvedValueOnce(updatedUser);

      const response = await updateProfileRequest(app, token, {
        password: 'newpassword123',
        currentPassword: CURRENT_PASSWORD,
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: USER_ID,
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(mockUpdate).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          passwordHash: expect.any(String),
        })
      );
    });
  });
});
