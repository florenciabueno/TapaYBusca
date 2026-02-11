import { type FormEvent, useState } from 'react';
import { Input } from '../../../../shared/components/ui/Input/Input';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { ErrorMessage } from '../../../../shared/components/ui/ErrorMessage/ErrorMessage';
import { useFormValidation } from '../../../../shared/hooks/useFormValidation';
import { validateEmail, validatePassword } from '../../../../shared/utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/constants';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { errors, validateForm, clearError } = useFormValidation();
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isValid = validateForm(
      {
        email: validateEmail,
        password: validatePassword,
      },
      { email, password }
    );

    if (!isValid) {
      return;
    }

    const result = await login({ email, password });
    if (result.success) {
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {error && <ErrorMessage message={error} />}
      
      <Input
        id="email"
        name="email"
        type="text"
        label="Usuario"
        placeholder="Ingresa tu usuario"
        value={email}
        onChange={handleEmailChange}
        error={errors?.email}
        autoComplete="username"
        required
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        value={password}
        onChange={handlePasswordChange}
        error={errors?.password}
        autoComplete="current-password"
        required
      />

      <Button type="submit" isLoading={isLoading} className="w-full">
        Iniciar sesiónn
      </Button>
    </form>
  );
};
