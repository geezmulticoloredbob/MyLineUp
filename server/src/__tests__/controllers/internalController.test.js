jest.mock('../../services/snapshotService', () => ({ captureSnapshots: jest.fn() }));

const { refreshSnapshots } = require('../../controllers/internalController');
const { captureSnapshots } = require('../../services/snapshotService');

function makeRes() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('refreshSnapshots', () => {
  it('runs captureSnapshots and returns its summary', async () => {
    captureSnapshots.mockResolvedValue({ teamsConsidered: 3, captured: 2, skipped: 1 });
    const res = makeRes();

    await refreshSnapshots({}, res, jest.fn());

    expect(captureSnapshots).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ teamsConsidered: 3, captured: 2, skipped: 1 });
  });

  it('propagates errors to next via asyncHandler', async () => {
    captureSnapshots.mockRejectedValue(new Error('boom'));
    const next = jest.fn();

    await refreshSnapshots({}, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
