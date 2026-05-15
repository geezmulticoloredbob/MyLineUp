import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import * as authApi from '../../features/auth/services/authApi';

vi.mock('../../features/auth/services/authApi');

function TestConsumer() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p>loading</p>;
  if (!user) return <p>no user</p>;
  return (
    <>
      <p data-testid="username">{user.username}</p>
      <button onClick={logout}>logout</button>
    </>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('resolves to no-user state when the server returns 401', async () => {
    authApi.fetchCurrentUser.mockRejectedValue(new Error('Unauthorized'));
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('no user')).toBeInTheDocument());
  });

  it('fetches and shows the current user when a valid session cookie exists', async () => {
    authApi.fetchCurrentUser.mockResolvedValue({ user: { id: '1', username: 'alice' } });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('username')).toHaveTextContent('alice'));
  });

  it('login sets the user from the server response', async () => {
    authApi.fetchCurrentUser.mockRejectedValue(new Error('Unauthorized'));
    authApi.loginUser.mockResolvedValue({ user: { id: '1', username: 'bob' } });

    function LoginButton() {
      const { login, user } = useAuth();
      if (user) return <p data-testid="username">{user.username}</p>;
      return <button onClick={() => login({ email: 'bob@example.com', password: 'pass' })}>login</button>;
    }

    render(<AuthProvider><LoginButton /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('login')).toBeInTheDocument());

    await act(async () => { screen.getByText('login').click(); });

    await waitFor(() => expect(screen.getByTestId('username')).toHaveTextContent('bob'));
  });

  it('logout calls the server endpoint and clears the user', async () => {
    authApi.fetchCurrentUser.mockResolvedValue({ user: { id: '1', username: 'alice' } });
    authApi.logoutUser.mockResolvedValue({ message: 'Logged out' });

    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('username')).toHaveTextContent('alice'));

    await act(async () => { screen.getByText('logout').click(); });

    await waitFor(() => expect(screen.getByText('no user')).toBeInTheDocument());
    expect(authApi.logoutUser).toHaveBeenCalled();
  });

  it('logout still clears the user even if the server call fails', async () => {
    authApi.fetchCurrentUser.mockResolvedValue({ user: { id: '1', username: 'alice' } });
    authApi.logoutUser.mockRejectedValue(new Error('Network error'));

    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('username')).toHaveTextContent('alice'));

    await act(async () => { screen.getByText('logout').click(); });

    await waitFor(() => expect(screen.getByText('no user')).toBeInTheDocument());
  });

  it('register sets the user from the server response', async () => {
    authApi.fetchCurrentUser.mockRejectedValue(new Error('Unauthorized'));
    authApi.registerUser.mockResolvedValue({ user: { id: '2', username: 'carol' } });

    function RegisterButton() {
      const { register, user } = useAuth();
      if (user) return <p data-testid="username">{user.username}</p>;
      return (
        <button onClick={() => register({ username: 'carol', email: 'carol@example.com', password: 'pass' })}>
          register
        </button>
      );
    }

    render(<AuthProvider><RegisterButton /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('register')).toBeInTheDocument());

    await act(async () => { screen.getByText('register').click(); });

    await waitFor(() => expect(screen.getByTestId('username')).toHaveTextContent('carol'));
  });

  it('updateUser merges fields into the existing user', async () => {
    authApi.fetchCurrentUser.mockResolvedValue({
      user: { id: '1', username: 'alice', onboardingComplete: false },
    });

    function UpdateButton() {
      const { user, updateUser } = useAuth();
      return (
        <>
          <p data-testid="flag">{String(user?.onboardingComplete)}</p>
          <button onClick={() => updateUser({ onboardingComplete: true })}>update</button>
        </>
      );
    }

    render(<AuthProvider><UpdateButton /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('flag')).toHaveTextContent('false'));

    await act(async () => { screen.getByText('update').click(); });

    expect(screen.getByTestId('flag')).toHaveTextContent('true');
  });
});
