import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext');

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a bare loading screen with no message while still under the cold-start delay', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    render(
      <MemoryRouter>
        <ProtectedRoute><p>secret</p></ProtectedRoute>
      </MemoryRouter>
    );
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.queryByText(/waking up the server/i)).not.toBeInTheDocument();
  });

  it('shows the cold-start message once loading has lasted past the delay', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    render(
      <MemoryRouter>
        <ProtectedRoute><p>secret</p></ProtectedRoute>
      </MemoryRouter>
    );
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByText(/waking up the server/i)).toBeInTheDocument();
  });

  it('renders children once loading resolves with a user, without ever showing the message', () => {
    useAuth.mockReturnValue({ user: { onboardingComplete: true }, loading: false });
    render(
      <MemoryRouter>
        <ProtectedRoute><p>secret</p></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('secret')).toBeInTheDocument();
    expect(screen.queryByText(/waking up the server/i)).not.toBeInTheDocument();
  });
});
