import AuthForm from '../features/auth/components/AuthForm';
import { usePageTitle } from '../hooks/usePageTitle';

function LoginPage() {
  usePageTitle('Log in');
  return (
    <div className="auth-page">
      <AuthForm mode="login" />
    </div>
  );
}

export default LoginPage;
