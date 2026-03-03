import crypto from 'crypto';
import { config } from '../../../config/env.js';
import { hashPassword } from '../../../shared/utils/password.js';
import type { EmailService } from '../../../shared/services/email/email.service.js';
import { PasswordResetRepository } from './passwordReset.repository.js';

const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'Si el correo existe, enviaremos un enlace para restablecer la contraseña.';

const RESET_PASSWORD_INVALID_TOKEN_MESSAGE = 'Token inválido o expirado';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export class PasswordResetService {
  constructor(
    private repository: PasswordResetRepository,
    private emailService: EmailService
  ) {}

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const userId = await this.repository.findUserIdByEmail(email);
    if (!userId) {
      return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
    }

    const now = new Date();
    const ttlMs = config.passwordResetTokenTtlMinutes * 60 * 1000;
    const expiresAt = new Date(now.getTime() + ttlMs);

    const token = generateToken();
    const tokenHash = hashToken(token);

    await this.repository.createToken({ userId, tokenHash, expiresAt, now });

    const resetUrl = `${config.frontendBaseUrl}/reset-password/${token}`;

    try {
      await this.emailService.sendPasswordResetEmail({
        to: email,
        resetUrl,
        expiresInMinutes: config.passwordResetTokenTtlMinutes,
      });
    } catch (error) {
      console.error('Error enviando email de reset password:', error);
    }

    return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const now = new Date();
    const tokenHash = hashToken(token);
    const newPasswordHash = await hashPassword(newPassword);

    const success = await this.repository.resetPasswordWithToken({
      tokenHash,
      now,
      newPasswordHash,
    });

    if (!success) throw new Error(RESET_PASSWORD_INVALID_TOKEN_MESSAGE);

    return { message: 'Contraseña actualizada correctamente' };
  }
}

