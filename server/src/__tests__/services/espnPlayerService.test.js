let mockFetchWithTimeout;
let mockGetESPNTeams;
let mockFindTeamByAbbr;
let mockFindTeamByName;
let mockEspnFetch;
let espnPlayerService;

function mockOk(data) {
  return Promise.resolve({ ok: true, status: 200, json: async () => data });
}

function mockFail(status = 500) {
  return Promise.resolve({ ok: false, status });
}

const FAKE_SPORT_CONFIG = {
  NFL: { sport: 'football', league: 'nfl' },
  NWSL: { sport: 'soccer', league: 'usa.nwsl' },
};

beforeEach(() => {
  jest.resetModules();
  mockFetchWithTimeout = jest.fn();
  mockGetESPNTeams = jest.fn();
  mockFindTeamByAbbr = jest.fn();
  mockFindTeamByName = jest.fn();
  mockEspnFetch = jest.fn();

  jest.doMock('../../utils/fetchWithTimeout', () => mockFetchWithTimeout);
  jest.doMock('../../services/espnTeamSportService', () => ({
    ESPN_SPORT_CONFIG: FAKE_SPORT_CONFIG,
    getESPNTeams: mockGetESPNTeams,
    findTeamByAbbr: mockFindTeamByAbbr,
    findTeamByName: mockFindTeamByName,
    espnFetch: mockEspnFetch,
  }));

  espnPlayerService = require('../../services/espnPlayerService');
});

const FLAT_ROSTER_RESPONSE = {
  athletes: [
    {
      id: 101,
      displayName: 'Jess Carter',
      position: { abbreviation: 'FWD' },
      jersey: '9',
      headshot: { href: 'http://img.example.com/101.png' },
    },
    {
      id: 102,
      displayName: 'No Headshot Player',
      position: { name: 'Midfielder' },
      jersey: '',
      headshot: null,
    },
  ],
};

const GROUPED_ROSTER_RESPONSE = {
  athletes: [
    { items: [{ id: 201, displayName: 'QB One', position: { abbreviation: 'QB' }, jersey: '7', headshot: { href: 'h.png' } }] },
    { items: [{ id: 202, displayName: 'WR One', position: { abbreviation: 'WR' }, jersey: '81' }] },
  ],
};

