import { Link, NavLink } from 'react-router-dom';
import { ROUTES } from '../../../../config/constants';
import { COLORS, ACCENT_RGB, PURPLE_RGB } from '../../../../config/theme';
import logoImage from '../../../../assets/logo.png';

const navItems = [
  { path: ROUTES.DASHBOARD, label: 'Inicio', icon: HomeIcon },
  { path: ROUTES.CREATE_EQUATION, label: 'Crear ecuación', icon: CalculatorIcon },
  { path: ROUTES.UPLOAD, label: 'Subir', icon: UploadIcon },
  { path: ROUTES.DOWNLOAD, label: 'Descargar', icon: DownloadIcon },
];

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 6H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 10H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 10H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 10H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 14H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 14H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 18H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 18H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const Sidebar = () => {
  return (
    <aside
      className="w-60 h-screen flex-shrink-0 flex flex-col"
      style={{
        backgroundColor: `rgba(${ACCENT_RGB}, 0.48)`,
      }}
    >
      <Link
        to={ROUTES.DASHBOARD}
        className="flex items-center gap-3 px-5 py-5 cursor-pointer hover:opacity-90 transition-opacity"
        aria-label="Ir al inicio"
      >
        <img
          src={logoImage}
          alt="Tapa y Busca"
          className="w-10 h-10 object-contain shrink-0"
        />
        <span className="text-xl font-semibold">
          <span style={{ color: COLORS.orange }}>Tapa </span>
          <span style={{ color: COLORS.lightTeal }}>y </span>
          <span style={{ color: COLORS.violet }}>Busca</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-0.5 px-3 pt-2">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: `rgba(${PURPLE_RGB}, 0.28)`, color: COLORS.accentSecondary }
                : undefined
            }
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive ? '' : 'text-gray-600 hover:bg-white/60 hover:text-gray-800'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
