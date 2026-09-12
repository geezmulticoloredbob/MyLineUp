import ResetPasswordForm from '../features/auth/components/ResetPasswordForm';
import { usePageTitle } from '../hooks/usePageTitle';

function ResetPasswordPage() {
  usePageTitle('Reset password');
  return (
    <div className="auth-page">
      <div className="auth-page__inner">
        <div className="auth-page__wordmark">
          My<span className="auth-page__wordmark-accent">LineUp</span>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}

export default ResetPasswordPage;
