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

describe('NRL — id-keyed logo CDN scheme', () => {
  // NRL is the one league whose ESPN logos are keyed by numeric team id under
  // "rugby/teams" rather than by abbreviation under the league's own name —
  // confirmed against the real API, undocumented by ESPN. These deliberately
  // reuse a mismatched abbreviation (favourite "bri" vs ESPN "BRI" would
  // actually match — use a genuinely different one) to prove the id-based
  // URL doesn't depend on abbreviation matching at all once the team is found.
  const NRL_TEAMS_RESPONSE = {
    sports: [{ leagues: [{ teams: [
      { team: { id: '289195', abbreviation: 'BRI', displayName: 'Broncos', shortDisplayName: 'Broncos' } },
      { team: { id: '289204', abbreviation: 'SYD', displayName: 'Roosters', shortDisplayName: 'Roosters' } },
    ] }] }],
  };

  it('builds the id-keyed logo URL for the matched team, not an abbreviation-keyed one', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams/289195/schedule')) return mockOk({ events: [] });
      if (url.includes('/teams')) return mockOk(NRL_TEAMS_RESPONSE);
      return mockOk({});
    });

    const result = await espnTeamSportService.getESPNTeamData(
      { teamId: 'nrl-bri', teamName: 'Broncos', league: 'NRL' },
      'NRL',
    );

    expect(result).not.toBeNull();
    expect(result.logoUrl).toBe('https://a.espncdn.com/i/teamlogos/rugby/teams/500/289195.png');
  });

  it('builds the opponent logo URL the same id-keyed way in nextFixture', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams/289195/schedule')) {
        return mockOk({
          events: [{
            date: '2099-06-01T05:00:00Z',
            competitions: [{
              date: '2099-06-01T05:00:00Z',
              status: { type: { completed: false } },
              competitors: [
                { team: { id: '289195', abbreviation: 'BRI' }, homeAway: 'home', score: null, winner: null },
                { team: { id: '289204', abbreviation: 'SYD' }, homeAway: 'away', score: null, winner: null },
              ],
            }],
          }],
        });
      }
      if (url.includes('/teams')) return mockOk(NRL_TEAMS_RESPONSE);
      return mockOk({});
    });

    const result = await espnTeamSportService.getESPNTeamData(
      { teamId: 'nrl-bri', teamName: 'Broncos', league: 'NRL' },
      'NRL',
    );

    expect(result.nextFixture.opponentLogoUrl).toBe('https://a.espncdn.com/i/teamlogos/rugby/teams/500/289204.png');
    expect(result.nextFixture.venueTimezone).toBe('Australia/Sydney');
  });
});

describe('NWSL / A-League / Liga MX / Brasileirão / Argentina / Saudi PL / Primeira Liga / Turkey / Scotland — same id-keyed logo scheme as NRL, different path', () => {
  // The id-keying mechanism itself is already covered by the NRL tests above
  // (same LOGO_ID_PATH_OVERRIDES code path) — these just lock in that every
  // soccer league here uses "soccer" as their path segment, not their own
  // league key, since that's the part that's easy to get wrong per-league.
  function teamsResponse(id, abbr, name) {
    return { sports: [{ leagues: [{ teams: [{ team: { id, abbreviation: abbr, displayName: name, shortDisplayName: name } }] }] }] };
  }

  it.each([
    ['NWSL', 'nwsl-la', 'Angel City FC', '21422', 'LA'],
    ['ALEAGUE', 'aleague-ade', 'Adelaide United', '5321', 'ADE'],
    ['LIGAMX', 'ligamx-ame', 'América', '227', 'AME'],
    ['BRASILEIRAO', 'brasileirao-fla', 'Flamengo', '819', 'FLA'],
    ['ARGENTINA', 'argentina-cabj', 'Boca Juniors', '5', 'CABJ'],
    ['SAUDIPL', 'saudipl-hil', 'Al Hilal', '929', 'HIL'],
    ['PRIMEIRALIGA', 'primeiraliga-fcp', 'FC Porto', '437', 'FCP'],
    ['TURKEY', 'turkey-fen', 'Fenerbahce', '436', 'FEN'],
    ['SCOTLAND', 'scotland-cel', 'Celtic', '256', 'CEL'],
  ])('uses the "soccer" id-keyed path for %s', async (league, teamId, teamName, espnId, abbr) => {
    mockFetch.mockImplementation((url) => {
      if (url.includes(`/teams/${espnId}/schedule`)) return mockOk({ events: [] });
      if (url.includes('/teams')) return mockOk(teamsResponse(espnId, abbr, teamName));
      return mockOk({});
    });

    const result = await espnTeamSportService.getESPNTeamData({ teamId, teamName, league }, league);

    expect(result.logoUrl).toBe(`https://a.espncdn.com/i/teamlogos/soccer/500/${espnId}.png`);
  });
});

