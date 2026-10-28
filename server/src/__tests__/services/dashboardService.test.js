function chainable(resolvedValue) {
  const chain = {
    sort: jest.fn(() => chain),
    skip: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
  };
  return chain;
}

jest.mock('../../models/Favourite', () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
}));
jest.mock('../../models/PlayerFavourite', () => ({
  find: jest.fn(),
}));
jest.mock('../../services/sportsDataService', () => ({
  hydrateFavouriteTeams: jest.fn(),
  hydrateFavouritePlayers: jest.fn(),
}));
jest.mock('../../services/leagueService', () => ({ hydrateFollowedLeagues: jest.fn() }));

const { buildDashboard } = require('../../services/dashboardService');
const Favourite = require('../../models/Favourite');
const PlayerFavourite = require('../../models/PlayerFavourite');
const { hydrateFavouriteTeams, hydrateFavouritePlayers } = require('../../services/sportsDataService');
const { hydrateFollowedLeagues } = require('../../services/leagueService');

const user = { _id: 'u1', username: 'coen', email: 'coen@example.com', followedLeagues: ['NFL'], onboardingComplete: true };

beforeEach(() => {
  jest.clearAllMocks();
  Favourite.countDocuments.mockResolvedValue(1);
  Favourite.find.mockReturnValue(chainable([{ _id: 'f1', teamId: 'nfl-kc', teamName: 'Kansas City Chiefs', league: 'NFL' }]));
  PlayerFavourite.find.mockReturnValue(chainable([{ _id: 'pf1', playerId: '111', playerName: 'Patrick Mahomes', league: 'NFL' }]));
  hydrateFollowedLeagues.mockResolvedValue([]);
  hydrateFavouriteTeams.mockResolvedValue([{ favouriteId: 'f1', teamName: 'Kansas City Chiefs' }]);
  hydrateFavouritePlayers.mockResolvedValue([{ favouriteId: 'pf1', playerName: 'Patrick Mahomes' }]);
});

describe('buildDashboard', () => {
  it('includes hydrated teams and players alongside counts', async () => {
    const result = await buildDashboard(user);

    expect(hydrateFavouriteTeams).toHaveBeenCalledWith([{ _id: 'f1', teamId: 'nfl-kc', teamName: 'Kansas City Chiefs', league: 'NFL' }]);
    expect(hydrateFavouritePlayers).toHaveBeenCalledWith([{ _id: 'pf1', playerId: '111', playerName: 'Patrick Mahomes', league: 'NFL' }]);

    expect(result.teamCount).toBe(1);
    expect(result.teams).toEqual([{ favouriteId: 'f1', teamName: 'Kansas City Chiefs' }]);
    expect(result.playerCount).toBe(1);
    expect(result.players).toEqual([{ favouriteId: 'pf1', playerName: 'Patrick Mahomes' }]);
  });

  it('fetches all player favourites unpaginated, independent of the team page/limit', async () => {
    await buildDashboard(user, { page: 2, limit: 5 });

    const playerFindChain = PlayerFavourite.find.mock.results[0].value;
    expect(playerFindChain.skip).not.toHaveBeenCalled();
    expect(playerFindChain.limit).not.toHaveBeenCalled();
  });

  it('returns an empty players array when the user has no favourited players', async () => {
    PlayerFavourite.find.mockReturnValue(chainable([]));
    hydrateFavouritePlayers.mockResolvedValue([]);

    const result = await buildDashboard(user);
    expect(result.playerCount).toBe(0);
    expect(result.players).toEqual([]);
  });

  it('still returns user, pagination and leagueOverviews fields', async () => {
    const result = await buildDashboard(user, { page: 1, limit: 20 });
    expect(result.user).toEqual({
      id: 'u1', username: 'coen', email: 'coen@example.com', followedLeagues: ['NFL'], onboardingComplete: true,
    });
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(result.leagueOverviews).toEqual([]);
  });
});
