import { useState } from 'react';
import { profileService } from '../services/profile.service';
import { useAuthStore } from '../../../stores';

interface EditProfileFormData {
  name: string;
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export const useEditProfileForm = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  
  const [formData, setFormData] = useState<EditProfileFormData>({
    name: user?.name || '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('El nombre no puede estar vacío');
      return false;
    }

    if (formData.name.trim().length < 2) {
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

      if (formData.password.length < 8) {
        setError('La nueva contraseña debe tener al menos 8 caracteres');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (onSuccess: () => void) => {
    if (!validateForm()) {
      return;
    }

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

      if (Object.keys(updateData).length === 0 || (Object.keys(updateData).length === 1 && updateData.currentPassword)) {
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
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
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
