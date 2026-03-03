import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/constants';
import { COLORS } from '../../../config/theme';
import { AuthLayout } from '../components/AuthLayout/AuthLayout';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm/ForgotPasswordForm';

export const ForgotPasswordPage = () => {
  return (
    <AuthLayout
      footer={
        <p className="text-sm text-center text-gray-600">
          ¿Ya la recordaste?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium hover:underline"
            style={{ color: COLORS.teal }}
          >
            Inicia sesión
          </Link>
        </p>
      }
    >
      <div className="mb-4 text-center">
        <h2 className="text-lg font-semibold" style={{ color: COLORS.teal }}>
          Restablecer contraseña
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Ingresa el correo asociado a tu cuenta y te enviaremos un enlace.
        </p>
      </div>

      <ForgotPasswordForm />
    </AuthLayout>
  );
};

