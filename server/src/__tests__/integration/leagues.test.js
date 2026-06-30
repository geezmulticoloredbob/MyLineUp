const request = require('supertest');
const app = require('../../app');
const { connect, disconnect, clearCollections } = require('./dbSetup');

beforeAll(() => connect());
afterAll(() => disconnect());
afterEach(() => clearCollections());

const VALID_USER = { username: 'alice', email: 'alice@test.com', password: 'Password1' };

async function registerAndGetAgent() {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(VALID_USER);
  return agent;
}

describe('GET /api/leagues', () => {
  it('returns empty followedLeagues for a new user', async () => {
    const agent = await registerAndGetAgent();
    const res = await agent.get('/api/leagues');
    expect(res.status).toBe(200);
    expect(res.body.followedLeagues).toEqual([]);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/leagues');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/leagues', () => {
  it('updates followed leagues and returns the new list', async () => {
    const agent = await registerAndGetAgent();
    const res = await agent.put('/api/leagues').send({ leagues: ['NBA', 'AFL'] });
    expect(res.status).toBe(200);
    expect(res.body.followedLeagues).toEqual(expect.arrayContaining(['NBA', 'AFL']));
    expect(res.body.followedLeagues).toHaveLength(2);
  });

  it('accepts WC as a valid league code', async () => {
    const agent = await registerAndGetAgent();
    const res = await agent.put('/api/leagues').send({ leagues: ['WC'] });
    expect(res.status).toBe(200);
    expect(res.body.followedLeagues).toContain('WC');
  });

  it.each(['LALIGA', 'BUNDESLIGA', 'SERIEA', 'LIGUE1'])('accepts %s as a valid league code', async (code) => {
    const agent = await registerAndGetAgent();
    const res = await agent.put('/api/leagues').send({ leagues: [code] });
    expect(res.status).toBe(200);
    expect(res.body.followedLeagues).toContain(code);
  });

  it('accepts an empty array to unfollow all leagues', async () => {
    const agent = await registerAndGetAgent();
    await agent.put('/api/leagues').send({ leagues: ['NBA'] });
    const res = await agent.put('/api/leagues').send({ leagues: [] });
    expect(res.status).toBe(200);
    expect(res.body.followedLeagues).toEqual([]);
  });

  it('rejects an invalid league code with 400', async () => {
    const agent = await registerAndGetAgent();
    const res = await agent.put('/api/leagues').send({ leagues: ['NBA', 'INVALID'] });
    expect(res.status).toBe(400);
  });

  it('rejects non-array input with 400', async () => {
    const agent = await registerAndGetAgent();
    const res = await agent.put('/api/leagues').send({ leagues: 'NBA' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).put('/api/leagues').send({ leagues: ['NBA'] });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/leagues/complete-onboarding', () => {
  it('sets onboardingComplete and returns true', async () => {
    const agent = await registerAndGetAgent();
    const res = await agent.post('/api/leagues/complete-onboarding');
    expect(res.status).toBe(200);
    expect(res.body.onboardingComplete).toBe(true);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/api/leagues/complete-onboarding');
    expect(res.status).toBe(401);
  });
});
