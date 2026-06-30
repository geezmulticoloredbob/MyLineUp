let mockFetch;
let aflService;

function mockOk(data) {
  return Promise.resolve({ ok: true, status: 200, json: async () => data });
}

function mockFail(status = 500) {
  return Promise.resolve({ ok: false, status });
}

const MOCK_TEAMS = [
  { id: 1, name: 'Adelaide', logo: '/img/logos/adelaide.png' },
  { id: 2, name: 'Melbourne', logo: '/img/logos/melbourne.png' },
];

const MOCK_STANDINGS = [
  { name: 'Adelaide', rank: 1, wins: 10, losses: 5, pts: 40, percentage: 130 },
  { name: 'Melbourne', rank: 2, wins: 9, losses: 6, pts: 36, percentage: 115 },
];

const PAST_DATE = '2024-03-10 14:30:00';
const FUTURE_DATE = '2099-12-01 19:30:00';

const MOCK_COMPLETED_GAME = {
  id: 1,
  date: PAST_DATE,
  complete: 100,
  hteam: 'Adelaide',
  ateam: 'Melbourne',
  hscore: 95,
  ascore: 80,
  winner: 'Adelaide',
  venue: 'Adelaide Oval',
};

const MOCK_UPCOMING_GAME = {
  id: 2,
  date: FUTURE_DATE,
  complete: 0,
  hteam: 'Melbourne',
  ateam: 'Adelaide',
  hscore: 0,
  ascore: 0,
  winner: null,
  venue: 'MCG',
};

beforeEach(() => {
  jest.resetModules();
  mockFetch = jest.fn();
  jest.doMock('../../utils/fetchWithTimeout', () => mockFetch);
  aflService = require('../../services/aflService');
});

describe('getAFLStandings', () => {
  it('returns standings sorted by rank', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('standings')) return mockOk({ standings: MOCK_STANDINGS });
      return mockOk({ teams: MOCK_TEAMS });
    });
    const result = await aflService.getAFLStandings();
    expect(result).toHaveLength(2);
    expect(result[0].teamName).toBe('Adelaide');
    expect(result[0].position).toBe(1);
    expect(result[0].stats.wins).toBe(10);
  });

  it('includes logoUrl in each entry', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('standings')) return mockOk({ standings: MOCK_STANDINGS });
      return mockOk({ teams: MOCK_TEAMS });
    });
    const result = await aflService.getAFLStandings();
    expect(result[0].logoUrl).toContain('espncdn.com');
  });

  it('throws when the standings API call fails', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('standings')) return mockFail();
      return mockOk({ teams: MOCK_TEAMS });
    });
    await expect(aflService.getAFLStandings()).rejects.toThrow();
  });

  it('uses cache on second call (fetch not called again for standings)', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('standings')) return mockOk({ standings: MOCK_STANDINGS });
      return mockOk({ teams: MOCK_TEAMS });
    });
    await aflService.getAFLStandings();
    await aflService.getAFLStandings();
    const standingsCalls = mockFetch.mock.calls.filter(([url]) => url.includes('standings'));
    expect(standingsCalls.length).toBe(1);
  });
});

describe('getAFLLeagueGames', () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('standings')) return mockOk({ standings: MOCK_STANDINGS });
      if (url.includes('games')) return mockOk({ games: [MOCK_COMPLETED_GAME, MOCK_UPCOMING_GAME] });
      return mockOk({ teams: MOCK_TEAMS });
    });
  });

  it('returns recentResults and upcomingFixtures', async () => {
    const result = await aflService.getAFLLeagueGames();
    expect(result).toHaveProperty('recentResults');
    expect(result).toHaveProperty('upcomingFixtures');
  });

  it('only includes complete games in recentResults', async () => {
    const { recentResults } = await aflService.getAFLLeagueGames();
    expect(recentResults).toHaveLength(1);
    expect(recentResults[0].homeTeam).toBe('Adelaide');
  });

  it('only includes future incomplete games in upcomingFixtures', async () => {
    const { upcomingFixtures } = await aflService.getAFLLeagueGames();
    expect(upcomingFixtures).toHaveLength(1);
    expect(upcomingFixtures[0].homeTeam).toBe('Melbourne');
    expect(upcomingFixtures[0].venue).toBe('MCG');
  });

  it('caps both lists at 5', async () => {
    const manyGames = Array.from({ length: 10 }, (_, i) => ({ ...MOCK_COMPLETED_GAME, id: i + 10 }));
    mockFetch.mockImplementation((url) => {
      if (url.includes('standings')) return mockOk({ standings: MOCK_STANDINGS });
      if (url.includes('games')) return mockOk({ games: manyGames });
      return mockOk({ teams: MOCK_TEAMS });
    });
    const { recentResults } = await aflService.getAFLLeagueGames();
    expect(recentResults.length).toBeLessThanOrEqual(5);
  });
});

describe('getAFLTeamData', () => {
  it('returns null for a team not in the name map', async () => {
    const result = await aflService.getAFLTeamData({ teamName: 'Unknown FC' });
    expect(result).toBeNull();
  });

  it('returns team data with latestResult for a known team', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('standings')) return mockOk({ standings: MOCK_STANDINGS });
      if (url.includes('games')) return mockOk({ games: [MOCK_COMPLETED_GAME] });
      return mockOk({ teams: MOCK_TEAMS });
    });
    const result = await aflService.getAFLTeamData({ teamName: 'Adelaide Crows' });
    expect(result).not.toBeNull();
    expect(result.latestResult.outcome).toBe('W');
    expect(result.latestResult.opponent).toBe('Melbourne');
    expect(result.ladderPosition).toBe(1);
    expect(result.logoUrl).toContain('espncdn.com');
  });

  it('returns null nextFixture when no upcoming games', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('standings')) return mockOk({ standings: MOCK_STANDINGS });
      if (url.includes('games')) return mockOk({ games: [MOCK_COMPLETED_GAME] });
      return mockOk({ teams: MOCK_TEAMS });
    });
    const result = await aflService.getAFLTeamData({ teamName: 'Adelaide Crows' });
    expect(result.nextFixture).toBeNull();
  });

  it('returns upcoming fixture when a future game exists', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('standings')) return mockOk({ standings: MOCK_STANDINGS });
      if (url.includes('games')) return mockOk({ games: [MOCK_COMPLETED_GAME, MOCK_UPCOMING_GAME] });
      return mockOk({ teams: MOCK_TEAMS });
    });
    const result = await aflService.getAFLTeamData({ teamName: 'Adelaide Crows' });
    expect(result.nextFixture).not.toBeNull();
    expect(result.nextFixture.opponent).toBe('Melbourne');
    expect(result.nextFixture.venue).toBe('MCG');
  });
});
