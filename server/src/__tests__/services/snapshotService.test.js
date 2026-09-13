jest.mock('../../models/Favourite', () => ({ aggregate: jest.fn() }));
jest.mock('../../models/TeamSnapshot', () => ({ findOneAndUpdate: jest.fn(), find: jest.fn() }));
jest.mock('../../services/sportsDataService', () => ({ hydrateFavouriteTeams: jest.fn() }));

const Favourite = require('../../models/Favourite');
const TeamSnapshot = require('../../models/TeamSnapshot');
const { hydrateFavouriteTeams } = require('../../services/sportsDataService');
const { captureSnapshots, getTeamHistory } = require('../../services/snapshotService');

describe('captureSnapshots', () => {
  beforeEach(() => {
    Favourite.aggregate.mockResolvedValue([
      { _id: { league: 'NBA', teamId: 'nba-bos' }, teamName: 'Boston Celtics', teamLogoUrl: '' },
      { _id: { league: 'EPL', teamId: 'epl-ars' }, teamName: 'Arsenal', teamLogoUrl: '' },
    ]);
    TeamSnapshot.findOneAndUpdate.mockResolvedValue({});
  });

  it('groups favourites into distinct teams before hydrating', async () => {
    hydrateFavouriteTeams.mockResolvedValue([
      { league: 'NBA', teamId: 'nba-bos', teamName: 'Boston Celtics', dataAvailable: true, latestResult: {}, ladderPosition: 1, stats: {} },
      { league: 'EPL', teamId: 'epl-ars', teamName: 'Arsenal', dataAvailable: true, latestResult: {}, ladderPosition: 2, stats: {} },
    ]);

    await captureSnapshots();

    expect(hydrateFavouriteTeams).toHaveBeenCalledWith([
      { league: 'NBA', teamId: 'nba-bos', teamName: 'Boston Celtics', teamLogoUrl: '' },
      { league: 'EPL', teamId: 'epl-ars', teamName: 'Arsenal', teamLogoUrl: '' },
    ]);
  });

  it('upserts a snapshot for each team with data available', async () => {
    hydrateFavouriteTeams.mockResolvedValue([
      { league: 'NBA', teamId: 'nba-bos', teamName: 'Boston Celtics', dataAvailable: true, latestResult: { outcome: 'W' }, ladderPosition: 1, stats: { wins: 10 } },
      { league: 'EPL', teamId: 'epl-ars', teamName: 'Arsenal', dataAvailable: true, latestResult: { outcome: 'L' }, ladderPosition: 4, stats: { wins: 8 } },
    ]);

    const result = await captureSnapshots();

    expect(TeamSnapshot.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(TeamSnapshot.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ league: 'NBA', teamId: 'nba-bos' }),
      expect.objectContaining({ latestResult: { outcome: 'W' }, ladderPosition: 1, stats: { wins: 10 } }),
      expect.objectContaining({ upsert: true })
    );
    expect(result).toEqual({ teamsConsidered: 2, captured: 2, skipped: 0 });
  });

  it('skips teams whose data was unavailable, without upserting a snapshot for them', async () => {
    hydrateFavouriteTeams.mockResolvedValue([
      { league: 'NBA', teamId: 'nba-bos', teamName: 'Boston Celtics', dataAvailable: true, latestResult: {}, ladderPosition: 1, stats: {} },
      { league: 'EPL', teamId: 'epl-ars', teamName: 'Arsenal', dataAvailable: false },
    ]);

    const result = await captureSnapshots();

    expect(TeamSnapshot.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ teamsConsidered: 2, captured: 1, skipped: 1 });
  });

  it('uses the same capturedOn key (today, UTC) for every team in one run', async () => {
    hydrateFavouriteTeams.mockResolvedValue([
      { league: 'NBA', teamId: 'nba-bos', teamName: 'Boston Celtics', dataAvailable: true, latestResult: {}, ladderPosition: 1, stats: {} },
      { league: 'EPL', teamId: 'epl-ars', teamName: 'Arsenal', dataAvailable: true, latestResult: {}, ladderPosition: 2, stats: {} },
    ]);

    await captureSnapshots();

    const todayKey = new Date().toISOString().slice(0, 10);
    const capturedOnValues = TeamSnapshot.findOneAndUpdate.mock.calls.map(([filter]) => filter.capturedOn);
    expect(capturedOnValues).toEqual([todayKey, todayKey]);
  });
});

describe('getTeamHistory', () => {
  it('returns snapshots oldest-first for the given team', async () => {
    const sortMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockResolvedValue([{ capturedOn: '2026-09-02' }, { capturedOn: '2026-09-01' }]);
    TeamSnapshot.find.mockReturnValue({ sort: sortMock, limit: limitMock });

    const history = await getTeamHistory('NBA', 'nba-bos');

    expect(TeamSnapshot.find).toHaveBeenCalledWith({ league: 'NBA', teamId: 'nba-bos' });
    expect(sortMock).toHaveBeenCalledWith({ capturedOn: -1 });
    expect(history).toEqual([{ capturedOn: '2026-09-01' }, { capturedOn: '2026-09-02' }]);
  });
});
