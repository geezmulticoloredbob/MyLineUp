jest.mock('../../services/snapshotService', () => ({ getTeamHistory: jest.fn() }));

const { getTeamTrend } = require('../../controllers/dashboardController');
const { getTeamHistory } = require('../../services/snapshotService');

function makeRes() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('getTeamTrend', () => {
  it('returns the snapshot history for the requested league and team', async () => {
    getTeamHistory.mockResolvedValue([{ capturedOn: '2026-09-01' }, { capturedOn: '2026-09-02' }]);
    const res = makeRes();

    await getTeamTrend({ params: { league: 'NBA', teamId: 'nba-bos' } }, res, jest.fn());

    expect(getTeamHistory).toHaveBeenCalledWith('NBA', 'nba-bos');
    expect(res.json).toHaveBeenCalledWith({ history: [{ capturedOn: '2026-09-01' }, { capturedOn: '2026-09-02' }] });
  });
});
