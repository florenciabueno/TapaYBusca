import { ROUTES } from '../../../config/constants';
import { COLORS } from '../../../config/theme';
import { AuthLayout } from '../components/AuthLayout/AuthLayout';
import { AuthFooter } from '../components/AuthFooter/AuthFooter';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm/ForgotPasswordForm';

export const ForgotPasswordPage = () => {
  return (
    <AuthLayout
      footer={
        <AuthFooter
          text="¿Ya la recordaste? "
          linkTo={ROUTES.LOGIN}
          linkLabel="Inicia sesión"
          variant="inline"
        />
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

