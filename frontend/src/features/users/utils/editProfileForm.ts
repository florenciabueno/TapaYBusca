import { MSG_PASSWORDS_DONT_MATCH } from '../../../shared/utils/validation';
import type { UpdateProfileData } from '../types';

export const MIN_PROFILE_NAME_LENGTH = 2;
export const MIN_PROFILE_PASSWORD_LENGTH = 8;

export type EditProfileFormFields = {
  name: string;
  currentPassword: string;
  password: string;
  confirmPassword: string;
};

export function validateEditProfileForm(formData: EditProfileFormFields): string | null {
  if (!formData.name.trim()) {
    return 'El nombre no puede estar vacío';
  }

  if (formData.name.trim().length < MIN_PROFILE_NAME_LENGTH) {
    return `El nombre debe tener al menos ${MIN_PROFILE_NAME_LENGTH} caracteres`;
  }

  if (formData.currentPassword && !formData.password) {
    return 'Debe ingresar la nueva contraseña';
  }

  if (formData.password) {
    if (!formData.currentPassword) {
      return 'Debe ingresar la contraseña actual para cambiarla';
    }

    if (formData.password.length < MIN_PROFILE_PASSWORD_LENGTH) {
      return `La nueva contraseña debe tener al menos ${MIN_PROFILE_PASSWORD_LENGTH} caracteres`;
    }

    if (formData.password !== formData.confirmPassword) {
      return MSG_PASSWORDS_DONT_MATCH;
    }
  }

  return null;
}

/**
 * Builds the PATCH payload from form state. Returns an error if there is nothing to send.
 */
export function buildEditProfileUpdateData(
  formData: EditProfileFormFields,
  currentName: string | undefined
): { ok: true; data: UpdateProfileData } | { ok: false; error: string } {
  const updateData: UpdateProfileData = {};

  if (formData.name.trim() !== currentName) {
    updateData.name = formData.name.trim();
  }

  if (formData.password) {
    updateData.currentPassword = formData.currentPassword;
    updateData.password = formData.password;
  }

  const keys = Object.keys(updateData);
  const hasChanges =
    keys.length > 0 && !(keys.length === 1 && updateData.currentPassword);

  if (!hasChanges) {
    return { ok: false, error: 'No hay cambios para guardar' };
  }

  return { ok: true, data: updateData };
}
