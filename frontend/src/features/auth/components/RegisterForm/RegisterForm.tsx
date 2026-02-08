import { type FormEvent, useState } from 'react';
import { Input } from '../../../../shared/components/ui/Input/Input';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { ErrorMessage } from '../../../../shared/components/ui/ErrorMessage/ErrorMessage';
import { useFormValidation } from '../../../../shared/hooks/useFormValidation';
import { validateEmail, validatePassword, validateName } from '../../../../shared/utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/constants';

export const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isValid = validateForm(
      {
        name: validateName,
        email: validateEmail,
        password: validatePassword,
      },
      { name, email, password }
    );

    if (!isValid) {
      return;
    }

    const result = await register({ name, email, password });
    if (result.success) {
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {error && <ErrorMessage message={error} />}
      
      <Input
        id="name"
        name="name"
        type="text"
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
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        value={password}
        onChange={handlePasswordChange}
        error={errors?.password}
        autoComplete="new-password"
        required
      />

      <Button type="submit" isLoading={isLoading} className="w-full">
        Crear cuenta
      </Button>
    </form>
  );
};
