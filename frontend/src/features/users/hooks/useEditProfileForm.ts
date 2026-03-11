import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { profileService } from '../services/profile.service';
import { useAuthStore } from '../../../stores';
import { MSG_PASSWORDS_DONT_MATCH } from '../../../shared/utils/validation';
import type { UpdateProfileData } from '../types';

interface EditProfileFormData {
  name: string;
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

const MIN_NAME_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 8;

export const useEditProfileForm = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [formData, setFormData] = useState<EditProfileFormData>({
    name: user?.name ?? '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => profileService.updateProfile(data),
    onSuccess: (updatedProfile) => {
      setUser({
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
      });
      setSuccess(true);
    },
  });

  const loading = updateMutation.isPending;
  const error =
    validationError ||
    (updateMutation.error != null
      ? updateMutation.error instanceof Error
        ? updateMutation.error.message
        : 'Error al actualizar el perfil'
      : null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setValidationError(null);
    updateMutation.reset();
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setValidationError('El nombre no puede estar vacío');
      return false;
    }

    if (formData.name.trim().length < MIN_NAME_LENGTH) {
      setValidationError('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (formData.currentPassword && !formData.password) {
      setValidationError('Debe ingresar la nueva contraseña');
      return false;
    }

    if (formData.password) {
      if (!formData.currentPassword) {
        setValidationError('Debe ingresar la contraseña actual para cambiarla');
        return false;
      }

      if (formData.password.length < MIN_PASSWORD_LENGTH) {
        setValidationError('La nueva contraseña debe tener al menos 8 caracteres');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setValidationError(MSG_PASSWORDS_DONT_MATCH);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (onSuccess: () => void) => {
    setValidationError(null);
    updateMutation.reset();
    if (!validateForm()) return;

    const updateData: UpdateProfileData = {};

    if (formData.name.trim() !== user?.name) {
      updateData.name = formData.name.trim();
    }

    if (formData.password) {
      updateData.currentPassword = formData.currentPassword;
      updateData.password = formData.password;
    }

    const hasChanges =
      Object.keys(updateData).length > 0 &&
      !(Object.keys(updateData).length === 1 && updateData.currentPassword);

    if (!hasChanges) {
      setValidationError('No hay cambios para guardar');
      return;
    }

    updateMutation.mutate(updateData, {
      onSuccess: () => {
        setTimeout(onSuccess, 2000);
      },
    });
  };

  return {
    user,
    formData,
    loading,
    error,
    success,
    handleChange,
    handleSubmit,
  };
};
