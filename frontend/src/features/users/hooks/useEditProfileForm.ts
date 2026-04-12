import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { profileService } from '../services/profile.service';
import { useAuthStore } from '../../../stores';
import { mergeFormSubmitError } from '../../../shared/utils/formError';
import type { UpdateProfileData } from '../types';
import {
  buildEditProfileUpdateData,
  validateEditProfileForm,
  type EditProfileFormFields,
} from '../utils/editProfileForm';

export const useEditProfileForm = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [formData, setFormData] = useState<EditProfileFormFields>({
    name: user?.name ?? '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const successCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successCloseTimerRef.current !== null) {
        clearTimeout(successCloseTimerRef.current);
        successCloseTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setFormData({
      name: user.name,
      currentPassword: '',
      password: '',
      confirmPassword: '',
    });
  }, [user?.id, user?.name]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => profileService.updateProfile(data),
    onSuccess: (updatedProfile) => {
      setUser({
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
      });
      setSuccess(true);
      setFormData((prev) => ({
        ...prev,
        name: updatedProfile.name,
        currentPassword: '',
        password: '',
        confirmPassword: '',
      }));
    },
  });

  const loading = updateMutation.isPending;
  const error = mergeFormSubmitError(
    validationError,
    updateMutation.error,
    'Error al actualizar el perfil'
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setValidationError(null);
    updateMutation.reset();
  };

  const handleSubmit = (onSuccess: () => void) => {
    if (successCloseTimerRef.current !== null) {
      clearTimeout(successCloseTimerRef.current);
      successCloseTimerRef.current = null;
    }
    setValidationError(null);
    updateMutation.reset();

    const validationMsg = validateEditProfileForm(formData);
    if (validationMsg) {
      setValidationError(validationMsg);
      return;
    }

    const payload = buildEditProfileUpdateData(formData, user?.name);
    if (!payload.ok) {
      setValidationError(payload.error);
      return;
    }

    updateMutation.mutate(payload.data, {
      onSuccess: () => {
        if (successCloseTimerRef.current !== null) {
          clearTimeout(successCloseTimerRef.current);
        }
        successCloseTimerRef.current = setTimeout(() => {
          successCloseTimerRef.current = null;
          onSuccess();
        }, 2000);
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
