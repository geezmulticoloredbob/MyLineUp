import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

function AuthForm({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleDemo() {
    setError('');
    setSubmitting(true);
    try {
      await login({ email: 'demo@mylineup.com', password: 'demo1234' });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login({ email: fields.email, password: fields.password });
        navigate('/');
      } else {
        await register({ username: fields.username, email: fields.email, password: fields.password });
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1 className="auth-form__title">{isLogin ? 'Log in' : 'Create account'}</h1>

      {error && <p className="auth-form__error">{error}</p>}

      {!isLogin && (
        <label className="auth-form__label">
          Username
          <input
            className="auth-form__input"
            type="text"
            name="username"
            value={fields.username}
            onChange={handleChange}
            required
            minLength={2}
          />
        </label>
      )}

      <label className="auth-form__label">
        Email
        <input
          className="auth-form__input"
          type="email"
          name="email"
          value={fields.email}
          onChange={handleChange}
          required
        />
      </label>

      <label className="auth-form__label">
        Password
        <input
          className="auth-form__input"
          type="password"
          name="password"
          value={fields.password}
          onChange={handleChange}
          required
          minLength={8}
        />
      </label>

      <button className="btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
      </button>

      {isLogin && (
        <button className="btn-secondary" type="button" onClick={handleDemo} disabled={submitting}>
          Use demo account
        </button>
      )}

      <p className="auth-form__switch">
        {isLogin ? (
          <>Don&apos;t have an account? <Link to="/register">Register</Link></>
        ) : (
          <>Already have an account? <Link to="/login">Log in</Link></>
        )}
      </p>
    </form>
  );
}

export default AuthForm;