describe('Argentina — River Plate vs Independiente Rivadavia disambiguation', () => {
  // ESPN's own data has two different clubs sharing the literal abbreviation
  // "RIV" — Independiente Rivadavia (id 9744, listed first) and River Plate
  // (id 16, listed second). Deliberately stored our own River Plate favourite
  // with an abbreviation ESPN doesn't use ("rvpl"), forcing it through
  // findTeamByName — which is safe here since "River Plate" doesn't collide
  // with any other club's name, unlike a name-based match for Independiente
  // Rivadavia would (its name contains plain "Independiente" as a substring,
  // a real separate club also in this league, listed earlier in the array).
  const ARG_TEAMS_RESPONSE = {
    sports: [{ leagues: [{ teams: [
      { team: { id: '11', abbreviation: 'IND', displayName: 'Independiente', shortDisplayName: 'Independiente' } },
      { team: { id: '9744', abbreviation: 'RIV', displayName: 'Independiente Rivadavia', shortDisplayName: 'Ind. Rivadavia' } },
      { team: { id: '16', abbreviation: 'RIV', displayName: 'River Plate', shortDisplayName: 'River Plate' } },
    ] }] }],
  };

  it('resolves Independiente Rivadavia via its abbreviation, not a name-substring match against plain Independiente', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams/9744/schedule')) return mockOk({ events: [] });
      if (url.includes('/teams')) return mockOk(ARG_TEAMS_RESPONSE);
      return mockOk({});
    });

    const result = await espnTeamSportService.getESPNTeamData(
      { teamId: 'argentina-riv', teamName: 'Independiente Rivadavia', league: 'ARGENTINA' },
      'ARGENTINA',
    );

    expect(result.logoUrl).toBe('https://a.espncdn.com/i/teamlogos/soccer/500/9744.png');
  });

  it('resolves River Plate via its full name, not the first "RIV"-abbreviated team in the list', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams/16/schedule')) return mockOk({ events: [] });
      if (url.includes('/teams')) return mockOk(ARG_TEAMS_RESPONSE);
      return mockOk({});
    });

    const result = await espnTeamSportService.getESPNTeamData(
      { teamId: 'argentina-rvpl', teamName: 'River Plate', league: 'ARGENTINA' },
      'ARGENTINA',
    );

    expect(result.logoUrl).toBe('https://a.espncdn.com/i/teamlogos/soccer/500/16.png');
  });
});

describe('Scotland — findTeamByName prefers an exact match over a fuzzy one', () => {
  // ESPN's own data has two different clubs sharing the literal abbreviation
  // "DUN" — Dundee (id 261, listed first) and Dundee United (id 264). Unlike
  // Argentina's River Plate case, there's no safe abbreviation-only escape
  // hatch here: any abbreviation string that resolves to one team via
  // findTeamByAbbr also resolves to the other, since ESPN gives them the
  // identical string. Both favourites below are deliberately stored with an
  // abbreviation ESPN doesn't use, forcing both through findTeamByName — this
  // only resolves correctly because that function checks the whole team list
  // for an exact name match before ever trying a fuzzy substring one; a
  // naive fuzzy-first search would let "Dundee" (listed first, and a genuine
  // substring of "Dundee United") shadow "Dundee United" even when searching
  // for the latter by its own full, exact name.
  const SCO_TEAMS_RESPONSE = {
    sports: [{ leagues: [{ teams: [
      { team: { id: '261', abbreviation: 'DUN', displayName: 'Dundee', shortDisplayName: 'Dundee' } },
      { team: { id: '264', abbreviation: 'DUN', displayName: 'Dundee United', shortDisplayName: 'Dundee Utd' } },
    ] }] }],
  };

  it('resolves Dundee United to itself, not to plain Dundee', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams/264/schedule')) return mockOk({ events: [] });
      if (url.includes('/teams')) return mockOk(SCO_TEAMS_RESPONSE);
      return mockOk({});
    });

    const result = await espnTeamSportService.getESPNTeamData(
      { teamId: 'scotland-dnu', teamName: 'Dundee United', league: 'SCOTLAND' },
      'SCOTLAND',
    );

    expect(result.logoUrl).toBe('https://a.espncdn.com/i/teamlogos/soccer/500/264.png');
  });

  it('still resolves plain Dundee to itself', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/teams/261/schedule')) return mockOk({ events: [] });
      if (url.includes('/teams')) return mockOk(SCO_TEAMS_RESPONSE);
      return mockOk({});
    });

    const result = await espnTeamSportService.getESPNTeamData(
      { teamId: 'scotland-dund', teamName: 'Dundee', league: 'SCOTLAND' },
      'SCOTLAND',
    );

    expect(result.logoUrl).toBe('https://a.espncdn.com/i/teamlogos/soccer/500/261.png');
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

  it('omits the dates query param for every league — ESPN 400s on a date range as of 2026-09-17', async () => {
    mockFetch.mockImplementation(() => mockOk({ events: [] }));
    await espnTeamSportService.getESPNLeagueGames('NFL');
    const [url] = mockFetch.mock.calls.find(([u]) => u.includes('/scoreboard'));
    expect(url).not.toContain('dates=');
    expect(url).toContain('/football/nfl/scoreboard');
  });

  it('omits the dates query param for NRL too', async () => {
    mockFetch.mockImplementation(() => mockOk({ events: [] }));
    await espnTeamSportService.getESPNLeagueGames('NRL');
    const [url] = mockFetch.mock.calls.find(([u]) => u.includes('/scoreboard'));
    expect(url).not.toContain('dates=');
  });
});
