const { createGracefulShutdown } = require('../gracefulShutdown');

function makeServer(closeBehavior = (cb) => cb(null)) {
  return { close: jest.fn(closeBehavior) };
}

describe('createGracefulShutdown', () => {
  it('closes the HTTP server, then the database, then exits 0 on success', async () => {
    const server = makeServer();
    const closeDatabase = jest.fn().mockResolvedValue(undefined);
    const exit = jest.fn();
    const log = jest.fn();

    const shutdown = createGracefulShutdown({ server, closeDatabase, exit, log });
    shutdown('SIGTERM');

    await new Promise(process.nextTick);

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(closeDatabase).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('SIGTERM'));
  });

  it('exits 1 if closing the HTTP server errors, but still attempts to close the database', async () => {
    const httpError = new Error('server close failed');
    const server = makeServer((cb) => cb(httpError));
    const closeDatabase = jest.fn().mockResolvedValue(undefined);
    const exit = jest.fn();

    const shutdown = createGracefulShutdown({ server, closeDatabase, exit, log: jest.fn() });
    shutdown('SIGTERM');

    await new Promise(process.nextTick);

    expect(closeDatabase).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('exits 1 if closing the database throws, without hanging', async () => {
    const server = makeServer();
    const closeDatabase = jest.fn().mockRejectedValue(new Error('db close failed'));
    const exit = jest.fn();

    const shutdown = createGracefulShutdown({ server, closeDatabase, exit, log: jest.fn() });
    shutdown('SIGTERM');

    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('is idempotent — a second signal while already shutting down is a no-op', async () => {
    const server = makeServer();
    const closeDatabase = jest.fn().mockResolvedValue(undefined);
    const exit = jest.fn();

    const shutdown = createGracefulShutdown({ server, closeDatabase, exit, log: jest.fn() });
    shutdown('SIGTERM');
    shutdown('SIGINT');

    await new Promise(process.nextTick);

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('force-exits if the server never finishes closing within the timeout', () => {
    jest.useFakeTimers();
    try {
      const server = { close: jest.fn() }; // never calls back — simulates a hung shutdown
      const closeDatabase = jest.fn();
      const exit = jest.fn();

      const shutdown = createGracefulShutdown({ server, closeDatabase, exit, log: jest.fn(), timeoutMs: 10000 });
      shutdown('SIGTERM');

      expect(exit).not.toHaveBeenCalled();
      jest.advanceTimersByTime(10000);

      expect(exit).toHaveBeenCalledWith(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
