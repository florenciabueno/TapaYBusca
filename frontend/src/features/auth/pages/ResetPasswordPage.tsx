import { Link, useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../../config/constants';
import { COLORS } from '../../../config/theme';
import { AuthLayout } from '../components/AuthLayout/AuthLayout';
import { ResetPasswordForm } from '../components/ResetPasswordForm/ResetPasswordForm';

export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  if (!token) {
    return (
      <AuthLayout
        footer={
          <p className="text-sm text-center text-gray-600">
            <Link
              to={ROUTES.LOGIN}
              className="font-medium hover:underline"
              style={{ color: COLORS.teal }}
            >
              Volver a iniciar sesión
            </Link>
          </p>
        }
      >
        <div className="text-sm text-center text-gray-700 border rounded-lg p-3 bg-white/70">
          Enlace inválido. Solicita un nuevo restablecimiento.
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      footer={
        <p className="text-sm text-center text-gray-600">
          <Link
            to={ROUTES.LOGIN}
            className="font-medium hover:underline"
            style={{ color: COLORS.teal }}
          >
            Volver a iniciar sesión
          </Link>
        </p>
      }
    >
      <div className="mb-4 text-center">
        <h2 className="text-lg font-semibold" style={{ color: COLORS.teal }}>
          Crear nueva contraseña
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          La contraseña debe tener al menos 8 caracteres.
        </p>
      </div>

      <ResetPasswordForm
        token={token}
        onSuccess={() => {
          setTimeout(() => navigate(ROUTES.LOGIN), 800);
        }}
      />
    </AuthLayout>
  );
};

