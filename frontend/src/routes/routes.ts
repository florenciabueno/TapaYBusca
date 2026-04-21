import { ROUTES } from '../config/constants';
import { EquationsPage } from '../features/equations/pages/EquationsPage';
import { CreateEquationPage } from '../features/equations/pages/CreateEquationPage';
import { ResolveEquationPage } from '../features/equations/pages/ResolveEquationPage';
import { UploadPage } from '../features/equations/pages/UploadPage';
import { DownloadPage } from '../features/equations/pages/DownloadPage';
import { AuthPage } from '../features/auth/pages/AuthPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';

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
    path: ROUTES.FORGOT_PASSWORD,
    element: ForgotPasswordPage,
    isProtected: false,
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: ResetPasswordPage,
    isProtected: false,
  },
  {
    path: ROUTES.DASHBOARD,
    element: EquationsPage,
    isProtected: false,
  },
  {
    path: ROUTES.CREATE_EQUATION,
    element: CreateEquationPage,
    isProtected: true,
  },
  {
    path: ROUTES.RESOLVE_EQUATION,
    element: ResolveEquationPage,
    isProtected: false,
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
