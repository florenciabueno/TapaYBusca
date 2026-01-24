import { useAuth } from '../../auth/hooks/useAuth';
import { Button } from '../../../shared/components/ui/Button';
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Panel de Control
          </h1>
          <p className="text-gray-600 mb-2">
            Bienvenido, <span className="font-semibold">{user?.name}</span>!
          </p>
          <p className="text-gray-600 mb-6">
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
