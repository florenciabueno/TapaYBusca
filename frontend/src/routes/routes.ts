import { ROUTES } from '../config/constants';
import { EquationsPage } from '../features/equations/pages/EquationsPage';
import { CreateEquationPage } from '../features/equations/pages/CreateEquationPage';
import { UploadPage } from '../features/equations/pages/UploadPage';
import { DownloadPage } from '../features/equations/pages/DownloadPage';
import { AuthPage } from '../features/auth/pages/AuthPage';

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
    element: EquationsPage,
    isProtected: true,
  },
  {
    path: ROUTES.CREATE_EQUATION,
    element: CreateEquationPage,
    isProtected: true,
  },
  {
    path: ROUTES.UPLOAD,
    element: UploadPage,
    isProtected: true,
  },
  {
    path: ROUTES.DOWNLOAD,
    element: DownloadPage,
    isProtected: true,
  },
];
