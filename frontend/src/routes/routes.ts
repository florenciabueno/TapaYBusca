import { ROUTES } from '../config/constants';
import { EquationsPage } from '../features/equations/pages/EquationsPage';
import { CreateEquationPage } from '../features/create-equation/pages/CreateEquationPage';
import { UploadPage } from '../features/upload-equations/pages/UploadPage';
import { DownloadPage } from '../features/download-equations/pages/DownloadPage';
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
