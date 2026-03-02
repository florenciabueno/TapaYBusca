import { UpdateProfileDto, UpdateProfileValidationErrors, ValidationResult } from './user.types.js';
import { MIN_NAME_LENGTH, MIN_PASSWORD_LENGTH } from '../../shared/constants/validation.js';

const NAME_TOO_SHORT_MESSAGE = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`;
const PASSWORD_TOO_SHORT_MESSAGE = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
const CURRENT_PASSWORD_REQUIRED_MESSAGE = 'Debe proporcionar la contraseña actual para cambiarla';

function validateName(name: string | undefined): string | undefined {
  if (name === undefined) return undefined;
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < MIN_NAME_LENGTH) {
    return NAME_TOO_SHORT_MESSAGE;
  }
  return undefined;
}

function validatePasswordLength(password: string | undefined): string | undefined {
  if (password === undefined) return undefined;
  if (password.length < MIN_PASSWORD_LENGTH) {
    return PASSWORD_TOO_SHORT_MESSAGE;
  }
  return undefined;
}

function validateCurrentPasswordRequired(
  password: string | undefined,
  currentPassword: string | undefined
): string | undefined {
  if (!password) return undefined;
  if (!currentPassword?.trim()) {
    return CURRENT_PASSWORD_REQUIRED_MESSAGE;
  }
  return undefined;
}

export const validateUpdateProfile = (data: UpdateProfileDto): ValidationResult<UpdateProfileValidationErrors> => {
  const errors: UpdateProfileValidationErrors = {};

  const nameError = validateName(data.name);
  if (nameError) errors.name = nameError;

  const passwordError = validatePasswordLength(data.password);
  if (passwordError) errors.password = passwordError;

  const currentPasswordError = validateCurrentPasswordRequired(data.password, data.currentPassword);
  if (currentPasswordError) errors.currentPassword = currentPasswordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
