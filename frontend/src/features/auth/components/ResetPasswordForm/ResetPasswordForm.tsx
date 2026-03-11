import { type FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Input } from '../../../../shared/components/ui/Input/Input';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { ErrorMessage } from '../../../../shared/components/ui/ErrorMessage/ErrorMessage';
import { useFormValidation } from '../../../../shared/hooks/useFormValidation';
import { validatePassword, createConfirmPasswordValidator } from '../../../../shared/utils/validation';
import { resetPassword } from '../../services/auth.service';

export interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
}

export const ResetPasswordForm = ({ token, onSuccess }: ResetPasswordFormProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { errors, validateForm, clearError } = useFormValidation();

  const resetMutation = useMutation({
    mutationFn: (data: { token: string; newPassword: string }) => resetPassword(data),
    onSuccess: (result) => {
      setSuccessMessage(result.message);
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.();
    },
  });

  const isSubmitting = resetMutation.isPending;
  const errorMessage =
    resetMutation.error != null
      ? resetMutation.error instanceof Error
        ? resetMutation.error.message
        : 'No se pudo restablecer la contraseña'
      : null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage(null);
    resetMutation.reset();

    const isValid = validateForm(
      { newPassword: validatePassword, confirmPassword: createConfirmPasswordValidator(newPassword) },
      { newPassword, confirmPassword }
    );
    if (!isValid) return;

    resetMutation.mutate({ token, newPassword });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      {errorMessage ? <ErrorMessage message={errorMessage} /> : null}
      {successMessage ? (
        <div className="text-sm text-center text-gray-700 border rounded-lg p-3 bg-white/70">
          {successMessage}
        </div>
      ) : null}

      <Input
        id="newPassword"
        name="newPassword"
        type="password"
        density="sm"
        label="Nueva contraseña"
        placeholder="Ingresa una nueva contraseña"
        value={newPassword}
        onChange={(e) => {
          setNewPassword(e.target.value);
          setSuccessMessage(null);
          resetMutation.reset();
          clearError('newPassword');
        }}
        error={errors?.newPassword}
        autoComplete="new-password"
        required
      />

      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        density="sm"
        label="Confirmar contraseña"
        placeholder="Repite tu nueva contraseña"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          setSuccessMessage(null);
          resetMutation.reset();
          clearError('confirmPassword');
        }}
        error={errors?.confirmPassword}
        autoComplete="new-password"
        required
      />

      <Button
        type="submit"
        variant="accent"
        isLoading={isSubmitting}
        className="w-full py-2.5 text-sm"
      >
        Restablecer contraseña
      </Button>
    </form>
  );
};

