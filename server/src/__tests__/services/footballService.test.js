let mockFetch;
let footballService;

function mockOk(data) {
  return Promise.resolve({ ok: true, status: 200, json: async () => data });
}

function mockFail(status = 500) {
  return Promise.resolve({ ok: false, status });
}

const MOCK_TEAMS = [
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

function standardMock(finished = [], scheduled = []) {
  return (url) => {
    // Check FINISHED/SCHEDULED before /teams because team match URLs
    // (/teams/57/matches?...status=FINISHED) also contain '/teams'
    if (url.includes('/scorers')) return mockOk({ scorers: [] });
    if (url.includes('/standings')) return mockOk({ standings: [{ type: 'TOTAL', table: MOCK_STANDINGS_TABLE }] });
    if (url.includes('FINISHED')) return mockOk({ matches: finished });
    if (url.includes('SCHEDULED')) return mockOk({ matches: scheduled });
    if (url.includes('/teams')) return mockOk({ teams: MOCK_TEAMS });
    return mockOk({});
  };
}

beforeEach(() => {
  jest.resetModules();
  mockFetch = jest.fn();
  jest.doMock('../../utils/fetchWithTimeout', () => mockFetch);
  jest.doMock('../../config/env', () => ({ footballApiKey: 'test-key' }));
  footballService = require('../../services/footballService');
});

// ─── getFDStandingsForOverview ────────────────────────────────────────────────

describe('getFDStandingsForOverview', () => {
  beforeEach(() => {
    mockFetch.mockImplementation(standardMock());
  });

  it('returns standings in position order for PL', async () => {
    const result = await footballService.getFDStandingsForOverview('PL');
    expect(result).toHaveLength(2);
    expect(result[0].teamName).toBe('Arsenal');
    expect(result[0].position).toBe(1);
    expect(result[0].stats.points).toBe(65);
  });

  it('includes logoUrl in each entry', async () => {
    const result = await footballService.getFDStandingsForOverview('PL');
    expect(result[0].logoUrl).toContain('football-data.org');
  });

  it('uses competition code in the URL', async () => {
    await footballService.getFDStandingsForOverview('PD');
    const urls = mockFetch.mock.calls.map(([url]) => url);
    expect(urls.some((u) => u.includes('/competitions/PD/'))).toBe(true);
  });

  it('uses standings cache on second call for same code', async () => {
    await footballService.getFDStandingsForOverview('PL');
    await footballService.getFDStandingsForOverview('PL');
    const standingsCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/standings'));
    expect(standingsCalls.length).toBe(1);
  });

  it('keeps separate caches for different competition codes', async () => {
    await footballService.getFDStandingsForOverview('PL');
    await footballService.getFDStandingsForOverview('PD');
    const standingsCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/standings'));
    expect(standingsCalls.length).toBe(2);
  });

  it('throws when the standings API call fails', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk({ teams: MOCK_TEAMS });
      return mockFail();
    });
    await expect(footballService.getFDStandingsForOverview('PL')).rejects.toThrow();
  });
});

// ─── getFDLeagueGames ─────────────────────────────────────────────────────────

describe('getFDLeagueGames', () => {
  beforeEach(() => {
    mockFetch.mockImplementation(standardMock([MOCK_FINISHED_MATCH], [MOCK_SCHEDULED_MATCH]));
  });

  it('returns recentResults and upcomingFixtures', async () => {
    const result = await footballService.getFDLeagueGames('PL');
    expect(result).toHaveProperty('recentResults');
    expect(result).toHaveProperty('upcomingFixtures');
  });

  it('maps finished matches to recentResults', async () => {
    const { recentResults } = await footballService.getFDLeagueGames('PL');
    expect(recentResults).toHaveLength(1);
    expect(recentResults[0].homeTeam).toBe('Arsenal');
    expect(recentResults[0].homeScore).toBe(2);
  });

  it('maps scheduled matches to upcomingFixtures', async () => {
    const { upcomingFixtures } = await footballService.getFDLeagueGames('PL');
    expect(upcomingFixtures).toHaveLength(1);
    expect(upcomingFixtures[0].homeTeam).toBe('Arsenal');
  });

  it('uses competition code in the URL', async () => {
    await footballService.getFDLeagueGames('BL1');
    const urls = mockFetch.mock.calls.map(([url]) => url);
    expect(urls.some((u) => u.includes('/competitions/BL1/'))).toBe(true);
  });

  it('caps results at 5', async () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ ...MOCK_FINISHED_MATCH, id: i + 300 }));
    mockFetch.mockImplementation(standardMock(many, []));
    const { recentResults } = await footballService.getFDLeagueGames('PL');
    expect(recentResults.length).toBeLessThanOrEqual(5);
  });
});

