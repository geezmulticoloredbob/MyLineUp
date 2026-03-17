import AuthForm from '../features/auth/components/AuthForm';

function LoginPage() {
  return (
    <div className="auth-page">
      <AuthForm mode="login" />
    </div>
  );
}

export default LoginPage;
