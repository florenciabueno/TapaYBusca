import { EMAIL_INVALID_MESSAGE } from '../constants/validation.js';
import type { ValidationResult } from '../types/validation.types.js';

export function validateEmail(email: string | undefined): string | undefined {
  if (!email || !email.includes('@')) return EMAIL_INVALID_MESSAGE;
  return undefined;
}

export function ensureValidationPassed(
  validation: ValidationResult,
  errorPrefix = ''
): void {
  if (!validation.isValid) {
    const message = Object.values(validation.errors).filter(Boolean).join(', ');
    throw new Error(errorPrefix + message);
  }
}

/**
 * Versión para validaciones que devuelven una lista de errores (string[]).
 * Lanza Error con los mensajes unidos si validation.isValid es false.
 */
export function ensureValidationPassedWithErrorList(
  validation: { isValid: boolean; errors: string[] },
  errorPrefix = ''
): void {
  if (!validation.isValid) {
    const message = validation.errors.filter(Boolean).join(' ');
    throw new Error(errorPrefix + message);
  }
}
