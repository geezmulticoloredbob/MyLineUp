import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../services/apiClient', () => ({ apiClient: vi.fn() }));

import { apiClient } from '../../../../services/apiClient';
import {
  loginUser,
  registerUser,
  fetchCurrentUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  updateUserIcon,
  updateProfile,
  updatePassword,
} from '../../../../features/auth/services/authApi';

describe('authApi', () => {
  beforeEach(() => {
    apiClient.mockReset();
    apiClient.mockResolvedValue({ ok: true });
  });

  it('loginUser posts credentials to /api/auth/login', async () => {
    await loginUser({ email: 'a@b.com', password: 'pw' });
    expect(apiClient).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pw' }),
    });
  });

  it('registerUser posts the payload to /api/auth/register', async () => {
    const payload = { username: 'alice', email: 'a@b.com', password: 'pw' };
    await registerUser(payload);
    expect(apiClient).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });

  it('fetchCurrentUser gets /api/auth/me', async () => {
    await fetchCurrentUser();
    expect(apiClient).toHaveBeenCalledWith('/api/auth/me');
  });

  it('forgotPassword posts the email to /api/auth/forgot-password', async () => {
    await forgotPassword('a@b.com');
    expect(apiClient).toHaveBeenCalledWith('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com' }),
    });
  });

  it('resetPassword posts the new password to /api/auth/reset-password/:token', async () => {
    await resetPassword('raw-token', 'NewPass1');
    expect(apiClient).toHaveBeenCalledWith('/api/auth/reset-password/raw-token', {
      method: 'POST',
      body: JSON.stringify({ password: 'NewPass1' }),
    });
  });

  it('logoutUser posts to /api/auth/logout', async () => {
    await logoutUser();
    expect(apiClient).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
  });

  it('updateUserIcon patches the iconId to /api/auth/icon', async () => {
    await updateUserIcon('trophy');
    expect(apiClient).toHaveBeenCalledWith('/api/auth/icon', {
      method: 'PATCH',
      body: JSON.stringify({ iconId: 'trophy' }),
    });
  });

  it('updateProfile patches the given updates to /api/auth/profile', async () => {
    await updateProfile({ username: 'newname' });
    expect(apiClient).toHaveBeenCalledWith('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'newname' }),
    });
  });

  it('updatePassword patches the payload to /api/auth/password', async () => {
    const payload = { currentPassword: 'old', newPassword: 'NewPass1' };
    await updatePassword(payload);
    expect(apiClient).toHaveBeenCalledWith('/api/auth/password', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  });
});
