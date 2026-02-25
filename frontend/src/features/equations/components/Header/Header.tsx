import { useAuth } from '../../../auth/hooks/useAuth';
import { ROUTES } from '../../../../config/constants';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../auth/store/authSlice';
import { useState, useRef, useEffect } from 'react';
import { EditProfileModal } from '../../../auth/components/EditProfileModal';

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
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.DASHBOARD);
    setIsDropdownOpen(false);
  };

  const handleLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  const handleEditProfile = () => {
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{ background: 'linear-gradient(90deg, #629FAD 0%, #296374 50%, #0C2C55 100%)' }}
    >
      {!user && (
        <div className="flex items-center gap-3">
          <AppLogo className="w-8 h-8 text-white" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white">Tapa y Busca</h1>
          </div>
        </div>
      )}

      <div className={user ? 'ml-auto' : ''}>
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <span className="flex items-center gap-2 text-white">
                <UserIcon className="w-5 h-5" />
                {user.name}
              </span>
              <svg
                className={`w-4 h-4 text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={handleEditProfile}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
                  style={{ color: '#296374' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Editar perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
                  style={{ color: '#DC2626' }}
                >
                  <LogoutIcon className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="px-4 py-2 rounded-lg transition-colors hover:opacity-90 bg-white text-[#0C2C55] font-medium"
          >
            Iniciar sesión
          </button>
        )}
      </div>

      <EditProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
};
