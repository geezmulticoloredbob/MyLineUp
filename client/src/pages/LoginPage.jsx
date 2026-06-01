import AuthForm from '../features/auth/components/AuthForm';
import { usePageTitle } from '../hooks/usePageTitle';

function LoginPage() {
  usePageTitle('Log in');
  return (
    <div className="auth-page">
      <div className="auth-page__inner">
        <div className="auth-page__wordmark">
          My<span className="auth-page__wordmark-accent">LineUp</span>
        </div>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}

export default LoginPage;
