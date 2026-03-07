import crypto from 'crypto';
import { config } from '../../../config/env.js';
import { hashPassword } from '../../../shared/utils/password.js';
import { ensureValidationPassed } from '../../../shared/utils/validation.js';
import type { EmailService } from '../../../shared/services/email/email.service.js';
import { AuthRepository } from '../auth.repository.js';
import { PasswordResetRepository } from './passwordReset.repository.js';
import type {
  ForgotPasswordBody,
  ResetPasswordBody,
  PasswordResetMessageResponse,
} from './passwordReset.types.js';
import { validateForgotPasswordBody, validateResetPasswordBody } from './passwordReset.validators.js';

const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'Si el correo existe, enviaremos un enlace para restablecer la contraseña.';
const RESET_PASSWORD_INVALID_TOKEN_MESSAGE = 'Token inválido o expirado.';
const RESET_PASSWORD_SUCCESS_MESSAGE = 'Contraseña actualizada correctamente';
const VALIDATION_ERROR_PREFIX = 'Datos inválidos: ';

export class PasswordResetService {
  constructor(
    private authRepository: AuthRepository,
    private repository: PasswordResetRepository,
    private emailService: EmailService
  ) {}

  async requestPasswordReset(payload: ForgotPasswordBody): Promise<PasswordResetMessageResponse> {
    ensureValidationPassed(validateForgotPasswordBody(payload), VALIDATION_ERROR_PREFIX);
    const user = await this.authRepository.findByEmail(payload.email);
    if (!user) {
      return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
    }

    const now = new Date();
    const expiresAt = this.getExpiresAt(now);
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);

    await this.repository.createToken({ userId: user.id, tokenHash, expiresAt, now });

    const resetUrl = this.buildResetUrl(token);
    this.trySendResetEmail(payload.email, resetUrl);

    return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
  }

  async resetPassword(payload: ResetPasswordBody): Promise<PasswordResetMessageResponse> {
    ensureValidationPassed(validateResetPasswordBody(payload), VALIDATION_ERROR_PREFIX);

    const now = new Date();
    const tokenHash = this.hashToken(payload.token);
    const newPasswordHash = await hashPassword(payload.newPassword);

    const success = await this.repository.resetPasswordWithToken({
      tokenHash,
      now,
      newPasswordHash,
    });

    if (!success) throw new Error(RESET_PASSWORD_INVALID_TOKEN_MESSAGE);

    return { message: RESET_PASSWORD_SUCCESS_MESSAGE };
  }

  private getExpiresAt(from: Date): Date {
    const ttlMs = config.passwordResetTokenTtlMinutes * 60 * 1000;
    return new Date(from.getTime() + ttlMs);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private buildResetUrl(token: string): string {
    return `${config.frontendBaseUrl}/reset-password/${token}`;
  }

  private trySendResetEmail(to: string, resetUrl: string): void {
    this.emailService
      .sendPasswordResetEmail({
        to,
        resetUrl,
        expiresInMinutes: config.passwordResetTokenTtlMinutes,
      })
      .catch((error) => {
        console.error('Error enviando email de reset password:', error);
      });
  }
}