describe('getESPNRoster', () => {
  it('returns an empty array when the team cannot be resolved', async () => {
    mockGetESPNTeams.mockResolvedValue([]);
    mockFindTeamByAbbr.mockReturnValue(null);
    mockFindTeamByName.mockReturnValue(null);

    const players = await espnPlayerService.getESPNRoster('NFL', { teamId: 'nfl-zzz', teamName: 'Nobody' });

    expect(players).toEqual([]);
    expect(mockEspnFetch).not.toHaveBeenCalled();
  });

  it('resolves the team via abbreviation (prefix stripped from teamId) and fetches a flat roster', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '5', abbreviation: 'NWS' }]);
    mockFindTeamByAbbr.mockReturnValue({ id: '5', abbreviation: 'NWS' });
    mockEspnFetch.mockResolvedValue(mockOk(FLAT_ROSTER_RESPONSE));

    const players = await espnPlayerService.getESPNRoster('NWSL', { teamId: 'nwsl-nws', teamName: 'Some Club' });

    expect(mockFindTeamByAbbr).toHaveBeenCalledWith([{ id: '5', abbreviation: 'NWS' }], 'nws');
    expect(mockEspnFetch).toHaveBeenCalledWith('/soccer/usa.nwsl/teams/5/roster');
    expect(players).toEqual([
      { id: '101', name: 'Jess Carter', position: 'FWD', jersey: '9', headshotUrl: 'http://img.example.com/101.png' },
      { id: '102', name: 'No Headshot Player', position: 'Midfielder', jersey: '', headshotUrl: null },
    ]);
  });

  it('falls back to name matching when the abbreviation does not resolve', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '9', displayName: 'Some Club' }]);
    mockFindTeamByAbbr.mockReturnValue(null);
    mockFindTeamByName.mockReturnValue({ id: '9', displayName: 'Some Club' });
    mockEspnFetch.mockResolvedValue(mockOk({ athletes: [] }));

    await espnPlayerService.getESPNRoster('NWSL', { teamId: 'nwsl-xyz', teamName: 'Some Club' });

    expect(mockFindTeamByName).toHaveBeenCalledWith([{ id: '9', displayName: 'Some Club' }], 'Some Club');
    expect(mockEspnFetch).toHaveBeenCalledWith('/soccer/usa.nwsl/teams/9/roster');
  });

  it('flattens a roster grouped by position into a single player list', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '1', abbreviation: 'KC' }]);
    mockFindTeamByAbbr.mockReturnValue({ id: '1', abbreviation: 'KC' });
    mockEspnFetch.mockResolvedValue(mockOk(GROUPED_ROSTER_RESPONSE));

    const players = await espnPlayerService.getESPNRoster('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' });

    expect(players).toEqual([
      { id: '201', name: 'QB One', position: 'QB', jersey: '7', headshotUrl: 'h.png' },
      { id: '202', name: 'WR One', position: 'WR', jersey: '81', headshotUrl: null },
    ]);
  });

  it('throws when the ESPN roster fetch is not ok', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '1', abbreviation: 'KC' }]);
    mockFindTeamByAbbr.mockReturnValue({ id: '1', abbreviation: 'KC' });
    mockEspnFetch.mockResolvedValue(mockFail(503));

    await expect(
      espnPlayerService.getESPNRoster('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' })
    ).rejects.toThrow('ESPN NFL roster fetch failed: 503');
  });

  it('caches a successful roster and does not re-fetch within the TTL', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '1', abbreviation: 'KC' }]);
    mockFindTeamByAbbr.mockReturnValue({ id: '1', abbreviation: 'KC' });
    mockEspnFetch.mockResolvedValue(mockOk(FLAT_ROSTER_RESPONSE));

    await espnPlayerService.getESPNRoster('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' });
    await espnPlayerService.getESPNRoster('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' });

    expect(mockEspnFetch).toHaveBeenCalledTimes(1);
  });

  it('uses the raw teamId as the abbreviation to match when it has no league prefix', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '1', abbreviation: 'WEIRD' }]);
    mockFindTeamByAbbr.mockReturnValue({ id: '1', abbreviation: 'WEIRD' });
    mockEspnFetch.mockResolvedValue(mockOk({ athletes: [] }));

    await espnPlayerService.getESPNRoster('NFL', { teamId: 'WEIRD', teamName: 'Weird Team' });

    expect(mockFindTeamByAbbr).toHaveBeenCalledWith([{ id: '1', abbreviation: 'WEIRD' }], 'WEIRD');
  });

  it('treats a response with no athletes field at all as an empty roster', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '1', abbreviation: 'KC' }]);
    mockFindTeamByAbbr.mockReturnValue({ id: '1', abbreviation: 'KC' });
    mockEspnFetch.mockResolvedValue(mockOk({}));

    const players = await espnPlayerService.getESPNRoster('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' });

    expect(players).toEqual([]);
  });

  it('dedupes concurrent in-flight requests for the same team into a single fetch', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '1', abbreviation: 'KC' }]);
    mockFindTeamByAbbr.mockReturnValue({ id: '1', abbreviation: 'KC' });
    let resolveFetch;
    mockEspnFetch.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

    const first = espnPlayerService.getESPNRoster('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' });
    const second = espnPlayerService.getESPNRoster('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' });

    resolveFetch({ ok: true, status: 200, json: async () => FLAT_ROSTER_RESPONSE });
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(mockEspnFetch).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
  });
});

