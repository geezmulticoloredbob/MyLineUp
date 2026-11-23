let mockFetch;
let nbaService;

function mockOk(data) {
  return Promise.resolve({ ok: true, status: 200, json: async () => data });
}

function mockFail(status = 500) {
  return Promise.resolve({ ok: false, status });
}

const MOCK_TEAMS = [
  { id: 1, abbreviation: 'ATL', full_name: 'Atlanta Hawks' },
  { id: 2, abbreviation: 'BOS', full_name: 'Boston Celtics' },
];

const MOCK_STANDINGS = [
  { team: { id: 1, abbreviation: 'ATL', full_name: 'Atlanta Hawks' }, wins: 40, losses: 30, conference: { rank: 3 } },
  { team: { id: 2, abbreviation: 'BOS', full_name: 'Boston Celtics' }, wins: 55, losses: 15, conference: { rank: 1 } },
];

const MOCK_FINISHED_GAME = {
  id: 101,
  date: '2024-01-15T00:00:00.000Z',
  status: 'Final',
  home_team: { id: 1, abbreviation: 'ATL', full_name: 'Atlanta Hawks' },
  visitor_team: { id: 2, abbreviation: 'BOS', full_name: 'Boston Celtics' },
  home_team_score: 110,
  visitor_team_score: 105,
};

beforeEach(() => {
  jest.resetModules();
  mockFetch = jest.fn();
  jest.doMock('../../utils/fetchWithTimeout', () => mockFetch);
  // Bypass real request spacing here — it's unit-tested on its own in
  // requestThrottle.test.js and would otherwise add real multi-second
  // delays to these tests via its real setTimeout-based throttling.
  jest.doMock('../../utils/requestThrottle', () => ({ throttle: (bucket, ms, fn) => fn() }));
  jest.doMock('../../config/env', () => ({ basketballApiKey: 'test-key' }));
  nbaService = require('../../services/nbaService');
});

const MOCK_UPCOMING_GAME_JAN = {
  id: 201,
  date: '2026-01-20T00:00:00.000Z',
  status: '7:00 pm ET',
  home_team: { id: 1, abbreviation: 'ATL', full_name: 'Atlanta Hawks' },
  visitor_team: { id: 2, abbreviation: 'BOS', full_name: 'Boston Celtics' },
};

const MOCK_UPCOMING_GAME_JULY = {
  ...MOCK_UPCOMING_GAME_JAN,
  id: 202,
  date: '2026-07-20T00:00:00.000Z',
};

describe('getNBAStandings', () => {
  it('returns standings sorted by conference rank', async () => {
    mockFetch.mockResolvedValue(mockOk({ data: MOCK_STANDINGS }));
    const result = await nbaService.getNBAStandings();
    expect(result).toHaveLength(2);
    expect(result[0].teamName).toBe('Boston Celtics');
    expect(result[0].stats.wins).toBe(55);
    expect(result[1].teamName).toBe('Atlanta Hawks');
  });

  it('returns an empty array when the API call fails', async () => {
    mockFetch.mockResolvedValue(mockFail());
    const result = await nbaService.getNBAStandings();
    expect(result).toEqual([]);
  });

  it('uses cache on second call (fetch called only once)', async () => {
    mockFetch.mockResolvedValue(mockOk({ data: MOCK_STANDINGS }));
    await nbaService.getNBAStandings();
    await nbaService.getNBAStandings();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('includes logoUrl and position in each entry', async () => {
    mockFetch.mockResolvedValue(mockOk({ data: MOCK_STANDINGS }));
    const result = await nbaService.getNBAStandings();
    expect(result[0]).toMatchObject({ position: expect.any(Number), logoUrl: expect.any(String) });
  });
});

describe('getNBALeagueGames', () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('standings')) return mockOk({ data: MOCK_STANDINGS });
      return mockOk({ data: [MOCK_FINISHED_GAME] });
    });
  });

  it('returns recentResults and upcomingFixtures', async () => {
    const result = await nbaService.getNBALeagueGames();
    expect(result).toHaveProperty('recentResults');
    expect(result).toHaveProperty('upcomingFixtures');
  });

  it('only includes Final games in recentResults', async () => {
    const pending = { ...MOCK_FINISHED_GAME, id: 999, status: 'Scheduled' };
    mockFetch.mockImplementation((url) => {
      if (url.includes('standings')) return mockOk({ data: MOCK_STANDINGS });
      return mockOk({ data: [MOCK_FINISHED_GAME, pending] });
    });
    const { recentResults } = await nbaService.getNBALeagueGames();
    expect(recentResults.every((g) => g.homeScore !== undefined)).toBe(true);
    expect(recentResults).toHaveLength(1);
  });

  it('caps recentResults at 5', async () => {
    const games = Array.from({ length: 10 }, (_, i) => ({ ...MOCK_FINISHED_GAME, id: i }));
    mockFetch.mockResolvedValue(mockOk({ data: games }));
    const { recentResults } = await nbaService.getNBALeagueGames();
    expect(recentResults.length).toBeLessThanOrEqual(5);
  });

  it('uses cache on second call (games fetched only once)', async () => {
    await nbaService.getNBALeagueGames();
    await nbaService.getNBALeagueGames();
    const gamesCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/games'));
    expect(gamesCalls.length).toBe(2); // one past + one future window fetch, not doubled
  });

  it('rejects when the league-wide games fetch fails', async () => {
    mockFetch.mockResolvedValue(mockFail(502));
    await expect(nbaService.getNBALeagueGames()).rejects.toThrow('BDL league games fetch failed: 502');
  });
});

