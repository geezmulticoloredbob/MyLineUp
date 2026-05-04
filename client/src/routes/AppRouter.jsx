import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { FavouritesProvider } from '../contexts/FavouritesContext';
import ProtectedRoute from '../components/common/ProtectedRoute';
import AppShell from '../layouts/AppShell';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import HomePage from '../pages/HomePage';
import OnboardingPage from '../pages/OnboardingPage';

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavouritesProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <HomePage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FavouritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
