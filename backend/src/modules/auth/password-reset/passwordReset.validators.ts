import {
  MIN_PASSWORD_LENGTH,
  TOKEN_REQUIRED_MESSAGE,
  PASSWORD_REQUIRED_MESSAGE,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '../../../shared/constants/validation.js';
import { validateEmail } from '../../../shared/utils/validation.js';
import type { ForgotPasswordBody, ResetPasswordBody } from './passwordReset.types.js';

export function validateForgotPasswordBody(body: ForgotPasswordBody): void {
  const emailError = validateEmail(body.email);
  if (emailError) throw new Error(emailError);
}

export function validateResetPasswordBody(body: ResetPasswordBody): void {
  if (!body.token?.trim()) throw new Error(TOKEN_REQUIRED_MESSAGE);
  if (!body.newPassword) throw new Error(PASSWORD_REQUIRED_MESSAGE);
  if (body.newPassword.length < MIN_PASSWORD_LENGTH) throw new Error(PASSWORD_TOO_SHORT_MESSAGE);
}

