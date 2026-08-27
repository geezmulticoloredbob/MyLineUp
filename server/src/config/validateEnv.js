const PLACEHOLDER_JWT_SECRET = 'replace-with-a-long-random-string';
const PLACEHOLDER_MONGO_URI = 'mongodb://127.0.0.1:27017/mylineup';
const MIN_JWT_SECRET_LENGTH = 32;

// Returns a list of fatal startup problems for the given config — empty when
// everything checks out. `rawEnv` is process.env itself, needed alongside the
// resolved `env` (config/env.js) to tell "unset" apart from "defaulted" —
// CLIENT_URL always has a value via its localhost fallback, so env.clientUrl
// alone can't tell us whether it was actually set.
function findEnvProblems(env, rawEnv) {
  const problems = [];

  if (!rawEnv.MONGODB_URI) problems.push('missing required environment variable: MONGODB_URI');
  if (!rawEnv.JWT_SECRET) problems.push('missing required environment variable: JWT_SECRET');

  if (env.nodeEnv === 'production') {
    // A missing CLIENT_URL wouldn't crash the server — it would just silently
    // scope CORS to localhost and block all real production traffic.
    if (!rawEnv.CLIENT_URL) {
      problems.push('missing required environment variable: CLIENT_URL');
    }

    if (env.jwtSecret && (env.jwtSecret === PLACEHOLDER_JWT_SECRET || env.jwtSecret.length < MIN_JWT_SECRET_LENGTH)) {
      problems.push(`JWT_SECRET is too short or still the .env.example placeholder — set a long, random production secret (${MIN_JWT_SECRET_LENGTH}+ chars)`);
    }

    if (env.mongoUri === PLACEHOLDER_MONGO_URI) {
      problems.push('MONGODB_URI is still the local placeholder from .env.example — set your production connection string');
    }
  }

  return problems;
}

module.exports = { findEnvProblems };
