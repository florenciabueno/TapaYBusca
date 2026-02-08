import { useAuth } from '../../auth/hooks/useAuth';
import { Button } from '../../../shared/components/ui/Button/Button';
import { ROUTES } from '../../../config/constants';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div 
      className="min-h-screen p-8"
      style={{
        background: 'linear-gradient(to bottom right, #629FAD, #296374, #0C2C55)'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div 
          className="rounded-lg shadow-2xl p-6"
          style={{
            background: '#EDEDCE'
          }}
        >
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ color: '#0C2C55' }}
          >
            Panel de Control
          </h1>
          <p 
            className="mb-2"
            style={{ color: '#296374' }}
          >
            Bienvenido, <span className="font-semibold">{user?.name}</span>!
          </p>
          <p 
            className="mb-6"
            style={{ color: '#296374' }}
          >
            Usuario: <span className="font-semibold">{user?.email}</span>
          </p>
          <Button onClick={handleLogout} variant="secondary">
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
};
