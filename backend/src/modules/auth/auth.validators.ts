import {
  LoginCredentials,
  RegisterCredentials,
  LoginValidationErrors,
  RegisterValidationErrors,
  ValidationResult,
} from './auth.types.js';
import {
  MIN_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  NAME_TOO_SHORT_MESSAGE,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '../../shared/constants/validation.js';
import { validateEmail } from '../../shared/utils/validation.js';

function toValidationResult<T extends Record<string, string | undefined>>(errors: T): ValidationResult<T> {
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function validatePasswordLength(password: string | undefined): string | undefined {
  if (password === undefined) return undefined;
  if (password.length < MIN_PASSWORD_LENGTH) {
    return PASSWORD_TOO_SHORT_MESSAGE;
  }
  return undefined;
}

function validateName(name: string | undefined): string | undefined {
  if (name === undefined) return undefined;
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < MIN_NAME_LENGTH) {
    return NAME_TOO_SHORT_MESSAGE;
  }
  return undefined;
}

export const validateLoginCredentials = (
  credentials: LoginCredentials
): ValidationResult<LoginValidationErrors> => {
  const errors: LoginValidationErrors = {};

  const emailError = validateEmail(credentials.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePasswordLength(credentials.password);
  if (passwordError) errors.password = passwordError;

  return toValidationResult(errors);
};

export const validateRegisterCredentials = (
  credentials: RegisterCredentials
): ValidationResult<RegisterValidationErrors> => {
  const errors: RegisterValidationErrors = {};

  const nameError = validateName(credentials.name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(credentials.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePasswordLength(credentials.password);
  if (passwordError) errors.password = passwordError;

  return toValidationResult(errors);
};
