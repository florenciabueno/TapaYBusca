import { useState } from 'react';
import { profileService } from '../services/profile.service';
import { useAuthStore } from '../../../stores';
import { MSG_PASSWORDS_DONT_MATCH } from '../../../shared/utils/validation';

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('El nombre no puede estar vacío');
      return false;
    }

    if (formData.name.trim().length < MIN_NAME_LENGTH) {
      setError('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (formData.currentPassword && !formData.password) {
      setError('Debe ingresar la nueva contraseña');
      return false;
    }

    if (formData.password) {
      if (!formData.currentPassword) {
        setError('Debe ingresar la contraseña actual para cambiarla');
        return false;
      }

      if (formData.password.length < MIN_PASSWORD_LENGTH) {
        setError('La nueva contraseña debe tener al menos 8 caracteres');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError(MSG_PASSWORDS_DONT_MATCH);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (onSuccess: () => void) => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const updateData: { name?: string; currentPassword?: string; password?: string } = {};

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
        setError('No hay cambios para guardar');
        setLoading(false);
        return;
      }

      const updatedProfile = await profileService.updateProfile(updateData);

      setUser({
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
      });

      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
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
