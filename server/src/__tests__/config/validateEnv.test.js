const { findEnvProblems } = require('../../config/validateEnv');

const validEnv = {
  nodeEnv: 'production',
  jwtSecret: 'a'.repeat(32),
  mongoUri: 'mongodb+srv://user:pass@prod-cluster.mongodb.net/mylineup',
};

const validRawEnv = {
  MONGODB_URI: validEnv.mongoUri,
  JWT_SECRET: validEnv.jwtSecret,
  CLIENT_URL: 'https://mylineup.example.com',
};

describe('findEnvProblems', () => {
  it('returns no problems for a fully-configured production env', () => {
    expect(findEnvProblems(validEnv, validRawEnv)).toEqual([]);
  });

  it('returns no problems for a dev env missing CLIENT_URL and with a short secret', () => {
    const devEnv = { nodeEnv: 'development', jwtSecret: 'short', mongoUri: 'mongodb://127.0.0.1:27017/mylineup' };
    const devRawEnv = { MONGODB_URI: devEnv.mongoUri, JWT_SECRET: devEnv.jwtSecret };
    expect(findEnvProblems(devEnv, devRawEnv)).toEqual([]);
  });

  it('flags a missing MONGODB_URI regardless of environment', () => {
    const rawEnv = { ...validRawEnv, MONGODB_URI: '' };
    expect(findEnvProblems(validEnv, rawEnv)).toContain('missing required environment variable: MONGODB_URI');
  });

  it('flags a missing JWT_SECRET regardless of environment', () => {
    const rawEnv = { ...validRawEnv, JWT_SECRET: '' };
    expect(findEnvProblems(validEnv, rawEnv)).toContain('missing required environment variable: JWT_SECRET');
  });

  it('flags a missing CLIENT_URL only in production', () => {
    const rawEnv = { ...validRawEnv, CLIENT_URL: '' };
    expect(findEnvProblems(validEnv, rawEnv)).toContain('missing required environment variable: CLIENT_URL');

    const devEnv = { ...validEnv, nodeEnv: 'development' };
    expect(findEnvProblems(devEnv, rawEnv)).toEqual([]);
  });

  it('flags a JWT_SECRET left as the .env.example placeholder in production', () => {
    const env = { ...validEnv, jwtSecret: 'replace-with-a-long-random-string' };
    const problems = findEnvProblems(env, validRawEnv);
    expect(problems.some((p) => p.includes('JWT_SECRET'))).toBe(true);
  });

  it('flags a JWT_SECRET shorter than 32 characters in production', () => {
    const env = { ...validEnv, jwtSecret: 'a'.repeat(31) };
    const problems = findEnvProblems(env, validRawEnv);
    expect(problems.some((p) => p.includes('JWT_SECRET'))).toBe(true);
  });

  it('accepts a JWT_SECRET exactly 32 characters long', () => {
    const env = { ...validEnv, jwtSecret: 'a'.repeat(32) };
    expect(findEnvProblems(env, validRawEnv)).toEqual([]);
  });

  it('flags a MONGODB_URI left as the local placeholder in production', () => {
    const env = { ...validEnv, mongoUri: 'mongodb://127.0.0.1:27017/mylineup' };
    const problems = findEnvProblems(env, validRawEnv);
    expect(problems.some((p) => p.includes('MONGODB_URI'))).toBe(true);
  });

  it('collects every problem at once rather than stopping at the first', () => {
    // Missing CLIENT_URL + a too-short JWT_SECRET + a placeholder MONGODB_URI
    const env = { nodeEnv: 'production', jwtSecret: 'short', mongoUri: 'mongodb://127.0.0.1:27017/mylineup' };
    const rawEnv = { MONGODB_URI: env.mongoUri, JWT_SECRET: env.jwtSecret, CLIENT_URL: '' };
    const problems = findEnvProblems(env, rawEnv);
    expect(problems).toHaveLength(3);
  });
});
