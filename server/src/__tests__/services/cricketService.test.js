let mockFetch;
let cricketService;

function mockOk(data) {
  return Promise.resolve({ ok: true, status: 200, json: async () => data });
}

function mockFail(status = 500) {
  return Promise.resolve({ ok: false, status });
}

function team(name, shortname, img) {
  return { name, shortname, img };
}

function match({ id, status, date, dateTimeGMT, matchStarted, matchEnded, teams }) {
  return { id, status, date, dateTimeGMT, matchStarted, matchEnded, teamInfo: teams };
}

const CSK = team('Chennai Super Kings', 'CSK', 'https://example.com/csk.png');
const DC = team('Delhi Capitals', 'DC', 'https://example.com/dc.png');
const MI = team('Mumbai Indians', 'MI', 'https://example.com/mi.png');

const FINISHED_WIN = match({
  id: 'm1',
  status: 'Chennai Super Kings won by 23 runs',
  date: '2026-04-11',
  dateTimeGMT: '2026-04-11T14:00:00',
  matchStarted: true,
  matchEnded: true,
  teams: [CSK, DC],
});

const FINISHED_LOSS = match({
  id: 'm0',
  status: 'Delhi Capitals won by 5 wickets',
  date: '2026-04-05',
  dateTimeGMT: '2026-04-05T14:00:00',
  matchStarted: true,
  matchEnded: true,
  teams: [CSK, DC],
});

const UPCOMING = match({
  id: 'm2',
  status: 'Match not started',
  date: '2026-04-20',
  dateTimeGMT: '2026-04-20T14:00:00',
  matchStarted: false,
  matchEnded: false,
  teams: [CSK, MI],
});

const SERIES_INFO_RESPONSE = {
  status: 'success',
  data: { info: { id: 'series-1' }, matchList: [FINISHED_LOSS, FINISHED_WIN, UPCOMING] },
};

const POINTS_RESPONSE = {
  status: 'success',
  data: [
    { teamname: 'Chennai Super Kings', shortname: 'CSK', img: CSK.img, matches: 2, wins: 1, loss: 1, ties: 0, nr: 0 },
    { teamname: 'Delhi Capitals', shortname: 'DC', img: DC.img, matches: 2, wins: 1, loss: 1, ties: 0, nr: 0 },
    { teamname: 'Mumbai Indians', shortname: 'MI', img: MI.img, matches: 3, wins: 2, loss: 1, ties: 0, nr: 0 },
  ],
};

beforeEach(() => {
  jest.resetModules();
  mockFetch = jest.fn();
  jest.doMock('../../utils/fetchWithTimeout', () => mockFetch);
  jest.doMock('../../config/env', () => ({ cricketApiKey: 'test-key' }));
  cricketService = require('../../services/cricketService');
});

