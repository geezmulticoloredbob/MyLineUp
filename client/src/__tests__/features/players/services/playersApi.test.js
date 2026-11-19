import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../services/apiClient', () => ({ apiClient: vi.fn() }));

import { apiClient } from '../../../../services/apiClient';
import {
  fetchRoster,
  fetchPlayerFavourites,
  savePlayerFavourite,
  deletePlayerFavourite,
} from '../../../../features/players/services/playersApi';

describe('playersApi', () => {
  beforeEach(() => {
    apiClient.mockReset();
    apiClient.mockResolvedValue({ ok: true });
  });

  it('fetchRoster gets the roster with no query string when teamName is omitted', async () => {
    await fetchRoster('NFL', 'nfl-kc');
    expect(apiClient).toHaveBeenCalledWith('/api/players/roster/NFL/nfl-kc');
  });

  it('fetchRoster appends an encoded teamName query param when provided', async () => {
    await fetchRoster('NFL', 'nfl-kc', 'Kansas City Chiefs');
    expect(apiClient).toHaveBeenCalledWith('/api/players/roster/NFL/nfl-kc?teamName=Kansas%20City%20Chiefs');
  });

  it('fetchPlayerFavourites gets /api/players/favourites', async () => {
    await fetchPlayerFavourites();
    expect(apiClient).toHaveBeenCalledWith('/api/players/favourites');
  });

  it('savePlayerFavourite posts the payload to /api/players/favourites', async () => {
    const payload = { league: 'NFL', playerId: '1', playerName: 'Alex Smith', teamId: 'nfl-kc' };
    await savePlayerFavourite(payload);
    expect(apiClient).toHaveBeenCalledWith('/api/players/favourites', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });

  it('deletePlayerFavourite deletes /api/players/favourites/:favouriteId', async () => {
    await deletePlayerFavourite('pf-1');
    expect(apiClient).toHaveBeenCalledWith('/api/players/favourites/pf-1', { method: 'DELETE' });
  });
});
