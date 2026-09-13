const crypto = require('crypto');
const ApiError = require('../utils/apiError');
const env = require('../config/env');

// Machine-to-machine auth for endpoints the GitHub Actions cron job calls —
// deliberately separate from requireAuth's user-cookie flow, since there's
// no logged-in user here. A plain !== compare on a secret would leak timing
// information; timingSafeEqual needs equal-length buffers, so length is
// checked first (a length mismatch is itself safe to reveal — the attacker
// already knows their own guess's length).
function requireInternalSecret(req, res, next) {
  const configured = env.internalRefreshSecret;
  const provided = req.get('x-internal-secret') || '';

  if (!configured) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  const configuredBuf = Buffer.from(configured);
  const providedBuf = Buffer.from(provided);

  const matches =
    configuredBuf.length === providedBuf.length && crypto.timingSafeEqual(configuredBuf, providedBuf);

  if (!matches) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  next();
}

module.exports = { requireInternalSecret };
