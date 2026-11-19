jest.mock('../../services/snapshotService', () => ({ getTeamHistory: jest.fn() }));
jest.mock('../../services/dashboardService', () => ({ buildDashboard: jest.fn() }));

const { getTeamTrend, getDashboard } = require('../../controllers/dashboardController');
const { getTeamHistory } = require('../../services/snapshotService');
const { buildDashboard } = require('../../services/dashboardService');

function makeRes() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const mockUser = { _id: 'user-1' };

describe('getDashboard', () => {
  beforeEach(() => {
    buildDashboard.mockResolvedValue({ leagues: [] });
  });

  it('defaults to page 1, limit 20 when no query params are given', async () => {
    await getDashboard({ user: mockUser, query: {} }, makeRes(), jest.fn());
    expect(buildDashboard).toHaveBeenCalledWith(mockUser, { page: 1, limit: 20 });
  });

  it('passes through valid page and limit values', async () => {
    await getDashboard({ user: mockUser, query: { page: '3', limit: '10' } }, makeRes(), jest.fn());
    expect(buildDashboard).toHaveBeenCalledWith(mockUser, { page: 3, limit: 10 });
  });

  it('clamps a page of 0 or negative up to 1', async () => {
    await getDashboard({ user: mockUser, query: { page: '0' } }, makeRes(), jest.fn());
    expect(buildDashboard).toHaveBeenCalledWith(mockUser, { page: 1, limit: 20 });

    await getDashboard({ user: mockUser, query: { page: '-5' } }, makeRes(), jest.fn());
    expect(buildDashboard).toHaveBeenCalledWith(mockUser, { page: 1, limit: 20 });
  });

  it('falls back to the default limit of 20 when limit is 0 (falsy, so the default wins before clamping)', async () => {
    await getDashboard({ user: mockUser, query: { limit: '0' } }, makeRes(), jest.fn());
    expect(buildDashboard).toHaveBeenCalledWith(mockUser, { page: 1, limit: 20 });
  });

  it('clamps a negative limit up to 1 (negative is truthy, so it reaches the Math.max clamp)', async () => {
    await getDashboard({ user: mockUser, query: { limit: '-5' } }, makeRes(), jest.fn());
    expect(buildDashboard).toHaveBeenCalledWith(mockUser, { page: 1, limit: 1 });
  });

  it('clamps a limit above 50 down to 50', async () => {
    await getDashboard({ user: mockUser, query: { limit: '500' } }, makeRes(), jest.fn());
    expect(buildDashboard).toHaveBeenCalledWith(mockUser, { page: 1, limit: 50 });
  });

  it('falls back to defaults when page or limit are not numeric', async () => {
    await getDashboard({ user: mockUser, query: { page: 'abc', limit: 'xyz' } }, makeRes(), jest.fn());
    expect(buildDashboard).toHaveBeenCalledWith(mockUser, { page: 1, limit: 20 });
  });

  it('returns the built dashboard as the response body', async () => {
    const dashboard = { leagues: [{ league: 'NBA' }], players: [] };
    buildDashboard.mockResolvedValue(dashboard);
    const res = makeRes();

    await getDashboard({ user: mockUser, query: {} }, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(dashboard);
  });
});

describe('getTeamTrend', () => {
  it('returns the snapshot history for the requested league and team', async () => {
    getTeamHistory.mockResolvedValue([{ capturedOn: '2026-09-01' }, { capturedOn: '2026-09-02' }]);
    const res = makeRes();

    await getTeamTrend({ params: { league: 'NBA', teamId: 'nba-bos' } }, res, jest.fn());

    expect(getTeamHistory).toHaveBeenCalledWith('NBA', 'nba-bos');
    expect(res.json).toHaveBeenCalledWith({ history: [{ capturedOn: '2026-09-01' }, { capturedOn: '2026-09-02' }] });
  });
});
