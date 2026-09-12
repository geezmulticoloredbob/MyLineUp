import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { resetPassword } from '../services/authApi';

function ResetPasswordForm() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      navigate('/login', { state: { passwordReset: true } });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1 className="auth-form__title">SET NEW PASSWORD</h1>

      {error && <p className="auth-form__error" role="alert">{error}</p>}

      <label className="auth-form__label">
        New password
        <input
          className="auth-form__input"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <span className="auth-form__hint">Min 8 characters, 1 uppercase, 1 number</span>
      </label>

      <label className="auth-form__label">
        Confirm new password
        <input
          className="auth-form__input"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>

      <button className="btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Please wait...' : 'Reset password'}
      </button>

      <p className="auth-form__switch">
        <Link to="/login">Back to log in</Link>
      </p>
    </form>
  );
}

export default ResetPasswordForm;
