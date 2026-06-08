import { useAuth } from '../../../../features/auth/hooks/useAuth';
import { ROUTES } from '../../../../config/constants';
import { usePromoBanner } from '../../../context/PromoBannerContext';
import { COLORS, ACCENT_RGB, PURPLE_RGB } from '../../../../config/theme';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { EditProfileModal } from '../../../../features/users/components/EditProfileModal';
import logoImage from '../../../../assets/logo.png';

const LogoutIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const UserIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const EditIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const HamburgerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    navigate(ROUTES.DASHBOARD);
    logout();
  };

  const handleLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  const handleRegister = () => {
    navigate(ROUTES.REGISTER);
  };

  const promo = usePromoBanner();
  const showRegisterButton = promo?.isPromoDismissed ?? false;

  const openEditProfile = () => {
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  };

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-6 py-3 transition-shadow"
      style={{
        backgroundColor: `rgba(${ACCENT_RGB}, 0.42)`,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
      }}
    >
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden mr-2 p-2 rounded-lg transition-colors hover:bg-white/40 focus:outline-none"
          style={{ color: COLORS.brandDark }}
          aria-label="Abrir menú"
        >
          <HamburgerIcon className="w-5 h-5" />
        </button>
      )}

      {!user && (
        <Link
          to={ROUTES.DASHBOARD}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          aria-label="Ir al inicio"
        >
          <img
            src={logoImage}
            alt="Tapa y Busca"
            className="h-9 w-9 object-contain shrink-0"
          />
          <h1 className="text-xl font-semibold">
            <span style={{ color: COLORS.orange }}>Tapa </span>
            <span style={{ color: COLORS.lightTeal }}>y </span>
            <span style={{ color: COLORS.violet }}>Busca</span>
          </h1>
        </Link>
      )}

      <div className={user ? 'ml-auto flex items-center gap-3' : ''}>
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((open) => !open)}
              className="cursor-pointer flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:opacity-90 focus:outline-none"
              style={{ color: COLORS.brandDark }}
              aria-label="Menú de usuario"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `rgba(${PURPLE_RGB}, 0.1)`;
                e.currentTarget.style.color = COLORS.accentSecondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
                e.currentTarget.style.color = COLORS.brandDark;
              }}
            >
              <UserIcon className="w-5 h-5 flex-shrink-0" />
              <span>{user.name}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 min-w-[180px] rounded-lg py-1 shadow-lg z-50 border border-gray-200/80"
                style={{ backgroundColor: COLORS.surface }}
                role="menu"
              >
                <button
                  type="button"
                  onClick={openEditProfile}
                  className="w-full cursor-pointer flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  style={{ color: COLORS.brandDark }}
                  role="menuitem"
                >
                  <EditIcon className="w-4 h-4 flex-shrink-0" />
                  Editar perfil
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full cursor-pointer flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  style={{ color: COLORS.gray[600] }}
                  role="menuitem"
                >
                  <LogoutIcon className="w-4 h-4 flex-shrink-0" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {showRegisterButton && (
              <button
                type="button"
                onClick={handleRegister}
                className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-2 border"
                style={{
                  backgroundColor: COLORS.surface,
                  color: COLORS.accentSecondary,
                  borderColor: COLORS.accentSecondary,
                }}
              >
                Crear cuenta
              </button>
            )}
            <button
              type="button"
              onClick={handleLogin}
              className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-2"
              style={{ backgroundColor: COLORS.orange, color: COLORS.surface }}
            >
              Iniciar sesión
            </button>
          </div>
        )}
      </div>

      <EditProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
};
