import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../services/apiClient', () => ({ apiClient: vi.fn() }));

import { apiClient } from '../../../../services/apiClient';
import {
  fetchFavouriteTeams,
  saveFavouriteTeam,
  deleteFavouriteTeam,
} from '../../../../features/favourites/services/favouritesApi';

describe('favouritesApi', () => {
  beforeEach(() => {
    apiClient.mockReset();
    apiClient.mockResolvedValue({ ok: true });
  });

  it('fetchFavouriteTeams gets /api/favourites', async () => {
    await fetchFavouriteTeams();
    expect(apiClient).toHaveBeenCalledWith('/api/favourites');
  });

  it('saveFavouriteTeam posts the payload to /api/favourites', async () => {
    const payload = { league: 'NBA', teamId: 'nba-lal', teamName: 'Los Angeles Lakers' };
    await saveFavouriteTeam(payload);
    expect(apiClient).toHaveBeenCalledWith('/api/favourites', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });

  it('deleteFavouriteTeam deletes /api/favourites/:favouriteId', async () => {
    await deleteFavouriteTeam('fav-1');
    expect(apiClient).toHaveBeenCalledWith('/api/favourites/fav-1', { method: 'DELETE' });
  });
});
