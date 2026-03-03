import { MIN_PASSWORD_LENGTH } from '../../../shared/constants/validation.js';
import type { ForgotPasswordBody, ResetPasswordBody } from './passwordReset.types.js';

const EMAIL_INVALID_MESSAGE = 'Email inválido';
const TOKEN_REQUIRED_MESSAGE = 'Token requerido';
const PASSWORD_REQUIRED_MESSAGE = 'La contraseña es requerida';
const PASSWORD_TOO_SHORT_MESSAGE = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;

function validateEmail(email: string | undefined): string | undefined {
  if (!email || !email.includes('@')) return EMAIL_INVALID_MESSAGE;
  return undefined;
}

export function validateForgotPasswordBody(body: ForgotPasswordBody): void {
  const emailError = validateEmail(body.email);
  if (emailError) throw new Error(emailError);
}

export function validateResetPasswordBody(body: ResetPasswordBody): void {
  if (!body.token?.trim()) throw new Error(TOKEN_REQUIRED_MESSAGE);
  if (!body.newPassword) throw new Error(PASSWORD_REQUIRED_MESSAGE);
  if (body.newPassword.length < MIN_PASSWORD_LENGTH) throw new Error(PASSWORD_TOO_SHORT_MESSAGE);
}

