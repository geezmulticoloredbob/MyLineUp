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
                color: '000000',
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

  it('returns null when the league has no ESPN endpoint configured', async () => {
    const result = await espnColourService.getTeamColours('Anyone', 'NOT_A_LEAGUE');
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null when the ESPN fetch fails', async () => {
    mockFetch.mockResolvedValue(Promise.resolve({ ok: false, status: 500 }));
    const result = await espnColourService.getTeamColours('Bayern Munich', 'BUNDESLIGA');
    expect(result).toBeNull();
  });
});
