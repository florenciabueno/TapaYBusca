import { type FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Input } from '../../../../shared/components/ui/Input/Input';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { ErrorMessage } from '../../../../shared/components/ui/ErrorMessage/ErrorMessage';
import { useFormValidation } from '../../../../shared/hooks/useFormValidation';
import { validateEmail } from '../../../../shared/utils/validation';
import { requestPasswordReset } from '../../services/auth.service';

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { errors, validateForm, clearError } = useFormValidation();

  const forgotMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (result) => {
      setSuccessMessage(result.message);
    },
  });

  const isSubmitting = forgotMutation.isPending;
  const errorMessage =
    forgotMutation.error != null
      ? forgotMutation.error instanceof Error
        ? forgotMutation.error.message
        : 'No se pudo solicitar el restablecimiento'
      : null;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setSuccessMessage(null);
    forgotMutation.reset();
    clearError('email');
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage(null);
    forgotMutation.reset();

    const isValid = validateForm({ email: validateEmail }, { email });
    if (!isValid) return;

    forgotMutation.mutate({ email });
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
        id="email"
        name="email"
        type="text"
        density="sm"
        label="Correo electrónico"
        placeholder="Ingresa tu correo"
        value={email}
        onChange={handleEmailChange}
        error={errors?.email}
        autoComplete="email"
        required
      />

      <Button
        type="submit"
        variant="accent"
        isLoading={isSubmitting}
        className="w-full py-2.5 text-sm"
      >
        Enviar enlace
      </Button>
    </form>
  );
};

