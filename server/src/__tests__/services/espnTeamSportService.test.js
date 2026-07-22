let mockFetch;
let espnTeamSportService;

function mockOk(data) {
  return Promise.resolve({ ok: true, status: 200, json: async () => data });
}

function mockFail(status = 500) {
  return Promise.resolve({ ok: false, status });
}

const MOCK_TEAMS_RESPONSE = {
  sports: [
    {
      leagues: [
        {
          teams: [
            { team: { id: '1', abbreviation: 'KC', displayName: 'Kansas City Chiefs', logos: [{ href: 'https://espn.com/kc.png', rel: ['full'] }] } },
            { team: { id: '2', abbreviation: 'BUF', displayName: 'Buffalo Bills', logos: [{ href: 'https://espn.com/buf.png', rel: ['full'] }] } },
          ],
        },
      ],
    },
  ],
};

const MOCK_STANDINGS_RESPONSE = {
  children: [
    {
      name: 'AFC',
      standings: {
        entries: [
          {
            team: { id: '1', displayName: 'Kansas City Chiefs' },
            stats: [{ name: 'wins', value: 12 }, { name: 'losses', value: 5 }, { name: 'rank', value: 1 }],
          },
          {
            team: { id: '2', displayName: 'Buffalo Bills' },
            stats: [{ name: 'wins', value: 10 }, { name: 'losses', value: 7 }, { name: 'rank', value: 2 }],
          },
        ],
      },
    },
  ],
};

function competitor(teamId, displayName, homeAway, score, winner) {
  return { team: { id: teamId, displayName, shortDisplayName: displayName, logos: [] }, homeAway, score: { value: score }, winner };
}

const FINISHED_EVENT = {
  date: '2024-01-15T18:00:00Z',
  competitions: [
    {
      date: '2024-01-15T18:00:00Z',
      status: { type: { completed: true } },
      competitors: [competitor('1', 'Kansas City Chiefs', 'home', 27, true), competitor('2', 'Buffalo Bills', 'away', 20, false)],
    },
  ],
};

const UPCOMING_EVENT = {
  date: '2099-01-22T18:00:00Z',
  competitions: [
    {
      date: '2099-01-22T18:00:00Z',
      status: { type: { completed: false } },
      competitors: [competitor('1', 'Kansas City Chiefs', 'away', null, null), competitor('2', 'Buffalo Bills', 'home', null, null)],
    },
  ],
};

beforeEach(() => {
  jest.resetModules();
  mockFetch = jest.fn();
  jest.doMock('../../utils/fetchWithTimeout', () => mockFetch);
  espnTeamSportService = require('../../services/espnTeamSportService');
});

describe('getESPNTeamData', () => {
  it('returns null when the team abbreviation is not found', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams')) return mockOk(MOCK_TEAMS_RESPONSE);
      return mockOk({});
    });
    const result = await espnTeamSportService.getESPNTeamData({ teamId: 'nfl-zzz', league: 'NFL' }, 'NFL');
    expect(result).toBeNull();
  });

  it('builds latestResult, nextFixture, and standings for a matched team', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams/1/schedule')) return mockOk({ events: [FINISHED_EVENT, UPCOMING_EVENT] });
      if (url.includes('/standings')) return mockOk(MOCK_STANDINGS_RESPONSE);
      if (url.includes('/teams')) return mockOk(MOCK_TEAMS_RESPONSE);
      return mockOk({});
    });

    const result = await espnTeamSportService.getESPNTeamData({ teamId: 'nfl-kc', league: 'NFL' }, 'NFL');

    expect(result.latestResult).toEqual({ date: '2024-01-15', outcome: 'W', opponent: 'Buffalo Bills', score: '27-20' });
    expect(result.nextFixture).toMatchObject({ opponent: 'Buffalo Bills', venue: 'Away' });
    expect(result.ladderPosition).toBe(1);
    expect(result.stats).toEqual({ wins: 12, losses: 5 });
    expect(result.logoUrl).toBe('https://espn.com/kc.png');
    expect(result.seasonFinished).toBe(false);
  });

  it('throws when the teams fetch fails', async () => {
    mockFetch.mockImplementation(() => mockFail(500));
    await expect(espnTeamSportService.getESPNTeamData({ teamId: 'nfl-kc', league: 'NFL' }, 'NFL')).rejects.toThrow();
  });
});

describe('getESPNStandingsOverview', () => {
  it('returns teams sorted by rank with logo and record', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/standings')) return mockOk(MOCK_STANDINGS_RESPONSE);
      if (url.includes('/teams')) return mockOk(MOCK_TEAMS_RESPONSE);
      return mockOk({});
    });

    const result = await espnTeamSportService.getESPNStandingsOverview('NFL');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ position: 1, teamName: 'Kansas City Chiefs', stats: { wins: 12, losses: 5 } });
    expect(result[0].logoUrl).toBe('https://espn.com/kc.png');
  });
});

describe('getESPNLeagueGames', () => {
  it('splits scoreboard events into recentResults and upcomingFixtures', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/scoreboard')) return mockOk({ events: [FINISHED_EVENT, UPCOMING_EVENT] });
      return mockOk({});
    });

    const result = await espnTeamSportService.getESPNLeagueGames('NFL');

    expect(result.recentResults).toHaveLength(1);
    expect(result.recentResults[0]).toMatchObject({ homeTeam: 'Kansas City Chiefs', awayTeam: 'Buffalo Bills', homeScore: 27, awayScore: 20 });
    expect(result.upcomingFixtures).toHaveLength(1);
  });

  it('throws when the scoreboard fetch fails', async () => {
    mockFetch.mockImplementation(() => mockFail(503));
    await expect(espnTeamSportService.getESPNLeagueGames('NFL')).rejects.toThrow();
  });
});
