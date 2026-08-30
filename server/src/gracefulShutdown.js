// Stops the HTTP server accepting new connections, lets in-flight requests
// drain, closes the DB connection, then exits — instead of the process
// dying mid-request on every redeploy/restart, which is what happens by
// default when a host sends SIGTERM and nothing is listening for it.
//
// Dependencies are injected (rather than importing the real http server,
// mongoose, and process.exit directly) so this is testable without spinning
// up a real server or database connection.
function createGracefulShutdown({ server, closeDatabase, log = console.log, exit = process.exit, timeoutMs = 10000 }) {
  let shuttingDown = false;

  return function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    log(`${signal} received: closing server gracefully`);

    const forceExitTimer = setTimeout(() => {
      log('Graceful shutdown timed out — forcing exit');
      exit(1);
    }, timeoutMs);
    forceExitTimer.unref?.();

    server.close(async (err) => {
      if (err) log('Error closing HTTP server', err);

      let dbError = null;
      try {
        await closeDatabase();
      } catch (closeErr) {
        dbError = closeErr;
        log('Error closing database connection', closeErr);
      }

      clearTimeout(forceExitTimer);
      exit(err || dbError ? 1 : 0);
    });
  };
}

module.exports = { createGracefulShutdown };
