import {
  MIN_PASSWORD_LENGTH,
  TOKEN_REQUIRED_MESSAGE,
  PASSWORD_REQUIRED_MESSAGE,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '../../../shared/constants/validation.js';
import { validateEmail } from '../../../shared/utils/validation.js';
import type {
  ForgotPasswordBody,
  ResetPasswordBody,
  ForgotPasswordValidationErrors,
  ResetPasswordValidationErrors,
  ValidationResult,
} from './passwordReset.types.js';

function toValidationResult<T extends Record<string, string | undefined>>(
  errors: T
): ValidationResult<T> {
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateForgotPasswordBody(
  body: ForgotPasswordBody
): ValidationResult<ForgotPasswordValidationErrors> {
  const errors: ForgotPasswordValidationErrors = {};
  const emailError = validateEmail(body.email);
  if (emailError) errors.email = emailError;
  return toValidationResult(errors);
}

export function validateResetPasswordBody(
  body: ResetPasswordBody
): ValidationResult<ResetPasswordValidationErrors> {
  const errors: ResetPasswordValidationErrors = {};
  if (!body.token?.trim()) errors.token = TOKEN_REQUIRED_MESSAGE;
  if (!body.newPassword) errors.newPassword = PASSWORD_REQUIRED_MESSAGE;
  else if (body.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = PASSWORD_TOO_SHORT_MESSAGE;
  }
  return toValidationResult(errors);
}
