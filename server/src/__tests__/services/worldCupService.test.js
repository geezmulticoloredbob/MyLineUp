let mockFetch;
let worldCupService;

function mockOk(data) {
  return Promise.resolve({ ok: true, status: 200, json: async () => data });
}

function mockFail(status = 500) {
  return Promise.resolve({ ok: false, status });
}

const MOCK_TEAMS = [
  { id: 1, name: 'England', shortName: 'England', crest: 'https://crests.football-data.org/eng.png' },
  { id: 2, name: 'France', shortName: 'France', crest: 'https://crests.football-data.org/fra.png' },
];

const MOCK_STANDINGS = [
  {
    table: [
      { position: 1, team: { id: 1, name: 'England' }, playedGames: 3, points: 7, goalDifference: 4 },
      { position: 2, team: { id: 2, name: 'France' }, playedGames: 3, points: 4, goalDifference: 1 },
    ],
  },
];

const MOCK_FINISHED_MATCH = {
  id: 501,
  utcDate: '2026-06-15T18:00:00Z',
  homeTeam: { id: 1, name: 'England', shortName: 'England' },
  awayTeam: { id: 2, name: 'France', shortName: 'France' },
  score: { fullTime: { home: 2, away: 0 }, winner: 'HOME_TEAM' },
};

const MOCK_SCHEDULED_MATCH = {
  id: 502,
  utcDate: '2099-06-22T18:00:00Z',
  homeTeam: { id: 1, name: 'England', shortName: 'England' },
  awayTeam: { id: 2, name: 'France', shortName: 'France' },
  score: { fullTime: { home: null, away: null }, winner: null },
};

function standardMock(finished = [], scheduled = []) {
  return (url) => {
    if (url.includes('/standings')) return mockOk({ standings: MOCK_STANDINGS });
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
  worldCupService = require('../../services/worldCupService');
});

describe('getWCTeamData', () => {
  it('returns null for a team not in the squad list', async () => {
    mockFetch.mockImplementation(standardMock());
    const result = await worldCupService.getWCTeamData({ teamName: 'Unknown' });
    expect(result).toBeNull();
  });

  it('returns team data with latestResult and ladderPosition', async () => {
    mockFetch.mockImplementation(standardMock([MOCK_FINISHED_MATCH], []));
    const result = await worldCupService.getWCTeamData({ teamName: 'England' });
    expect(result.latestResult).toMatchObject({ outcome: 'W', opponent: 'France', score: '2-0' });
    expect(result.ladderPosition).toBe(1);
  });

  it('uses cache on second call for the same team (matches fetched only once)', async () => {
    mockFetch.mockImplementation(standardMock([MOCK_FINISHED_MATCH], []));
    await worldCupService.getWCTeamData({ teamName: 'England' });
    await worldCupService.getWCTeamData({ teamName: 'England' });
    const matchCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/teams/1/matches'));
    expect(matchCalls.length).toBe(2); // one FINISHED + one SCHEDULED fetch, not doubled
  });

  it('keeps separate match caches per team', async () => {
    mockFetch.mockImplementation(standardMock([MOCK_FINISHED_MATCH], []));
    await worldCupService.getWCTeamData({ teamName: 'England' });
    await worldCupService.getWCTeamData({ teamName: 'France' });
    const matchCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/matches') && url.includes('/teams/'));
    expect(matchCalls.length).toBe(4);
  });
});

describe('getWCStandings', () => {
  it('returns rows sorted by points then goal difference', async () => {
    mockFetch.mockImplementation(standardMock());
    const result = await worldCupService.getWCStandings();
    expect(result[0].teamName).toBe('England');
    expect(result[0].logoUrl).toContain('football-data.org');
  });

  it('returns null when standings are unavailable', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/standings')) return mockFail();
      return mockOk({ teams: MOCK_TEAMS });
    });
    const result = await worldCupService.getWCStandings();
    expect(result).toBeNull();
  });
});

describe('getWCLeagueGames', () => {
  it('returns recentResults and upcomingFixtures', async () => {
    mockFetch.mockImplementation(standardMock([MOCK_FINISHED_MATCH], [MOCK_SCHEDULED_MATCH]));
    const result = await worldCupService.getWCLeagueGames();
    expect(result.recentResults).toHaveLength(1);
    expect(result.upcomingFixtures).toHaveLength(1);
  });

  it('uses cache on second call (matches fetched only once)', async () => {
    mockFetch.mockImplementation(standardMock([MOCK_FINISHED_MATCH], []));
    await worldCupService.getWCLeagueGames();
    await worldCupService.getWCLeagueGames();
    const matchCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/competitions/WC/matches'));
    expect(matchCalls.length).toBe(2); // one FINISHED + one SCHEDULED fetch, not doubled
  });

  it('throws when the league matches fetch fails', async () => {
    mockFetch.mockImplementation(() => mockFail(503));
    await expect(worldCupService.getWCLeagueGames()).rejects.toThrow();
  });
});
