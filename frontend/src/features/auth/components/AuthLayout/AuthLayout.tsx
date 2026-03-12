import type { ReactNode } from 'react';
import { COLORS, ACCENT_RGB } from '../../../../config/theme';
import logoImage from '../../../../assets/logo.png';

export interface AuthLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
}

export const AuthLayout = ({ children, footer }: AuthLayoutProps) => {
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            <span style={{ color: COLORS.orange }}>Tapa </span>
            <span style={{ color: COLORS.lightTeal }}>y </span>
            <span style={{ color: COLORS.violet }}>Busca</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-gray-500 text-center">
            Aplicación educativa de matemáticas
          </p>
        </div>

        {children}

        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  );
};

