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
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: `rgba(${ACCENT_RGB}, 0.45)` }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl border shadow-lg"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.lightTeal,
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 flex items-center justify-center mb-0">
            <img
              src={logoImage}
              alt="TapaYBusca Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1
            className="text-3xl font-bold mb-2 -mt-2"
            style={{ color: COLORS.teal }}
          >
            Tapa y Busca
          </h1>
          <p
            className="text-sm font-medium text-gray-500"
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
              className="block w-full py-3 text-center border-2 rounded-lg font-semibold transition-colors hover:opacity-90"
              style={{
                borderColor: COLORS.teal,
                color: COLORS.teal,
              }}
            >
              Crear una cuenta
            </Link>
          )}
        </div>

        <div
          className="mt-6 pt-6"
          style={{ borderTop: `3px solid ${COLORS.lightTeal}` }}
        >
          <div className="flex justify-around">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center mb-2">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="16" rx="2" fill={COLORS.lightTeal} />
                  <rect x="5" y="7" width="14" height="2" fill="white" />
                  <rect x="5" y="11" width="10" height="2" fill="rgba(255,255,255,0.8)" />
                  <rect x="5" y="15" width="12" height="2" fill={COLORS.teal} />
                </svg>
              </div>
              <span className="text-sm font-semibold" style={{ color: COLORS.teal }}>Aprende</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center mb-2">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.71 7.04C21.1 6.65 21.1 6 20.71 5.63L18.37 3.29C18 2.9 17.35 2.9 16.96 3.29L15.12 5.12L18.87 8.87M3 17.25V21H6.75L17.81 9.93L14.06 6.18L3 17.25Z" stroke={COLORS.lightTeal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <span className="text-sm font-semibold" style={{ color: COLORS.teal }}>Practica</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center mb-2">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill={COLORS.lightTeal} />
                  <circle cx="12" cy="12" r="6" fill="white" />
                  <circle cx="12" cy="12" r="2" fill={COLORS.orange} />
                </svg>
              </div>
              <span className="text-sm font-semibold" style={{ color: COLORS.teal }}>Mejora</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
