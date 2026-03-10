import { useAuth } from '../../../../features/auth/hooks/useAuth';
import { ROUTES } from '../../../../config/constants';
import { COLORS, ACCENT_RGB, PURPLE_RGB } from '../../../../config/theme';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { EditProfileModal } from '../../../../features/users/components/EditProfileModal';
import logoImage from '../../../../assets/logo.png';

function LogoutIcon({ className }: { className?: string }) {
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
}

function UserIcon({ className }: { className?: string }) {
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
}

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.DASHBOARD);
  };

  const handleLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  const openEditProfile = () => {
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
      {!user && (
        <div className="flex items-center gap-3">
          <img
            src={logoImage}
            alt="Tapa y Busca"
            className="h-9 w-9 object-contain shrink-0"
          />
          <h1 className="text-xl font-semibold">
            <span style={{ color: COLORS.accentSecondary }}>Tapa </span>
            <span style={{ color: COLORS.orange }}>y</span>
            <span style={{ color: COLORS.accentSecondary }}> Busca</span>
          </h1>
        </div>
      )}

      <div className={user ? 'ml-auto flex items-center gap-3' : ''}>
        {user ? (
          <>
            <button
              type="button"
              onClick={openEditProfile}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:ring-offset-2"
              style={{ color: COLORS.brandDark }}
              aria-label="Editar perfil"
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
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
              style={{ color: COLORS.gray[600] }}
              aria-label="Cerrar sesión"
            >
              <LogoutIcon className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-2"
            style={{ backgroundColor: COLORS.orange, color: COLORS.surface }}
          >
            Iniciar sesión
          </button>
        )}
      </div>

      <EditProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
};
