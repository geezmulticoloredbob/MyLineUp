let mockFetch;
let espnColourService;

function mockOk(data) {
  return Promise.resolve({ ok: true, status: 200, json: async () => data });
}

const MOCK_TEAMS_RESPONSE = {
  sports: [
    {
      leagues: [
        {
          teams: [
            {
              team: {
                displayName: 'Bayern Munich',
                name: 'Bayern Munich',
                shortDisplayName: 'Bayern Munich',
                nickname: 'Bayern',
                abbreviation: 'BAY',
                color: 'dc052d',
                alternateColor: 'ffffff',
                logos: [
                  { href: 'https://example.com/bayern-dark.png', rel: ['full', 'dark'] },
                  { href: 'https://example.com/bayern-light.png', rel: ['full', 'default'] },
                ],
              },
            },
            {
              team: {
                displayName: 'No Logo FC',
                name: 'No Logo FC',
                shortDisplayName: 'No Logo FC',
                color: '123456',
                logos: [],
              },
            },
          ],
        },
      ],
    },
  ],
};

beforeEach(() => {
  jest.resetModules();
  mockFetch = jest.fn();
  jest.doMock('../../utils/fetchWithTimeout', () => mockFetch);
  espnColourService = require('../../services/espnColourService');
});

describe('getTeamColours', () => {
  it('resolves logoUrl to the non-dark full logo when both variants exist', async () => {
    mockFetch.mockResolvedValue(mockOk(MOCK_TEAMS_RESPONSE));
    const result = await espnColourService.getTeamColours('Bayern Munich', 'BUNDESLIGA');
    expect(result.logoUrl).toBe('https://example.com/bayern-light.png');
    expect(result.darkLogoUrl).toBe('https://example.com/bayern-dark.png');
  });

  it('returns null logoUrl when the team has no logos', async () => {
    mockFetch.mockResolvedValue(mockOk(MOCK_TEAMS_RESPONSE));
    const result = await espnColourService.getTeamColours('No Logo FC', 'BUNDESLIGA');
    expect(result.logoUrl).toBeNull();
  });

  it('matches a stored plain-ASCII name against ESPN\'s accented one (e.g. "Atletico Madrid" vs "Atlético Madrid")', async () => {
    const response = {
      sports: [{ leagues: [{ teams: [
        { team: { displayName: 'Atlético Madrid', name: 'Atlético Madrid', shortDisplayName: 'Atlético', color: 'ce3524', alternateColor: '1c2c5b', logos: [] } },
      ] }] }],
    };
    mockFetch.mockResolvedValue(mockOk(response));
    const result = await espnColourService.getTeamColours('Atletico Madrid', 'LALIGA');
    expect(result).toMatchObject({ primary: '#ce3524', secondary: '#1c2c5b' });
  });

  it('resolves "Brighton" via the override against ESPN\'s actual "Brighton & Hove Albion" (not "and")', async () => {
    const response = {
      sports: [{ leagues: [{ teams: [
        { team: { displayName: 'Brighton & Hove Albion', name: 'Brighton & Hove Albion', shortDisplayName: 'Brighton', color: '0054a6', alternateColor: 'ffffff', logos: [] } },
      ] }] }],
    };
    mockFetch.mockResolvedValue(mockOk(response));
    const result = await espnColourService.getTeamColours('Brighton', 'EPL');
    expect(result).toMatchObject({ primary: '#0054a6', secondary: '#ffffff' });
  });

  it("skips a club with ESPN's placeholder colour (000000/000000) rather than treating it as real", async () => {
    const response = {
      sports: [{ leagues: [{ teams: [
        { team: { displayName: 'No Data FC', name: 'No Data FC', shortDisplayName: 'No Data FC', color: '000000', alternateColor: '000000', logos: [] } },
      ] }] }],
    };
    mockFetch.mockResolvedValue(mockOk(response));
    const result = await espnColourService.getTeamColours('No Data FC', 'BUNDESLIGA');
    expect(result).toBeNull();
  });

  it("also skips ESPN's other placeholder pairing (000000/C60000)", async () => {
    const response = {
      sports: [{ leagues: [{ teams: [
        { team: { displayName: 'Still No Data FC', name: 'Still No Data FC', shortDisplayName: 'Still No Data FC', color: '000000', alternateColor: 'C60000', logos: [] } },
      ] }] }],
    };
    mockFetch.mockResolvedValue(mockOk(response));
    const result = await espnColourService.getTeamColours('Still No Data FC', 'BUNDESLIGA');
    expect(result).toBeNull();
  });

  it('does not skip a genuinely all-black club (real color, no matching placeholder alternate)', async () => {
    const response = {
      sports: [{ leagues: [{ teams: [
        { team: { displayName: 'Genuinely Black FC', name: 'Genuinely Black FC', shortDisplayName: 'Genuinely Black FC', color: '000000', alternateColor: 'ffffff', logos: [] } },
      ] }] }],
    };
    mockFetch.mockResolvedValue(mockOk(response));
    const result = await espnColourService.getTeamColours('Genuinely Black FC', 'BUNDESLIGA');
    expect(result).toEqual(expect.objectContaining({ primary: '#000000', secondary: '#ffffff' }));
  });

  it('returns null when the league has no ESPN endpoint configured', async () => {
    const result = await espnColourService.getTeamColours('Anyone', 'NOT_A_LEAGUE');
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null for NRL specifically — no endpoint configured since ESPN provides no colour data for it', async () => {
    const result = await espnColourService.getTeamColours('Broncos', 'NRL');
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('has an endpoint configured for WNBA', async () => {
    mockFetch.mockResolvedValue(mockOk(MOCK_TEAMS_RESPONSE));
    await espnColourService.getTeamColours('Bayern Munich', 'WNBA');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('basketball/wnba/teams'),
      expect.any(Object)
    );
  });

  it('has an endpoint configured for NWSL', async () => {
    mockFetch.mockResolvedValue(mockOk(MOCK_TEAMS_RESPONSE));
    await espnColourService.getTeamColours('Bayern Munich', 'NWSL');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('soccer/usa.nwsl/teams'),
      expect.any(Object)
    );
  });

  it('has an endpoint configured for ALEAGUE', async () => {
    mockFetch.mockResolvedValue(mockOk(MOCK_TEAMS_RESPONSE));
    await espnColourService.getTeamColours('Bayern Munich', 'ALEAGUE');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('soccer/aus.1/teams'),
      expect.any(Object)
    );
  });

  it('has an endpoint configured for LIGAMX', async () => {
    mockFetch.mockResolvedValue(mockOk(MOCK_TEAMS_RESPONSE));
    await espnColourService.getTeamColours('Bayern Munich', 'LIGAMX');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('soccer/mex.1/teams'),
      expect.any(Object)
    );
  });

  it('has an endpoint configured for BRASILEIRAO', async () => {
    mockFetch.mockResolvedValue(mockOk(MOCK_TEAMS_RESPONSE));
    await espnColourService.getTeamColours('Bayern Munich', 'BRASILEIRAO');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('soccer/bra.1/teams'),
      expect.any(Object)
    );
  });

  it.each([
    ['ARGENTINA', 'soccer/arg.1/teams'],
    ['SAUDIPL', 'soccer/ksa.1/teams'],
    ['PRIMEIRALIGA', 'soccer/por.1/teams'],
    ['TURKEY', 'soccer/tur.1/teams'],
    ['SCOTLAND', 'soccer/sco.1/teams'],
    ['JLEAGUE', 'soccer/jpn.1/teams'],
    ['BELGIUM', 'soccer/bel.1/teams'],
    ['MLS', 'soccer/usa.1/teams'],
  ])('has an endpoint configured for %s', async (league, expectedPath) => {
    mockFetch.mockResolvedValue(mockOk(MOCK_TEAMS_RESPONSE));
    await espnColourService.getTeamColours('Bayern Munich', league);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(expectedPath), expect.any(Object));
  });

  it('returns null when the ESPN fetch fails', async () => {
    mockFetch.mockResolvedValue(Promise.resolve({ ok: false, status: 500 }));
    const result = await espnColourService.getTeamColours('Bayern Munich', 'BUNDESLIGA');
    expect(result).toBeNull();
  });
});
