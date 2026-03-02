import { LoginForm } from '../components/LoginForm/LoginForm';
import { RegisterForm } from '../components/RegisterForm/RegisterForm';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../config/constants';
import { COLORS, ACCENT_RGB } from '../../../config/theme';
import logoImage from '../../../assets/logo.png';

export const AuthPage = () => {
  const location = useLocation();
  const isRegister = location.pathname === ROUTES.REGISTER;

  return (
    <div
      className="min-h-screen flex items-start sm:items-center justify-center overflow-y-auto px-4 py-6"
      style={{ backgroundColor: `rgba(${ACCENT_RGB}, 0.45)` }}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-lg p-6 sm:p-8 max-h-[calc(100vh-3rem)] overflow-y-auto"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.lightTeal,
        }}
      >
        <div className="flex flex-col items-center mb-5">
          <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center mb-1">
            <img
              src={logoImage}
              alt="TapaYBusca Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold mb-1"
            style={{ color: COLORS.teal }}
          >
            Tapa y Busca
          </h1>
          <p
            className="text-xs sm:text-sm font-medium text-gray-500 text-center"
          >
            Aplicación educativa de matemáticas
          </p>
        </div>

        {isRegister ? <RegisterForm /> : <LoginForm />}

        <div className="mt-4">
          {isRegister ? (
            <p className="text-sm text-center text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="font-medium hover:underline"
                style={{ color: COLORS.teal }}
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
          )}
        </div>
      </div>
    </div>
  );
};
