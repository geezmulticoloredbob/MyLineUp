const request = require('supertest');
const app = require('../../app');
const { connect, disconnect, clearCollections } = require('./dbSetup');

beforeAll(() => connect());
afterAll(() => disconnect());
afterEach(() => clearCollections());

const VALID_USER = { username: 'alice', email: 'alice@test.com', password: 'Password1' };
const VALID_FAV = { league: 'NBA', teamId: 'nba-atl', teamName: 'Atlanta Hawks' };

async function registerAndGetAgent() {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(VALID_USER);
  return agent;
}

describe('GET /api/favourites', () => {
  it('returns empty list for a new user', async () => {
    const agent = await registerAndGetAgent();
    const res = await agent.get('/api/favourites');
    expect(res.status).toBe(200);
    expect(res.body.favourites).toEqual([]);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/favourites');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/favourites', () => {
  it('adds a favourite and returns it', async () => {
    const agent = await registerAndGetAgent();
    const res = await agent.post('/api/favourites').send(VALID_FAV);
    expect(res.status).toBe(201);
    expect(res.body.favourite.teamId).toBe('nba-atl');
    expect(res.body.favourite.teamName).toBe('Atlanta Hawks');
    expect(res.body.favourite.league).toBe('NBA');
  });

  it('is idempotent — re-adding the same team returns 201 without duplicates', async () => {
    const agent = await registerAndGetAgent();
    await agent.post('/api/favourites').send(VALID_FAV);
    await agent.post('/api/favourites').send(VALID_FAV);
    const listRes = await agent.get('/api/favourites');
    expect(listRes.body.favourites).toHaveLength(1);
  });

  it('rejects missing league with 400', async () => {
    const agent = await registerAndGetAgent();
    const res = await agent.post('/api/favourites').send({ teamId: 'nba-atl', teamName: 'Atlanta Hawks' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/api/favourites').send(VALID_FAV);
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/favourites/:id', () => {
  it('removes a favourite successfully', async () => {
    const agent = await registerAndGetAgent();
    const addRes = await agent.post('/api/favourites').send(VALID_FAV);
    const favId = addRes.body.favourite._id;

    const deleteRes = await agent.delete(`/api/favourites/${favId}`);
    expect(deleteRes.status).toBe(200);

    const listRes = await agent.get('/api/favourites');
    expect(listRes.body.favourites).toHaveLength(0);
  });

  it('returns 404 for an invalid ObjectId', async () => {
    const agent = await registerAndGetAgent();
    const res = await agent.delete('/api/favourites/not-a-valid-id');
    expect(res.status).toBe(404);
  });

  it('returns 404 when the favourite belongs to another user', async () => {
    const agent1 = await registerAndGetAgent();
    const agent2 = request.agent(app);
    await agent2.post('/api/auth/register').send({ username: 'bob', email: 'bob@test.com', password: 'Password1' });

    const addRes = await agent1.post('/api/favourites').send(VALID_FAV);
    const favId = addRes.body.favourite._id;

    const deleteRes = await agent2.delete(`/api/favourites/${favId}`);
    expect(deleteRes.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/api/favourites/507f1f77bcf86cd799439011');
    expect(res.status).toBe(401);
  });
});
