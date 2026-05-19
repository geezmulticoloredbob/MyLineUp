let mockFetch;
let footballService;

function mockOk(data) {
  return Promise.resolve({ ok: true, status: 200, json: async () => data });
}

function mockFail(status = 500) {
  return Promise.resolve({ ok: false, status });
}

const MOCK_PL_TEAMS = [
  { id: 57, name: 'Arsenal FC', shortName: 'Arsenal', crest: 'https://crests.football-data.org/57.png' },
  { id: 61, name: 'Chelsea FC', shortName: 'Chelsea', crest: 'https://crests.football-data.org/61.png' },
];

const MOCK_STANDINGS_TABLE = [
  { position: 1, team: { id: 57, name: 'Arsenal FC', shortName: 'Arsenal' }, playedGames: 30, won: 20, draw: 5, lost: 5, points: 65, goalDifference: 30 },
  { position: 2, team: { id: 61, name: 'Chelsea FC', shortName: 'Chelsea' }, playedGames: 30, won: 18, draw: 6, lost: 6, points: 60, goalDifference: 20 },
];

const MOCK_FINISHED_MATCH = {
  id: 201,
  utcDate: '2024-01-15T20:00:00Z',
  homeTeam: { id: 57, name: 'Arsenal FC', shortName: 'Arsenal' },
  awayTeam: { id: 61, name: 'Chelsea FC', shortName: 'Chelsea' },
  score: { fullTime: { home: 2, away: 1 }, winner: 'HOME_TEAM' },
};

const MOCK_SCHEDULED_MATCH = {
  id: 202,
  utcDate: '2099-03-01T15:00:00Z',
  homeTeam: { id: 57, name: 'Arsenal FC', shortName: 'Arsenal' },
  awayTeam: { id: 61, name: 'Chelsea FC', shortName: 'Chelsea' },
  score: { fullTime: { home: null, away: null }, winner: null },
};

beforeEach(() => {
  jest.resetModules();
  mockFetch = jest.fn();
  jest.doMock('../../utils/fetchWithTimeout', () => mockFetch);
  jest.doMock('../../config/env', () => ({ footballApiKey: 'test-key' }));
  footballService = require('../../services/footballService');
});

describe('getEPLStandings', () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ teams: MOCK_PL_TEAMS });
      if (url.includes('/standings')) return mockOk({ standings: [{ type: 'TOTAL', table: MOCK_STANDINGS_TABLE }] });
      return mockOk({});
    });
  });

  it('returns standings in position order', async () => {
    const result = await footballService.getEPLStandings();
    expect(result).toHaveLength(2);
    expect(result[0].teamName).toBe('Arsenal');
    expect(result[0].position).toBe(1);
    expect(result[0].stats.points).toBe(65);
  });

  it('includes logoUrl in each entry', async () => {
    const result = await footballService.getEPLStandings();
    expect(result[0].logoUrl).toContain('football-data.org');
  });

  it('uses standings cache on second call', async () => {
    await footballService.getEPLStandings();
    await footballService.getEPLStandings();
    const standingsCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/standings'));
    expect(standingsCalls.length).toBe(1);
  });

  it('throws when the standings API call fails', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ teams: MOCK_PL_TEAMS });
      return mockFail();
    });
    await expect(footballService.getEPLStandings()).rejects.toThrow();
  });
});

