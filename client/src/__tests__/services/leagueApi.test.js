import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/apiClient', () => ({ apiClient: vi.fn() }));

import { apiClient } from '../../services/apiClient';
import { fetchFollowedLeagues, updateFollowedLeagues, completeOnboarding } from '../../services/leagueApi';

describe('leagueApi', () => {
  beforeEach(() => {
    apiClient.mockReset();
    apiClient.mockResolvedValue({ ok: true });
  });

  it('fetchFollowedLeagues gets /api/leagues', async () => {
    await fetchFollowedLeagues();
    expect(apiClient).toHaveBeenCalledWith('/api/leagues');
  });

  it('updateFollowedLeagues puts the leagues array to /api/leagues', async () => {
    await updateFollowedLeagues(['NBA', 'EPL']);
    expect(apiClient).toHaveBeenCalledWith('/api/leagues', {
      method: 'PUT',
      body: JSON.stringify({ leagues: ['NBA', 'EPL'] }),
    });
  });

  it('completeOnboarding posts to /api/leagues/complete-onboarding', async () => {
    await completeOnboarding();
    expect(apiClient).toHaveBeenCalledWith('/api/leagues/complete-onboarding', { method: 'POST' });
  });
});
