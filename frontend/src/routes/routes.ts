import { ROUTES } from '../config/constants';
import { AuthPage } from '../features/auth/pages/AuthPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';

export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  isProtected?: boolean;
}

export const routes: RouteConfig[] = [
  {
    path: ROUTES.LOGIN,
    element: AuthPage,
    isProtected: false,
  },
  {
    path: ROUTES.REGISTER,
    element: AuthPage,
    isProtected: false,
  },
  {
    path: ROUTES.DASHBOARD,
    element: DashboardPage,
    isProtected: true,
  },
];
