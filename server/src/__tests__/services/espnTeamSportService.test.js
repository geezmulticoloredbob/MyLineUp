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
            { team: { id: '1', abbreviation: 'KC', displayName: 'Kansas City Chiefs' } },
            { team: { id: '2', abbreviation: 'BUF', displayName: 'Buffalo Bills' } },
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

const ABBR_BY_TEAM_ID = { '1': 'KC', '2': 'BUF' };

function competitor(teamId, displayName, homeAway, score, winner) {
  return {
    team: { id: teamId, abbreviation: ABBR_BY_TEAM_ID[teamId], displayName, shortDisplayName: displayName },
    homeAway,
    score: { value: score },
    winner,
  };
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
    expect(result.nextFixture.opponentLogoUrl).toBe('https://a.espncdn.com/i/teamlogos/nfl/500/buf.png');
    expect(result.ladderPosition).toBe(1);
    expect(result.stats).toEqual({ wins: 12, losses: 5 });
    expect(result.logoUrl).toBe('https://a.espncdn.com/i/teamlogos/nfl/500/kc.png');
    expect(result.seasonFinished).toBe(false);
  });

  it('throws when the teams fetch fails', async () => {
    mockFetch.mockImplementation(() => mockFail(500));
    await expect(espnTeamSportService.getESPNTeamData({ teamId: 'nfl-kc', league: 'NFL' }, 'NFL')).rejects.toThrow();
  });

  describe('AFL — name-based fallback matching', () => {
    // Our stored afl- team IDs use abbreviations we invented ourselves, never
    // verified against ESPN's actual AFL scheme — deliberately mismatched
    // here (favourite abbr "haw" vs ESPN's "HAWK") to prove the name fallback
    // is what actually finds the team, not a coincidental abbreviation match.
    const AFL_TEAMS_RESPONSE = {
      sports: [{ leagues: [{ teams: [
        { team: { id: '10', abbreviation: 'HAWK', displayName: 'Hawthorn Hawks', shortDisplayName: 'Hawthorn' } },
        { team: { id: '11', abbreviation: 'COLL', displayName: 'Collingwood Magpies', shortDisplayName: 'Collingwood' } },
      ] }] }],
    };

    it('falls back to matching by team name when the abbreviation is not found', async () => {
      mockFetch.mockImplementation((url) => {
        if (url.includes('/teams/10/schedule')) return mockOk({ events: [] });
        if (url.includes('/teams')) return mockOk(AFL_TEAMS_RESPONSE);
        return mockOk({});
      });

      const result = await espnTeamSportService.getESPNTeamData(
        { teamId: 'afl-haw', teamName: 'Hawthorn', league: 'AFL' },
        'AFL',
      );

      expect(result).not.toBeNull();
      expect(result.logoUrl).toBe('https://a.espncdn.com/i/teamlogos/afl/500/hawk.png');
    });

    it('still returns null when neither abbreviation nor name matches any team', async () => {
      mockFetch.mockImplementation((url) => {
        if (url.includes('/teams')) return mockOk(AFL_TEAMS_RESPONSE);
        return mockOk({});
      });

      const result = await espnTeamSportService.getESPNTeamData(
        { teamId: 'afl-zzz', teamName: 'Nonexistent FC', league: 'AFL' },
        'AFL',
      );

      expect(result).toBeNull();
    });

    it('defaults nextFixture.venueTimezone to Australia/Sydney for AFL', async () => {
      mockFetch.mockImplementation((url) => {
        if (url.includes('/teams/11/schedule')) {
          return mockOk({
            events: [{
              date: '2099-06-01T05:00:00Z',
              competitions: [{
                date: '2099-06-01T05:00:00Z',
                status: { type: { completed: false } },
                competitors: [
                  { team: { id: '11', abbreviation: 'COLL' }, homeAway: 'home', score: null, winner: null },
                  { team: { id: '10', abbreviation: 'HAWK' }, homeAway: 'away', score: null, winner: null },
                ],
              }],
            }],
          });
        }
        if (url.includes('/teams')) return mockOk(AFL_TEAMS_RESPONSE);
        return mockOk({});
      });

      const result = await espnTeamSportService.getESPNTeamData(
        { teamId: 'afl-col', teamName: 'Collingwood', league: 'AFL' },
        'AFL',
      );

      expect(result.nextFixture.venueTimezone).toBe('Australia/Sydney');
    });
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
    expect(result[0].logoUrl).toBe('https://a.espncdn.com/i/teamlogos/nfl/500/kc.png');
  });

  it('dedupes teams that appear in both a conference-level and division-level standings block', async () => {
    const nestedStandings = {
      children: [
        {
          name: 'AFC',
          standings: { entries: MOCK_STANDINGS_RESPONSE.children[0].standings.entries },
          children: [
            { name: 'AFC West', standings: { entries: [MOCK_STANDINGS_RESPONSE.children[0].standings.entries[0]] } },
          ],
        },
      ],
    };
    mockFetch.mockImplementation((url) => {
      if (url.includes('/standings')) return mockOk(nestedStandings);
      if (url.includes('/teams')) return mockOk(MOCK_TEAMS_RESPONSE);
      return mockOk({});
    });

    const result = await espnTeamSportService.getESPNStandingsOverview('NFL');

    expect(result).toHaveLength(2);
    expect(result.filter((r) => r.teamName === 'Kansas City Chiefs')).toHaveLength(1);
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

  it('uses cache on second call for the same league (scoreboard fetched only once)', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/scoreboard')) return mockOk({ events: [FINISHED_EVENT, UPCOMING_EVENT] });
      return mockOk({});
    });
    await espnTeamSportService.getESPNLeagueGames('NFL');
    await espnTeamSportService.getESPNLeagueGames('NFL');
    const scoreboardCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/scoreboard'));
    expect(scoreboardCalls.length).toBe(1);
  });

  it('keeps separate scoreboard caches per league', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/scoreboard')) return mockOk({ events: [FINISHED_EVENT, UPCOMING_EVENT] });
      return mockOk({});
    });
    await espnTeamSportService.getESPNLeagueGames('NFL');
    await espnTeamSportService.getESPNLeagueGames('NHL');
    const scoreboardCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/scoreboard'));
    expect(scoreboardCalls.length).toBe(2);
  });
});
