const request = require('supertest');
const app = require('../../app');
const { connect, disconnect, clearCollections } = require('./dbSetup');

beforeAll(() => connect());
afterAll(() => disconnect());
afterEach(() => clearCollections());

const VALID_USER = { username: 'alice', email: 'alice@test.com', password: 'Password1' };

describe('POST /api/auth/register', () => {
  it('creates a user and sets a cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(VALID_USER);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user.username).toBe('alice');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(VALID_USER);
    const res = await request(app).post('/api/auth/register').send({ ...VALID_USER, username: 'alice2' });
    expect(res.status).toBe(409);
  });

  it('rejects missing username with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@test.com', password: 'Password1' });
    expect(res.status).toBe(400);
  });

  it('rejects a weak password (no uppercase) with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'bob', email: 'bob@test.com', password: 'password1' });
    expect(res.status).toBe(400);
  });

  it('rejects a weak password (no number) with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'bob', email: 'bob@test.com', password: 'Password' });
    expect(res.status).toBe(400);
  });

  it('rejects a short password with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'bob', email: 'bob@test.com', password: 'P1' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => request(app).post('/api/auth/register').send(VALID_USER));

  it('returns user and sets a cookie on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@test.com', password: 'Password1' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@test.com', password: 'Wrong123' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'Password1' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user when authenticated', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(VALID_USER);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@test.com');
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session so subsequent /me returns 401', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(VALID_USER);
    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);
    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(401);
  });
});
