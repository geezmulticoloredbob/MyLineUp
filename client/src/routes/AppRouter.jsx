import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { FavouritesProvider } from '../contexts/FavouritesContext';
import ProtectedRoute from '../components/common/ProtectedRoute';
import AppShell from '../layouts/AppShell';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavouritesProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </FavouritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
