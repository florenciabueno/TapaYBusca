import { ROUTES } from '../config/constants';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';

export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  isProtected?: boolean;
}

export const routes: RouteConfig[] = [
  {
    path: ROUTES.LOGIN,
    element: LoginPage,
    isProtected: false,
  },
  {
    path: ROUTES.DASHBOARD,
    element: DashboardPage,
    isProtected: true,
  },
];
