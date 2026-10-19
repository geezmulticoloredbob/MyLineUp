import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSlowLoading } from '../../hooks/useSlowLoading';

function ProtectedRoute({ children, forOnboarding = false }) {
  const { user, loading } = useAuth();
  const isSlow = useSlowLoading(loading);

  if (loading) {
    return (
      <div className="auth-loading" aria-busy="true">
        {isSlow && (
          <p className="auth-loading__message">
            Waking up the server — this can take up to a minute on the free tier.
          </p>
        )}
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  if (forOnboarding && user.onboardingComplete) return <Navigate to="/" replace />;
  if (!forOnboarding && !user.onboardingComplete) return <Navigate to="/onboarding" replace />;

  return children;
}

export default ProtectedRoute;
