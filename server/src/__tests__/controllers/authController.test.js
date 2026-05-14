jest.mock('../../models/User', () => ({ findOne: jest.fn(), create: jest.fn() }));
jest.mock('bcryptjs', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('../../utils/jwt', () => ({ signToken: jest.fn() }));

const { register, login, getCurrentUser } = require('../../controllers/authController');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { signToken } = require('../../utils/jwt');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const mockUser = {
  _id: 'user-id-1',
  username: 'alice',
  email: 'alice@example.com',
  followedLeagues: [],
  onboardingComplete: false,
};

describe('authController', () => {
  describe('register', () => {
    it('creates a user and responds 201 with token and user shape', async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed-password');
      User.create.mockResolvedValue(mockUser);
      signToken.mockReturnValue('signed-token');

      const req = { body: { username: 'alice', email: 'Alice@Example.com', password: 'password123' } };
      const res = makeRes();
      await register(req, res, jest.fn());

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'alice@example.com',
        password: 'hashed-password',
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'signed-token',
        user: expect.objectContaining({ username: 'alice' }),
      }));
    });

    it('calls next with 409 when the email already exists', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing-user' });
      const next = jest.fn();
      await register({ body: { username: 'bob', email: 'existing@example.com', password: 'pass' } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
    });

    it('hashes the password before saving', async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed-password');
      User.create.mockResolvedValue(mockUser);
      signToken.mockReturnValue('tok');

      await register({ body: { username: 'alice', email: 'a@b.com', password: 'plaintext' } }, makeRes(), jest.fn());

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 10);
    });
  });

  describe('login', () => {
    it('returns token and user on valid credentials', async () => {
      User.findOne.mockResolvedValue({ ...mockUser, password: 'hashed-password' });
      bcrypt.compare.mockResolvedValue(true);
      signToken.mockReturnValue('login-token');

      const res = makeRes();
      await login({ body: { email: 'alice@example.com', password: 'password123' } }, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'login-token',
        user: expect.objectContaining({ username: 'alice' }),
      }));
    });

    it('calls next with 401 when the email is not found', async () => {
      User.findOne.mockResolvedValue(null);
      const next = jest.fn();
      await login({ body: { email: 'ghost@example.com', password: 'pass' } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('calls next with 401 when the password is wrong', async () => {
      User.findOne.mockResolvedValue({ ...mockUser, password: 'hashed-password' });
      bcrypt.compare.mockResolvedValue(false);
      const next = jest.fn();
      await login({ body: { email: 'alice@example.com', password: 'wrongpass' } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('lowercases the email before looking up the user', async () => {
      User.findOne.mockResolvedValue(null);
      await login({ body: { email: 'Alice@EXAMPLE.COM', password: 'pass' } }, makeRes(), jest.fn());
      expect(User.findOne).toHaveBeenCalledWith({ email: 'alice@example.com' });
    });
  });

  describe('getCurrentUser', () => {
    it('returns the shaped user from req.user', async () => {
      const res = makeRes();
      await getCurrentUser({ user: mockUser }, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          username: 'alice',
          email: 'alice@example.com',
          followedLeagues: [],
          onboardingComplete: false,
        }),
      });
    });

    it('does not include the password in the response', async () => {
      const res = makeRes();
      await getCurrentUser({ user: { ...mockUser, password: 'should-be-hidden' } }, res, jest.fn());
      const [{ user }] = res.json.mock.calls[0];
      expect(user).not.toHaveProperty('password');
    });
  });
});