describe('getNBATeamData', () => {
  it('returns null for an unknown team abbreviation', async () => {
    mockFetch.mockResolvedValue(mockOk({ data: MOCK_TEAMS }));
    const result = await nbaService.getNBATeamData({ teamId: 'nba-zzz' });
    expect(result).toBeNull();
  });

  it('picks the most recent of several finished games as latestResult', async () => {
    const olderGame = { ...MOCK_FINISHED_GAME, id: 100, date: '2024-01-01T00:00:00.000Z', home_team_score: 90, visitor_team_score: 100 };
    const newerGame = { ...MOCK_FINISHED_GAME, id: 101, date: '2024-01-15T00:00:00.000Z' };
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
      if (url.includes(`start_date=${new Date().toISOString().split('T')[0]}`)) {
        return mockOk({ data: [] });
      }
      return mockOk({ data: [olderGame, newerGame] });
    });
    const result = await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    expect(result.latestResult.date).toBe('2024-01-15');
  });

  it('returns team data with latestResult for a known team', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
      return mockOk({ data: [MOCK_FINISHED_GAME] });
    });
    const result = await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    expect(result).not.toBeNull();
    expect(result.latestResult).not.toBeNull();
    expect(result.latestResult.outcome).toBe('W');
    expect(result.ladderPosition).toBe(3);
    expect(result.logoUrl).toContain('atl');
  });

  it('returns null latestResult when no games are returned', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
      return mockOk({ data: [] });
    });
    const result = await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    expect(result.latestResult).toBeNull();
    expect(result.nextFixture).toBeNull();
  });

  it('uses cache on second call for the same team (games fetched only once)', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
      return mockOk({ data: [MOCK_FINISHED_GAME] });
    });
    await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    const gamesCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/games'));
    expect(gamesCalls.length).toBe(2); // one past + one future window fetch, not doubled
  });

  it('keeps separate game caches per team', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
      return mockOk({ data: [MOCK_FINISHED_GAME] });
    });
    await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    await nbaService.getNBATeamData({ teamId: 'nba-bos' });
    const gamesCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/games'));
    expect(gamesCalls.length).toBe(4);
  });

  it('computes nextFixture.utcDate in winter (EST, UTC-5)', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
      if (url.includes(`start_date=${new Date().toISOString().split('T')[0]}`)) {
        // future-window call
        return mockOk({ data: [MOCK_UPCOMING_GAME_JAN] });
      }
      return mockOk({ data: [] });
    });
    const result = await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    expect(result.nextFixture).not.toBeNull();
    // 7:00 pm ET in January (EST, UTC-5) is 00:00 UTC the next day
    expect(result.nextFixture.utcDate).toBe('2026-01-21T00:00:00.000Z');
  });

  it('computes nextFixture.utcDate in summer (EDT, UTC-4)', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
      if (url.includes(`start_date=${new Date().toISOString().split('T')[0]}`)) {
        return mockOk({ data: [MOCK_UPCOMING_GAME_JULY] });
      }
      return mockOk({ data: [] });
    });
    const result = await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    expect(result.nextFixture).not.toBeNull();
    // 7:00 pm ET in July (EDT, UTC-4) is 23:00 UTC the same day
    expect(result.nextFixture.utcDate).toBe('2026-07-20T23:00:00.000Z');
  });

  it('leaves nextFixture.utcDate null when the status string has no parseable time', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
      if (url.includes(`start_date=${new Date().toISOString().split('T')[0]}`)) {
        return mockOk({ data: [{ ...MOCK_UPCOMING_GAME_JAN, status: 'Postponed' }] });
      }
      return mockOk({ data: [] });
    });
    const result = await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    expect(result.nextFixture.utcDate).toBeNull();
  });

  it('rejects when the teams list fetch fails', async () => {
    mockFetch.mockResolvedValue(mockFail(500));
    await expect(nbaService.getNBATeamData({ teamId: 'nba-atl' })).rejects.toThrow('BallDontLie teams fetch failed: 500');
  });

  it('rejects when the per-team games fetch fails', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
      return mockFail(503);
    });
    await expect(nbaService.getNBATeamData({ teamId: 'nba-atl' })).rejects.toThrow('BDL games fetch failed: 503');
  });

  it('falls back to a null ladderPosition and empty stats when the standings fetch fails', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockFail(500);
      return mockOk({ data: [MOCK_FINISHED_GAME] });
    });
    const result = await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    expect(result.ladderPosition).toBeNull();
    expect(result.stats).toEqual({});
  });

  it('marks the season finished during the off-season window regardless of fixtures', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-15T00:00:00Z'));
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
      return mockOk({ data: [] });
    });
    const result = await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    expect(result.seasonFinished).toBe(true);
    jest.useRealTimers();
  });

  it('marks the season not finished in-season when there are upcoming fixtures', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
      if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
      if (url.includes(`start_date=${new Date().toISOString().split('T')[0]}`)) {
        return mockOk({ data: [MOCK_UPCOMING_GAME_JAN] });
      }
      return mockOk({ data: [] });
    });
    const result = await nbaService.getNBATeamData({ teamId: 'nba-atl' });
    expect(result.seasonFinished).toBe(false);
  });

  // topScorers used to come from BallDontLie's season_averages endpoint,
  // which is paid-tier-only (confirmed live: 401 even with a valid free
  // key) — it silently emptied this field in production rather than ever
  // erroring. Now sourced from ESPN instead (see espnPlayerService.js).
  // Routed by hostname, not just path, since both BallDontLie's and ESPN's
  // /teams endpoints share the substring "/teams".
  describe('topScorers (ESPN-based)', () => {
    const ESPN_TEAM = {
      sports: [{ leagues: [{ teams: [{
        team: { id: '2', abbreviation: 'BOS', displayName: 'Boston Celtics', shortDisplayName: 'Celtics', name: 'Celtics', location: 'Boston' },
      }] }] }],
    };
    const ESPN_ROSTER = {
      athletes: [
        { id: '111', displayName: 'Jayson Tatum', position: { abbreviation: 'F' }, jersey: '0', headshot: { href: 'x' } },
        { id: '222', displayName: 'Jaylen Brown', position: { abbreviation: 'G' }, jersey: '7', headshot: { href: 'y' } },
      ],
    };
    function statsFor(pts) {
      return { categories: [{ name: 'averages', labels: ['PTS'], statistics: [{ stats: [String(pts)] }] }] };
    }

    function mockWithESPN() {
      return (url) => {
        if (url.includes('site.web.api.espn.com')) {
          const id = url.match(/athletes\/(\d+)\/stats/)?.[1];
          return mockOk(id === '111' ? statsFor(30.5) : statsFor(25.1));
        }
        if (url.includes('site.api.espn.com') && url.includes('/roster')) return mockOk(ESPN_ROSTER);
        if (url.includes('site.api.espn.com')) return mockOk(ESPN_TEAM);
        if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS }); // BallDontLie
        if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
        return mockOk({ data: [MOCK_FINISHED_GAME] });
      };
    }

    it('ranks real ESPN-sourced players by points per game', async () => {
      mockFetch.mockImplementation(mockWithESPN());
      const result = await nbaService.getNBATeamData({ teamId: 'nba-bos', teamName: 'Boston Celtics' });
      expect(result.topScorers).toEqual([
        { name: 'Jayson Tatum', stat: '30.5 pts/g' },
        { name: 'Jaylen Brown', stat: '25.1 pts/g' },
      ]);
    });

    it('returns an empty array, not a thrown error, when ESPN roster fetch fails', async () => {
      mockFetch.mockImplementation((url) => {
        if (url.includes('/roster')) return mockFail();
        if (url.includes('site.api.espn.com')) return mockOk(ESPN_TEAM);
        if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
        if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
        return mockOk({ data: [MOCK_FINISHED_GAME] });
      });
      const result = await nbaService.getNBATeamData({ teamId: 'nba-bos', teamName: 'Boston Celtics' });
      expect(result.topScorers).toEqual([]);
    });

    it('returns an empty array, not a thrown error, even if the ESPN top-scorers helper itself rejects unexpectedly', async () => {
      jest.resetModules();
      const isolatedMockFetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/teams')) return mockOk({ data: MOCK_TEAMS });
        if (url.includes('/standings')) return mockOk({ data: MOCK_STANDINGS });
        return mockOk({ data: [MOCK_FINISHED_GAME] });
      });
      jest.doMock('../../utils/fetchWithTimeout', () => isolatedMockFetch);
      jest.doMock('../../utils/requestThrottle', () => ({ throttle: (bucket, ms, fn) => fn() }));
      jest.doMock('../../config/env', () => ({ basketballApiKey: 'test-key' }));
      jest.doMock('../../services/espnPlayerService', () => ({
        getESPNTeamTopScorers: jest.fn().mockRejectedValue(new Error('ESPN blew up unexpectedly')),
      }));
      const isolatedNbaService = require('../../services/nbaService');

      const result = await isolatedNbaService.getNBATeamData({ teamId: 'nba-bos', teamName: 'Boston Celtics' });

      expect(result.topScorers).toEqual([]);
    });
  });
});
