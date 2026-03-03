import { LoginForm } from '../components/LoginForm/LoginForm';
import { RegisterForm } from '../components/RegisterForm/RegisterForm';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../config/constants';
import { COLORS } from '../../../config/theme';
import { AuthLayout } from '../components/AuthLayout/AuthLayout';

export const AuthPage = () => {
  const location = useLocation();
  const isRegister = location.pathname === ROUTES.REGISTER;

  return (
    <AuthLayout
      footer={
        isRegister ? (
          <p className="text-sm text-center text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-medium hover:underline"
              style={{ color: COLORS.secondary }}
            >
              Inicia sesión
            </Link>
          </p>
        ) : (
          <Link
            to={ROUTES.REGISTER}
            className="block w-full py-2.5 text-center border-2 rounded-lg font-semibold transition-colors hover:opacity-90 text-sm"
            style={{
              borderColor: COLORS.teal,
              color: COLORS.teal,
            }}
          >
            Crear una cuenta
          </Link>
        )
      }
    >
      {isRegister ? <RegisterForm /> : <LoginForm />}
    </AuthLayout>
  );
};
