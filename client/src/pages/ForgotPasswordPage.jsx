import ForgotPasswordForm from '../features/auth/components/ForgotPasswordForm';
import { usePageTitle } from '../hooks/usePageTitle';

function ForgotPasswordPage() {
  usePageTitle('Reset password');
  return (
    <div className="auth-page">
      <div className="auth-page__inner">
        <div className="auth-page__wordmark">
          My<span className="auth-page__wordmark-accent">LineUp</span>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
