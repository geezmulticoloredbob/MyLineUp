import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authApi';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-form">
        <h1 className="auth-form__title">CHECK YOUR EMAIL</h1>
        <p className="auth-form__success">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password. It expires
          in 30 minutes.
        </p>
        <p className="auth-form__switch">
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1 className="auth-form__title">RESET PASSWORD</h1>
      <p className="auth-form__hint">Enter your account email and we&apos;ll send you a link to reset your password.</p>

      {error && <p className="auth-form__error" role="alert">{error}</p>}

      <label className="auth-form__label">
        Email
        <input
          className="auth-form__input"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <button className="btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Please wait...' : 'Send reset link'}
      </button>

      <p className="auth-form__switch">
        <Link to="/login">Back to log in</Link>
      </p>
    </form>
  );
}

export default ForgotPasswordForm;
