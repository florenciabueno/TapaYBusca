import { type FormEvent, useState } from 'react';
import { Input } from '../../../../shared/components/ui/Input/Input';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { ErrorMessage } from '../../../../shared/components/ui/ErrorMessage/ErrorMessage';
import { useFormValidation } from '../../../../shared/hooks/useFormValidation';
import { validateEmail, validatePassword, validateName, createConfirmPasswordValidator } from '../../../../shared/utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/constants';

export const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { errors, validateForm, clearError } = useFormValidation();
  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    clearError('name');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    clearError('email');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    clearError('password');
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    clearError('confirmPassword');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const payload = {
      name: (form.elements.namedItem('name') as HTMLInputElement)?.value ?? '',
      email: (form.elements.namedItem('email') as HTMLInputElement)?.value ?? '',
      password: (form.elements.namedItem('password') as HTMLInputElement)?.value ?? '',
      confirmPassword: (form.elements.namedItem('confirmPassword') as HTMLInputElement)?.value ?? '',
    };

    const isValid = validateForm(
      {
        name: validateName,
        email: validateEmail,
        password: validatePassword,
        confirmPassword: createConfirmPasswordValidator(payload.password),
      },
      payload
    );

    if (!isValid) {
      return;
    }

    const result = await register({ name: payload.name, email: payload.email, password: payload.password });
    if (result.success) {
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      {error && <ErrorMessage message={error} />}
      
      <Input
        id="name"
        name="name"
        type="text"
        density="sm"
        label="Nombre"
        placeholder="Ingresa tu nombre"
        value={name}
        onChange={handleNameChange}
        error={errors?.name}
        autoComplete="name"
        required
      />

      <Input
        id="email"
        name="email"
        type="text"
        density="sm"
        label="Email"
        placeholder="Ingresa tu email"
        value={email}
        onChange={handleEmailChange}
        error={errors?.email}
        autoComplete="email"
        required
      />

      <Input
        id="password"
        name="password"
        type="password"
        density="sm"
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        value={password}
        onChange={handlePasswordChange}
        error={errors?.password}
        autoComplete="new-password"
        required
      />

      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        density="sm"
        label="Confirmar contraseña"
        placeholder="Repite tu contraseña"
        value={confirmPassword}
        onChange={handleConfirmPasswordChange}
        error={errors?.confirmPassword}
        autoComplete="new-password"
        required
      />

      <Button
        type="submit"
        variant="accent"
        isLoading={isLoading}
        className="w-full py-2.5 text-sm"
      >
        Crear cuenta
      </Button>
    </form>
  );
};