describe('getESPNPlayerData / getESPNPlayerStats', () => {
  it('fetches /stats and zips the latest season for a non-soccer league', async () => {
    mockFetchWithTimeout.mockResolvedValue(
      mockOk({
        categories: [
          {
            labels: ['PTS', 'REB'],
            statistics: [
              { stats: ['10', '5'] },
              { stats: ['22', '8'] }, // latest (last) row
            ],
          },
        ],
      })
    );

    const result = await espnPlayerService.getESPNPlayerData({ league: 'NFL', playerId: '201' });

    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      expect.stringContaining('/football/nfl/athletes/201/stats'),
      expect.any(Object)
    );
    expect(result).toEqual({
      stats: [{ label: 'PTS', value: '22' }, { label: 'REB', value: '8' }],
      dataAvailable: true,
    });
  });

  it('fetches /overview and zips the matching league split for a soccer league', async () => {
    mockFetchWithTimeout.mockResolvedValue(
      mockOk({
        statistics: {
          labels: ['G', 'A'],
          splits: [
            { leagueSlug: 'usa.nwsl', stats: ['3', '2'] },
            { leagueSlug: 'other.cup', stats: ['99', '99'] },
          ],
        },
      })
    );

    const result = await espnPlayerService.getESPNPlayerData({ league: 'NWSL', playerId: '101' });

    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      expect.stringContaining('/soccer/usa.nwsl/athletes/101/overview'),
      expect.any(Object)
    );
    expect(result).toEqual({ stats: [{ label: 'G', value: '3' }, { label: 'A', value: '2' }], dataAvailable: true });
  });

  it('falls back to the first split when no split matches the league slug', async () => {
    mockFetchWithTimeout.mockResolvedValue(
      mockOk({
        statistics: {
          labels: ['G'],
          splits: [{ leagueSlug: 'some.other.league', stats: ['7'] }],
        },
      })
    );

    const result = await espnPlayerService.getESPNPlayerData({ league: 'NWSL', playerId: '101' });

    expect(result.stats).toEqual([{ label: 'G', value: '7' }]);
  });

  it('returns no stats when there are no splits at all', async () => {
    mockFetchWithTimeout.mockResolvedValue(mockOk({ statistics: { labels: ['G'], splits: [] } }));

    const result = await espnPlayerService.getESPNPlayerData({ league: 'NWSL', playerId: '101' });

    expect(result).toEqual({ stats: [], dataAvailable: true });
  });

  it('filters out stat labels whose latest value is undefined', async () => {
    mockFetchWithTimeout.mockResolvedValue(
      mockOk({
        categories: [{ labels: ['PTS', 'REB'], statistics: [{ stats: ['10'] }] }],
      })
    );

    const result = await espnPlayerService.getESPNPlayerData({ league: 'NFL', playerId: '201' });

    expect(result.stats).toEqual([{ label: 'PTS', value: '10' }]);
  });

  it('returns no stats when there are no categories at all', async () => {
    mockFetchWithTimeout.mockResolvedValue(mockOk({ categories: [] }));

    const result = await espnPlayerService.getESPNPlayerData({ league: 'NFL', playerId: '201' });

    expect(result).toEqual({ stats: [], dataAvailable: true });
  });

  it('returns no stats when the categories field is missing from the response entirely', async () => {
    mockFetchWithTimeout.mockResolvedValue(mockOk({}));

    const result = await espnPlayerService.getESPNPlayerData({ league: 'NFL', playerId: '201' });

    expect(result).toEqual({ stats: [], dataAvailable: true });
  });

  it('returns no stats when a category has no statistics rows at all', async () => {
    mockFetchWithTimeout.mockResolvedValue(mockOk({ categories: [{ labels: ['PTS'], statistics: [] }] }));

    const result = await espnPlayerService.getESPNPlayerData({ league: 'NFL', playerId: '201' });

    expect(result).toEqual({ stats: [], dataAvailable: true });
  });

  it('degrades to dataAvailable: false when the stats fetch is not ok, without throwing', async () => {
    mockFetchWithTimeout.mockResolvedValue(mockFail(404));

    const result = await espnPlayerService.getESPNPlayerData({ league: 'NFL', playerId: '201' });

    expect(result).toEqual({ stats: [], dataAvailable: false });
  });

  it('caches player stats and does not re-fetch within the TTL', async () => {
    mockFetchWithTimeout.mockResolvedValue(mockOk({ categories: [] }));

    await espnPlayerService.getESPNPlayerData({ league: 'NFL', playerId: '201' });
    await espnPlayerService.getESPNPlayerData({ league: 'NFL', playerId: '201' });

    expect(mockFetchWithTimeout).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent in-flight requests for the same player into a single fetch', async () => {
    let resolveFetch;
    mockFetchWithTimeout.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

    const first = espnPlayerService.getESPNPlayerData({ league: 'NFL', playerId: '201' });
    const second = espnPlayerService.getESPNPlayerData({ league: 'NFL', playerId: '201' });

    resolveFetch({ ok: true, status: 200, json: async () => ({ categories: [] }) });
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(mockFetchWithTimeout).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
  });
});

