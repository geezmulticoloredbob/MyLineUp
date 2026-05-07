import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute({ children, forOnboarding = false }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (forOnboarding && user.onboardingComplete) return <Navigate to="/" replace />;
  if (!forOnboarding && !user.onboardingComplete) return <Navigate to="/onboarding" replace />;

  return children;
}

export default ProtectedRoute;
