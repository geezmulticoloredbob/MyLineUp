const { throttle } = require('../../utils/requestThrottle');

// Each test uses its own bucket name so the module's shared queue/timestamp
// maps don't leak state between tests.
describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs the first call to a bucket immediately, with no wait', async () => {
    const fn = jest.fn().mockResolvedValue('result');
    const promise = throttle('bucket-a', 1000, fn);
    await Promise.resolve();

    expect(fn).toHaveBeenCalledTimes(1);
    await expect(promise).resolves.toBe('result');
  });

  it('delays a second call to the same bucket until minSpacingMs has passed', async () => {
    const fn1 = jest.fn().mockResolvedValue('a');
    const fn2 = jest.fn().mockResolvedValue('b');

    const p1 = throttle('bucket-b', 1000, fn1);
    const p2 = throttle('bucket-b', 1000, fn2);
    await Promise.resolve();

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(999);
    expect(fn2).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(fn2).toHaveBeenCalledTimes(1);

    await expect(p1).resolves.toBe('a');
    await expect(p2).resolves.toBe('b');
  });

  it('does not delay calls made to a different bucket', async () => {
    const fnA = jest.fn().mockResolvedValue('a');
    const fnB = jest.fn().mockResolvedValue('b');

    throttle('bucket-c', 5000, fnA);
    throttle('bucket-d', 5000, fnB);
    await Promise.resolve();

    expect(fnA).toHaveBeenCalledTimes(1);
    expect(fnB).toHaveBeenCalledTimes(1);
  });

  it('a rejected call does not block the next queued call in the same bucket', async () => {
    const fn1 = jest.fn().mockRejectedValue(new Error('boom'));
    const fn2 = jest.fn().mockResolvedValue('ok');

    const p1 = throttle('bucket-e', 1000, fn1);
    const p2 = throttle('bucket-e', 1000, fn2);

    await expect(p1).rejects.toThrow('boom');

    await jest.advanceTimersByTimeAsync(1000);
    expect(fn2).toHaveBeenCalledTimes(1);
    await expect(p2).resolves.toBe('ok');
  });

  it('spaces three consecutive calls at least minSpacingMs apart each', async () => {
    const calls = [];
    const fn = () => {
      calls.push(Date.now());
      return Promise.resolve();
    };

    throttle('bucket-f', 500, fn);
    throttle('bucket-f', 500, fn);
    throttle('bucket-f', 500, fn);

    await jest.advanceTimersByTimeAsync(1000);

    expect(calls).toHaveLength(3);
    expect(calls[1] - calls[0]).toBeGreaterThanOrEqual(500);
    expect(calls[2] - calls[1]).toBeGreaterThanOrEqual(500);
  });
});