// ─── getFDTeamData ────────────────────────────────────────────────────────────

describe('getFDTeamData', () => {
  it('returns null for a team not in the squad list', async () => {
    mockFetch.mockImplementation(standardMock());
    const result = await footballService.getFDTeamData({ teamName: 'Unknown FC' }, 'PL');
    expect(result).toBeNull();
  });

  it('returns team data with latestResult for a known team', async () => {
    mockFetch.mockImplementation(standardMock([MOCK_FINISHED_MATCH], []));
    const result = await footballService.getFDTeamData({ teamName: 'Arsenal' }, 'PL');
    expect(result).not.toBeNull();
    expect(result.latestResult.outcome).toBe('W');
    expect(result.latestResult.score).toBe('2-1');
    expect(result.ladderPosition).toBe(1);
    expect(result.logoUrl).toContain('football-data.org');
  });

  it('sets outcome to L when the team loses', async () => {
    const lossMatch = {
      ...MOCK_FINISHED_MATCH,
      homeTeam: { id: 61, name: 'Chelsea FC', shortName: 'Chelsea' },
      awayTeam: { id: 57, name: 'Arsenal FC', shortName: 'Arsenal' },
      score: { fullTime: { home: 3, away: 1 }, winner: 'HOME_TEAM' },
    };
    mockFetch.mockImplementation(standardMock([lossMatch], []));
    const result = await footballService.getFDTeamData({ teamName: 'Arsenal' }, 'PL');
    expect(result.latestResult.outcome).toBe('L');
  });

  it('sets outcome to D for a draw', async () => {
    const drawMatch = {
      ...MOCK_FINISHED_MATCH,
      score: { fullTime: { home: 1, away: 1 }, winner: null },
    };
    mockFetch.mockImplementation(standardMock([drawMatch], []));
    const result = await footballService.getFDTeamData({ teamName: 'Arsenal' }, 'PL');
    expect(result.latestResult.outcome).toBe('D');
  });

  it('returns null nextFixture when no scheduled games', async () => {
    mockFetch.mockImplementation(standardMock([], []));
    const result = await footballService.getFDTeamData({ teamName: 'Arsenal' }, 'PL');
    expect(result.nextFixture).toBeNull();
  });

  it('sets seasonFinished=true when there are past matches but no future ones', async () => {
    mockFetch.mockImplementation(standardMock([MOCK_FINISHED_MATCH], []));
    const result = await footballService.getFDTeamData({ teamName: 'Arsenal' }, 'PL');
    expect(result.seasonFinished).toBe(true);
  });

  it('sets seasonFinished=false when a future match exists', async () => {
    mockFetch.mockImplementation(standardMock([MOCK_FINISHED_MATCH], [MOCK_SCHEDULED_MATCH]));
    const result = await footballService.getFDTeamData({ teamName: 'Arsenal' }, 'PL');
    expect(result.seasonFinished).toBe(false);
  });

  it('works with a different competition code (La Liga)', async () => {
    mockFetch.mockImplementation(standardMock([MOCK_FINISHED_MATCH], []));
    const result = await footballService.getFDTeamData({ teamName: 'Arsenal' }, 'PD');
    // team found via name match; proves generic path works
    expect(result).not.toBeNull();
    const urls = mockFetch.mock.calls.map(([url]) => url);
    expect(urls.some((u) => u.includes('/competitions/PD/'))).toBe(true);
  });
});