describe('getCricketTeamData', () => {
  it('returns null when the team is not found in the series at all', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('series_info')) return mockOk(SERIES_INFO_RESPONSE);
      if (url.includes('series_points')) return mockOk(POINTS_RESPONSE);
      return mockOk({});
    });

    const result = await cricketService.getCricketTeamData({ teamId: 'ipl-zzz', teamName: 'Nonexistent XI' }, 'IPL');
    expect(result).toBeNull();
  });

  it('builds latestResult from the most recent finished match, with a W outcome when we won', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('series_info')) return mockOk(SERIES_INFO_RESPONSE);
      if (url.includes('series_points')) return mockOk(POINTS_RESPONSE);
      return mockOk({});
    });

    const result = await cricketService.getCricketTeamData({ teamId: 'ipl-csk', teamName: 'Chennai Super Kings' }, 'IPL');

    // FINISHED_WIN (2026-04-11) is more recent than FINISHED_LOSS (2026-04-05)
    expect(result.latestResult).toEqual({
      date: '2026-04-11',
      outcome: 'W',
      opponent: 'Delhi Capitals',
      score: 'Chennai Super Kings won by 23 runs',
    });
  });

  it('reports an L outcome when the opponent won', async () => {
    mockFetch.mockImplementation((url) => {
      // Only the loss is present this time, so it's "most recent" regardless of date sort
      if (url.includes('series_info')) return mockOk({ status: 'success', data: { matchList: [FINISHED_LOSS] } });
      if (url.includes('series_points')) return mockOk(POINTS_RESPONSE);
      return mockOk({});
    });

    const result = await cricketService.getCricketTeamData({ teamId: 'ipl-csk', teamName: 'Chennai Super Kings' }, 'IPL');
    expect(result.latestResult.outcome).toBe('L');
    expect(result.latestResult.opponent).toBe('Delhi Capitals');
  });

  it('builds nextFixture from the soonest not-yet-started match', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('series_info')) return mockOk(SERIES_INFO_RESPONSE);
      if (url.includes('series_points')) return mockOk(POINTS_RESPONSE);
      return mockOk({});
    });

    const result = await cricketService.getCricketTeamData({ teamId: 'ipl-csk', teamName: 'Chennai Super Kings' }, 'IPL');

    expect(result.nextFixture).toMatchObject({ date: '2026-04-20', opponent: 'Mumbai Indians' });
    expect(result.nextFixture.opponentLogoUrl).toBe(MI.img);
  });

  it('derives ladderPosition and stats from the points table, ranked by wins', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('series_info')) return mockOk(SERIES_INFO_RESPONSE);
      if (url.includes('series_points')) return mockOk(POINTS_RESPONSE);
      return mockOk({});
    });

    const result = await cricketService.getCricketTeamData({ teamId: 'ipl-mi', teamName: 'Mumbai Indians' }, 'IPL');

    expect(result.stats).toEqual({ wins: 2, losses: 1 });
    expect(result.ladderPosition).toBe(1); // MI has the most wins of the three
  });

  it('uses the team\'s own logo directly from the API, no CDN URL construction needed', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('series_info')) return mockOk(SERIES_INFO_RESPONSE);
      if (url.includes('series_points')) return mockOk(POINTS_RESPONSE);
      return mockOk({});
    });

    const result = await cricketService.getCricketTeamData({ teamId: 'ipl-csk', teamName: 'Chennai Super Kings' }, 'IPL');
    expect(result.logoUrl).toBe(CSK.img);
  });

  it('falls back to matching by team name when the abbreviation is not found', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('series_info')) return mockOk(SERIES_INFO_RESPONSE);
      if (url.includes('series_points')) return mockOk(POINTS_RESPONSE);
      return mockOk({});
    });

    const result = await cricketService.getCricketTeamData(
      { teamId: 'ipl-wrongabbr', teamName: 'Chennai Super Kings' },
      'IPL',
    );
    expect(result).not.toBeNull();
    expect(result.logoUrl).toBe(CSK.img);
  });

  it('marks seasonFinished true once a team has played but has no matches left', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('series_info')) return mockOk({ status: 'success', data: { matchList: [FINISHED_WIN, FINISHED_LOSS] } });
      if (url.includes('series_points')) return mockOk(POINTS_RESPONSE);
      return mockOk({});
    });

    const result = await cricketService.getCricketTeamData({ teamId: 'ipl-csk', teamName: 'Chennai Super Kings' }, 'IPL');
    expect(result.seasonFinished).toBe(true);
  });

  it('throws when series_info fetch fails, so the caller falls back to unavailable', async () => {
    mockFetch.mockImplementation(() => mockFail(500));
    await expect(
      cricketService.getCricketTeamData({ teamId: 'ipl-csk', teamName: 'Chennai Super Kings' }, 'IPL'),
    ).rejects.toThrow();
  });

  it('still returns team data when the points table is empty (pre-season)', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('series_info')) return mockOk(SERIES_INFO_RESPONSE);
      if (url.includes('series_points')) return mockOk({ status: 'success', data: [] });
      return mockOk({});
    });

    const result = await cricketService.getCricketTeamData({ teamId: 'ipl-csk', teamName: 'Chennai Super Kings' }, 'IPL');
    expect(result).not.toBeNull();
    expect(result.stats).toEqual({});
    expect(result.ladderPosition).toBeNull();
  });
});

describe('getCricketStandingsOverview', () => {
  it('returns teams sorted by wins descending, ranked by position', async () => {
    mockFetch.mockImplementation(() => mockOk(POINTS_RESPONSE));

    const result = await cricketService.getCricketStandingsOverview('IPL');

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ position: 1, teamName: 'Mumbai Indians', stats: { wins: 2, losses: 1 } });
  });

  it('returns an empty array for a season with no matches played yet', async () => {
    mockFetch.mockImplementation(() => mockOk({ status: 'success', data: [] }));
    const result = await cricketService.getCricketStandingsOverview('BBL');
    expect(result).toEqual([]);
  });
});

describe('getCricketLeagueGames', () => {
  it('always returns empty recentResults/upcomingFixtures — no numeric score is available without a per-match call', async () => {
    const result = await cricketService.getCricketLeagueGames('IPL');
    expect(result).toEqual({ recentResults: [], upcomingFixtures: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('caching', () => {
  it('reuses a cached series_info response on a second call for the same league', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('series_info')) return mockOk(SERIES_INFO_RESPONSE);
      if (url.includes('series_points')) return mockOk(POINTS_RESPONSE);
      return mockOk({});
    });

    await cricketService.getCricketTeamData({ teamId: 'ipl-csk', teamName: 'Chennai Super Kings' }, 'IPL');
    await cricketService.getCricketTeamData({ teamId: 'ipl-dc', teamName: 'Delhi Capitals' }, 'IPL');

    const seriesInfoCalls = mockFetch.mock.calls.filter(([url]) => url.includes('series_info'));
    expect(seriesInfoCalls).toHaveLength(1);
  });

  it('keeps separate caches per league', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('series_info')) return mockOk(SERIES_INFO_RESPONSE);
      if (url.includes('series_points')) return mockOk(POINTS_RESPONSE);
      return mockOk({});
    });

    await cricketService.getCricketStandingsOverview('IPL');
    await cricketService.getCricketStandingsOverview('BBL');

    const pointsCalls = mockFetch.mock.calls.filter(([url]) => url.includes('series_points'));
    expect(pointsCalls).toHaveLength(2);
  });
});
