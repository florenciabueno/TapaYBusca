import { useLocation } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm/LoginForm';
import { RegisterForm } from '../components/RegisterForm/RegisterForm';
import { AuthLayout } from '../components/AuthLayout/AuthLayout';
import { AuthFooter } from '../components/AuthFooter/AuthFooter';
import { ROUTES } from '../../../config/constants';
import { COLORS } from '../../../config/theme';

export const AuthPage = () => {
  const location = useLocation();
  const isRegister = location.pathname === ROUTES.REGISTER;

  return (
    <AuthLayout
      footer={
        isRegister ? (
          <AuthFooter
            text="¿Ya tienes una cuenta? "
            linkTo={ROUTES.LOGIN}
            linkLabel="Inicia sesión"
            variant="inline"
            linkColor={COLORS.secondary}
          />
        ) : (
          <AuthFooter
            linkTo={ROUTES.REGISTER}
            linkLabel="Crear una cuenta"
            variant="button"
          />
        )
      }
    >
      {isRegister ? <RegisterForm /> : <LoginForm />}
    </AuthLayout>
  );
};
