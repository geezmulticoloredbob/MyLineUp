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
});

describe('getNBATeamData', () => {
  it('returns null for an unknown team abbreviation', async () => {
    mockFetch.mockResolvedValue(mockOk({ data: MOCK_TEAMS }));
    const result = await nbaService.getNBATeamData({ teamId: 'nba-zzz' });
    expect(result).toBeNull();
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
});
