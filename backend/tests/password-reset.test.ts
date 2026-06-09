import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';

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

vi.mock('../src/modules/auth/password-reset/passwordReset.repository.js', () => {
  const createToken = vi.fn().mockResolvedValue(undefined);
  const resetPasswordWithToken = vi.fn();
  return {
    PasswordResetRepository: class MockPasswordResetRepository {
      createToken = createToken;
      resetPasswordWithToken = resetPasswordWithToken;
    },
    __mockCreateToken: createToken,
    __mockResetPasswordWithToken: resetPasswordWithToken,
  };
});

vi.mock('../src/shared/services/email/email.service.js', () => {
  const sendPasswordResetEmail = vi.fn().mockResolvedValue(undefined);
  return {
    EmailService: class MockEmailService {
      sendPasswordResetEmail = sendPasswordResetEmail;
    },
    __mockSendPasswordResetEmail: sendPasswordResetEmail,
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
import {
  __mockFindByEmail as mockFindByEmail,
} from '../src/modules/auth/auth.repository.js';
import {
  __mockCreateToken as mockCreateToken,
  __mockResetPasswordWithToken as mockResetPasswordWithToken,
} from '../src/modules/auth/password-reset/passwordReset.repository.js';
import { __mockSendPasswordResetEmail as mockSendPasswordResetEmail } from '../src/shared/services/email/email.service.js';

async function forgotPasswordRequest(app: Application, body: { email?: string }) {
  return request(app).post('/api/auth/forgot-password').send(body);
}

async function resetPasswordRequest(
  app: Application,
  body: { token?: string; newPassword?: string }
) {
  return request(app).post('/api/auth/reset-password').send(body);
}

const FORGOT_SUCCESS_MESSAGE =
  'Si el correo existe, enviaremos un enlace para restablecer la contraseña.';
const RESET_SUCCESS_MESSAGE = 'Contraseña actualizada correctamente';
const RESET_INVALID_TOKEN_MESSAGE = 'Token inválido o expirado';
const VALID_EMAIL = 'user@example.com';
const VALID_NEW_PASSWORD = 'newpassword123';
const VALID_TOKEN = 'valid-reset-token';

describe('Password Reset API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateToken.mockResolvedValue(undefined);
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
  });

  describe('POST /api/auth/forgot-password', () => {
    describe('validation - must be rejected with 400', () => {
      it('returns 400 when email is missing', async () => {
        const response = await forgotPasswordRequest(app, {});
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Datos inválidos');
      });

      it('returns 400 when email is invalid (no @)', async () => {
        const response = await forgotPasswordRequest(app, { email: 'invalid-email' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Datos inválidos');
      });
    });

    describe('when email is valid', () => {
      it('returns 200 with generic message when user does not exist (security: same as success)', async () => {
        mockFindByEmail.mockResolvedValueOnce(null);

        const response = await forgotPasswordRequest(app, { email: 'nonexistent@example.com' });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ message: FORGOT_SUCCESS_MESSAGE });
        expect(mockCreateToken).not.toHaveBeenCalled();
        expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
      });

      it('returns 200 with generic message when user exists and creates token + sends email', async () => {
        mockFindByEmail.mockResolvedValueOnce({
          id: 'user-1',
          email: VALID_EMAIL,
          name: 'User',
          passwordHash: 'hash',
        });

        const response = await forgotPasswordRequest(app, { email: VALID_EMAIL });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ message: FORGOT_SUCCESS_MESSAGE });
        expect(mockCreateToken).toHaveBeenCalledTimes(1);
        expect(mockCreateToken).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-1',
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            now: expect.any(Date),
          })
        );
        expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
        expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: VALID_EMAIL,
            resetUrl: expect.stringContaining('/reset-password/'),
            expiresInMinutes: expect.any(Number),
          })
        );
      });
    });
  });

  describe('POST /api/auth/reset-password', () => {
    describe('validation - must be rejected with 400', () => {
      it('returns 400 when token is missing', async () => {
        const response = await resetPasswordRequest(app, { newPassword: VALID_NEW_PASSWORD });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Datos inválidos');
      });

      it('returns 400 when token is only whitespace', async () => {
        const response = await resetPasswordRequest(app, {
          token: '   ',
          newPassword: VALID_NEW_PASSWORD,
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Datos inválidos');
      });

      it('returns 400 when newPassword is missing', async () => {
        const response = await resetPasswordRequest(app, { token: VALID_TOKEN });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Datos inválidos');
      });

      it('returns 400 when newPassword is too short', async () => {
        const response = await resetPasswordRequest(app, {
          token: VALID_TOKEN,
          newPassword: 'short',
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Datos inválidos');
      });
    });

    describe('when payload is valid', () => {
      it('returns 400 when token is invalid or expired', async () => {
        mockResetPasswordWithToken.mockResolvedValueOnce(false);

        const response = await resetPasswordRequest(app, {
          token: 'invalid-or-expired-token',
          newPassword: VALID_NEW_PASSWORD,
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', RESET_INVALID_TOKEN_MESSAGE);
      });

      it('returns 200 with success message when token is valid', async () => {
        mockResetPasswordWithToken.mockResolvedValueOnce(true);

        const response = await resetPasswordRequest(app, {
          token: VALID_TOKEN,
          newPassword: VALID_NEW_PASSWORD,
        });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ message: RESET_SUCCESS_MESSAGE });
        expect(mockResetPasswordWithToken).toHaveBeenCalledTimes(1);
        expect(mockResetPasswordWithToken).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenHash: expect.any(String),
            now: expect.any(Date),
            newPasswordHash: expect.any(String),
          })
        );
      });
    });
  });
});
