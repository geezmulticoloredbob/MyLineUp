import AuthForm from '../features/auth/components/AuthForm';
import { usePageTitle } from '../hooks/usePageTitle';

function RegisterPage() {
  usePageTitle('Create account');
  return (
    <div className="auth-page">
      <AuthForm mode="register" />
    </div>
  );
}

export default RegisterPage;
