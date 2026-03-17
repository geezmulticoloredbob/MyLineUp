import AuthForm from '../features/auth/components/AuthForm';

function RegisterPage() {
  return (
    <div className="auth-page">
      <AuthForm mode="register" />
    </div>
  );
}

export default RegisterPage;