describe('getESPNTeamTopScorers', () => {
  it('ranks players by the given stat label, descending, limited to count', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '1', abbreviation: 'KC' }]);
    mockFindTeamByAbbr.mockReturnValue({ id: '1', abbreviation: 'KC' });
    mockEspnFetch.mockResolvedValue(mockOk(GROUPED_ROSTER_RESPONSE)); // players 201, 202

    mockFetchWithTimeout.mockImplementation((url) => {
      if (url.includes('/athletes/201/')) {
        return mockOk({ categories: [{ labels: ['PTS'], statistics: [{ stats: ['30'] }] }] });
      }
      if (url.includes('/athletes/202/')) {
        return mockOk({ categories: [{ labels: ['PTS'], statistics: [{ stats: ['12'] }] }] });
      }
      return mockOk({ categories: [] });
    });

    const result = await espnPlayerService.getESPNTeamTopScorers('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' }, 'PTS', 2);

    expect(result).toEqual([
      { name: 'QB One', value: 30, display: '30' },
      { name: 'WR One', value: 12, display: '12' },
    ]);
  });

  it('excludes players missing the requested stat label or with a non-numeric value', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '1', abbreviation: 'KC' }]);
    mockFindTeamByAbbr.mockReturnValue({ id: '1', abbreviation: 'KC' });
    mockEspnFetch.mockResolvedValue(mockOk(GROUPED_ROSTER_RESPONSE));

    mockFetchWithTimeout.mockImplementation((url) => {
      if (url.includes('/athletes/201/')) {
        return mockOk({ categories: [{ labels: ['REB'], statistics: [{ stats: ['9'] }] }] }); // no PTS label
      }
      return mockFail(404); // 202's stats fetch fails entirely
    });

    const result = await espnPlayerService.getESPNTeamTopScorers('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' }, 'PTS');

    expect(result).toEqual([]);
  });

  it('defaults to a roster of [] when the roster fetch itself fails, rather than throwing', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '1', abbreviation: 'KC' }]);
    mockFindTeamByAbbr.mockReturnValue({ id: '1', abbreviation: 'KC' });
    mockEspnFetch.mockResolvedValue(mockFail(500));

    const result = await espnPlayerService.getESPNTeamTopScorers('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' }, 'PTS');

    expect(result).toEqual([]);
    expect(mockFetchWithTimeout).not.toHaveBeenCalled();
  });

  it('defaults count to 2 when not provided', async () => {
    mockGetESPNTeams.mockResolvedValue([{ id: '1', abbreviation: 'KC' }]);
    mockFindTeamByAbbr.mockReturnValue({ id: '1', abbreviation: 'KC' });
    mockEspnFetch.mockResolvedValue(
      mockOk({
        athletes: [
          { items: [{ id: 1, displayName: 'P1' }, { id: 2, displayName: 'P2' }, { id: 3, displayName: 'P3' }] },
        ],
      })
    );
    let n = 30;
    mockFetchWithTimeout.mockImplementation(() => {
      const value = String(n);
      n -= 10;
      return mockOk({ categories: [{ labels: ['PTS'], statistics: [{ stats: [value] }] }] });
    });

    const result = await espnPlayerService.getESPNTeamTopScorers('NFL', { teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' }, 'PTS');

    expect(result).toHaveLength(2);
  });
});