describe('getEPLLeagueGames', () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('FINISHED')) return mockOk({ matches: [MOCK_FINISHED_MATCH] });
      if (url.includes('SCHEDULED')) return mockOk({ matches: [MOCK_SCHEDULED_MATCH] });
      return mockOk({});
    });
  });

  it('returns recentResults and upcomingFixtures', async () => {
    const result = await footballService.getEPLLeagueGames();
    expect(result).toHaveProperty('recentResults');
    expect(result).toHaveProperty('upcomingFixtures');
  });

  it('maps finished matches to recentResults', async () => {
    const { recentResults } = await footballService.getEPLLeagueGames();
    expect(recentResults).toHaveLength(1);
    expect(recentResults[0].homeTeam).toBe('Arsenal');
    expect(recentResults[0].awayTeam).toBe('Chelsea');
    expect(recentResults[0].homeScore).toBe(2);
  });

  it('maps scheduled matches to upcomingFixtures', async () => {
    const { upcomingFixtures } = await footballService.getEPLLeagueGames();
    expect(upcomingFixtures).toHaveLength(1);
    expect(upcomingFixtures[0].homeTeam).toBe('Arsenal');
  });

  it('caps both lists at 5', async () => {
    const manyFinished = Array.from({ length: 10 }, (_, i) => ({ ...MOCK_FINISHED_MATCH, id: i + 300 }));
    mockFetch.mockImplementation((url) => {
      if (url.includes('FINISHED')) return mockOk({ matches: manyFinished });
      return mockOk({ matches: [] });
    });
    const { recentResults } = await footballService.getEPLLeagueGames();
    expect(recentResults.length).toBeLessThanOrEqual(5);
  });
});

describe('getEPLTeamData', () => {
  it('returns null for a team not in the PL squad list', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ teams: MOCK_PL_TEAMS });
      if (url.includes('/standings')) return mockOk({ standings: [{ type: 'TOTAL', table: MOCK_STANDINGS_TABLE }] });
      return mockOk({ matches: [] });
    });
    const result = await footballService.getEPLTeamData({ teamName: 'Unknown FC' });
    expect(result).toBeNull();
  });

  it('returns team data with latestResult for a known team', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/competitions/PL/teams')) return mockOk({ teams: MOCK_PL_TEAMS });
      if (url.includes('/standings')) return mockOk({ standings: [{ type: 'TOTAL', table: MOCK_STANDINGS_TABLE }] });
      if (url.includes('FINISHED')) return mockOk({ matches: [MOCK_FINISHED_MATCH] });
      return mockOk({ matches: [] });
    });
    const result = await footballService.getEPLTeamData({ teamName: 'Arsenal' });
    expect(result).not.toBeNull();
    expect(result.latestResult.outcome).toBe('W');
    expect(result.latestResult.score).toBe('2-1');
    expect(result.ladderPosition).toBe(1);
    expect(result.logoUrl).toContain('football-data.org');
  });

  it('sets outcome to L when Arsenal loses', async () => {
    const lossMatch = {
      ...MOCK_FINISHED_MATCH,
      homeTeam: { id: 61, name: 'Chelsea FC', shortName: 'Chelsea' },
      awayTeam: { id: 57, name: 'Arsenal FC', shortName: 'Arsenal' },
      score: { fullTime: { home: 3, away: 1 }, winner: 'HOME_TEAM' },
    };
    mockFetch.mockImplementation((url) => {
      if (url.includes('/competitions/PL/teams')) return mockOk({ teams: MOCK_PL_TEAMS });
      if (url.includes('/standings')) return mockOk({ standings: [{ type: 'TOTAL', table: MOCK_STANDINGS_TABLE }] });
      if (url.includes('FINISHED')) return mockOk({ matches: [lossMatch] });
      return mockOk({ matches: [] });
    });
    const result = await footballService.getEPLTeamData({ teamName: 'Arsenal' });
    expect(result.latestResult.outcome).toBe('L');
  });

  it('returns null nextFixture when no scheduled games', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/competitions/PL/teams')) return mockOk({ teams: MOCK_PL_TEAMS });
      if (url.includes('/standings')) return mockOk({ standings: [{ type: 'TOTAL', table: MOCK_STANDINGS_TABLE }] });
      return mockOk({ matches: [] });
    });
    const result = await footballService.getEPLTeamData({ teamName: 'Arsenal' });
    expect(result.nextFixture).toBeNull();
  });
});
