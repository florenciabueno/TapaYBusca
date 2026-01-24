import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { routes } from './routes';
import { useAuthStore } from '../features/auth/store/authSlice';
import { ROUTES } from '../config/constants';

export const AppRouter = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <BrowserRouter>
      <Routes>
        {routes.map((route) => {
          const RouteElement = route.element;

          if (route.isProtected) {
            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute>
                    <RouteElement />
                  </ProtectedRoute>
                }
              />
            );
          }

          return (
            <Route
              key={route.path}
              path={route.path}
              element={<RouteElement />}
            />
          );
        })}
        <Route
          path="/"
          element={<Navigate to={user ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};
