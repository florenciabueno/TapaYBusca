import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { COLORS, ACCENT_RGB } from '../../../../config/theme';
import logoImage from '../../../../assets/logo.png';

export interface AuthLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
  /** Si se define, el logo enlaza al inicio público y se muestra “Volver al inicio”. */
  homeHref?: string;
}

export const AuthLayout = ({ children, footer, homeHref }: AuthLayoutProps) => {
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
            {homeHref ? (
              <Link
                to={homeHref}
                className="block w-full h-full rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500/50"
                aria-label="Volver al inicio"
              >
                <img
                  src={logoImage}
                  alt=""
                  className="w-full h-full object-contain pointer-events-none"
                  aria-hidden
                />
              </Link>
            ) : (
              <img
                src={logoImage}
                alt="TapaYBusca Logo"
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            <span style={{ color: COLORS.orange }}>Tapa </span>
            <span style={{ color: COLORS.lightTeal }}>y </span>
            <span style={{ color: COLORS.violet }}>Busca</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-gray-500 text-center">
            Aplicación educativa de matemáticas
          </p>
          {homeHref ? (
            <Link
              to={homeHref}
              className="mt-2.5 text-xs font-medium text-gray-400 hover:text-gray-600 underline-offset-4 hover:underline transition-colors"
            >
              Volver al inicio
            </Link>
          ) : null}
        </div>

        {children}

        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  );
};

