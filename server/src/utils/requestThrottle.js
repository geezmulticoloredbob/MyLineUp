// A per-bucket request queue: calls tagged with the same bucket run one at a
// time, with at least `minSpacingMs` between the START of one call and the
// next. Exists because several of our external sports APIs enforce a global
// per-minute rate limit on the whole API key/IP — not per-team or
// per-competition — so a dashboard favouriting several teams fires a burst
// of parallel calls that blows straight through it, even though each
// individual call is already cached and deduped correctly on its own.
//
// A rejected call doesn't block the bucket — the next queued call still runs
// on schedule.
const _queues = new Map(); // bucket -> tail promise of the queue
const _lastStartedAt = new Map(); // bucket -> timestamp the last call began

function throttle(bucket, minSpacingMs, fn) {
  const previous = _queues.get(bucket) || Promise.resolve();

  const runAfterWait = previous.then(async () => {
    const last = _lastStartedAt.get(bucket) || 0;
    const wait = last + minSpacingMs - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    _lastStartedAt.set(bucket, Date.now());
    return fn();
  });

  // Chain the queue on a version that never rejects, so one failed call
  // doesn't stall everything queued behind it — but return the real
  // (possibly-rejecting) promise to this call's own caller.
  _queues.set(bucket, runAfterWait.catch(() => {}));
  return runAfterWait;
}

module.exports = { throttle };
