const asyncHandler = require('../utils/asyncHandler');
const { captureSnapshots } = require('../services/snapshotService');

// Fire-and-forget: captureSnapshots() can take several minutes when many
// teams route through the same rate-limited provider (football-data.org's
// per-minute limit is shared across 8 leagues — see requestThrottle.js), and
// that comfortably exceeds Render's proxy timeout for a held-open request.
// So this responds immediately and lets the actual work continue in the
// background; the GitHub Actions cron only needs confirmation the run
// started, not that it finished. Deliberately NOT awaited, and its own
// .catch logs rather than rejecting — letting it reject here would hand an
// error to asyncHandler's catch(next) after the response has already sent.
const refreshSnapshots = asyncHandler(async (req, res) => {
  res.status(202).json({ message: 'Snapshot refresh started — check server logs for the summary.' });

  captureSnapshots()
    .then((result) => console.log('Snapshot refresh complete:', result))
    .catch((err) => console.error('Snapshot refresh failed:', err));
});

module.exports = {
  refreshSnapshots,
};
