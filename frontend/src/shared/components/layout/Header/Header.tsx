import { useAuth } from '../../../../features/auth/hooks/useAuth';
import { ROUTES } from '../../../../config/constants';
import { COLORS, ACCENT_RGB, PURPLE_RGB } from '../../../../config/theme';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { EditProfileModal } from '../../../../features/users/components/EditProfileModal';

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

function AppLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 7H6C5.46957 7 4.96086 7.21071 4.58579 7.58579C4.21071 7.96086 4 8.46957 4 9V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H15C15.5304 20 16.0391 19.7893 16.4142 19.4142C16.7893 19.0391 17 18.5304 17 18V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 15H12L20.5 6.5C20.8978 6.10217 21.1213 5.56261 21.1213 5C21.1213 4.43739 20.8978 3.89782 20.5 3.5C20.1022 3.10217 19.5626 2.87868 19 2.87868C18.4374 2.87868 17.8978 3.10217 17.5 3.5L9 12V15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 5L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          <span style={{ color: COLORS.brandDark }}>
            <AppLogo className="w-7 h-7" />
          </span>
          <h1 className="text-lg font-semibold" style={{ color: COLORS.brandDark }}>
            Tapa y Busca
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
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-2"
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
