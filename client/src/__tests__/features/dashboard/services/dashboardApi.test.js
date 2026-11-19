import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../services/apiClient', () => ({ apiClient: vi.fn() }));

import { apiClient } from '../../../../services/apiClient';
import { fetchTeamTrend } from '../../../../features/dashboard/services/dashboardApi';

describe('dashboardApi', () => {
  beforeEach(() => {
    apiClient.mockReset();
    apiClient.mockResolvedValue({ ok: true });
  });

  it('fetchTeamTrend gets /api/dashboard/trend/:league/:teamId, passing through options', async () => {
    const options = { signal: 'abort-signal' };
    await fetchTeamTrend('NBA', 'nba-bos', options);
    expect(apiClient).toHaveBeenCalledWith('/api/dashboard/trend/NBA/nba-bos', options);
  });
});
