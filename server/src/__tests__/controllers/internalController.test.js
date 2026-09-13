jest.mock('../../services/snapshotService', () => ({ captureSnapshots: jest.fn() }));

const { refreshSnapshots } = require('../../controllers/internalController');
const { captureSnapshots } = require('../../services/snapshotService');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function flushMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('refreshSnapshots', () => {
  it('responds 202 immediately, without waiting for captureSnapshots to finish', async () => {
    let resolveCaptureSnapshots;
    captureSnapshots.mockReturnValue(
      new Promise((resolve) => {
        resolveCaptureSnapshots = resolve;
      })
    );
    const res = makeRes();

    await refreshSnapshots({}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    expect(captureSnapshots).toHaveBeenCalled();

    resolveCaptureSnapshots({ teamsConsidered: 1, captured: 1, skipped: 0 });
    await flushMicrotasks();
  });

  it('logs the result once captureSnapshots resolves in the background', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    captureSnapshots.mockResolvedValue({ teamsConsidered: 2, captured: 2, skipped: 0 });

    await refreshSnapshots({}, makeRes(), jest.fn());
    await flushMicrotasks();

    expect(logSpy).toHaveBeenCalledWith('Snapshot refresh complete:', { teamsConsidered: 2, captured: 2, skipped: 0 });
    logSpy.mockRestore();
  });

  it('logs rather than throwing when captureSnapshots rejects in the background', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    captureSnapshots.mockRejectedValue(new Error('boom'));
    const next = jest.fn();

    await refreshSnapshots({}, makeRes(), next);
    await flushMicrotasks();

    expect(next).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Snapshot refresh failed:', expect.any(Error));
    errorSpy.mockRestore();
  });
});
