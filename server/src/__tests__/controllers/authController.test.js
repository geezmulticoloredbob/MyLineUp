jest.mock('../../models/User', () => ({ findOne: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn(), findById: jest.fn() }));
jest.mock('bcryptjs', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('../../utils/jwt', () => ({ signToken: jest.fn() }));
jest.mock('../../utils/email', () => ({ sendPasswordResetEmail: jest.fn() }));

const {
  register,
  login,
  logout,
  getCurrentUser,
  updateIcon,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require('../../controllers/authController');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { signToken } = require('../../utils/jwt');
const { sendPasswordResetEmail } = require('../../utils/email');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
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
      expect(res.cookie).toHaveBeenCalledWith('token', 'signed-token', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ username: 'alice' }),
      }));
      expect(res.json.mock.calls[0][0]).not.toHaveProperty('token');
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

      expect(res.cookie).toHaveBeenCalledWith('token', 'login-token', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ username: 'alice' }),
      }));
      expect(res.json.mock.calls[0][0]).not.toHaveProperty('token');
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

  describe('logout', () => {
    it('clears the token cookie and returns a success message', async () => {
      const res = makeRes();
      await logout({}, res, jest.fn());
      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out' });
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

    it('defaults followedLeagues, onboardingComplete, and iconId when absent on the user doc', async () => {
      const res = makeRes();
      await getCurrentUser({ user: { _id: 'u1', username: 'bare', email: 'bare@example.com' } }, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({ followedLeagues: [], onboardingComplete: false, iconId: 'football' }),
      });
    });
  });

  describe('updateIcon', () => {
    it('updates the icon and returns the shaped user', async () => {
      User.findByIdAndUpdate.mockResolvedValue({ ...mockUser, iconId: 'trophy' });
      const res = makeRes();

      await updateIcon({ user: mockUser, body: { iconId: 'trophy' } }, res, jest.fn());

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { iconId: 'trophy' },
        expect.objectContaining({ returnDocument: 'after' })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ user: expect.objectContaining({ iconId: 'trophy' }) })
      );
    });

    it('calls next with 400 when iconId is missing', async () => {
      const next = jest.fn();
      await updateIcon({ user: mockUser, body: {} }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('calls next with 400 when iconId is not one of the known icons', async () => {
      const next = jest.fn();
      await updateIcon({ user: mockUser, body: { iconId: 'not-a-real-icon' } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('updates the username when it is valid', async () => {
      User.findByIdAndUpdate.mockResolvedValue({ ...mockUser, username: 'newname' });
      const res = makeRes();

      await updateProfile({ user: mockUser, body: { username: '  newname  ' } }, res, jest.fn());

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { username: 'newname' },
        expect.objectContaining({ returnDocument: 'after' })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ user: expect.objectContaining({ username: 'newname' }) })
      );
    });

    it('calls next with 400 when the username is too short', async () => {
      const next = jest.fn();
      await updateProfile({ user: mockUser, body: { username: 'a' } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('calls next with 400 when the username is too long', async () => {
      const next = jest.fn();
      await updateProfile({ user: mockUser, body: { username: 'x'.repeat(31) } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('updates the email when it is valid and not taken', async () => {
      User.findOne.mockResolvedValue(null);
      User.findByIdAndUpdate.mockResolvedValue({ ...mockUser, email: 'new@example.com' });
      const res = makeRes();

      await updateProfile({ user: mockUser, body: { email: 'New@Example.com' } }, res, jest.fn());

      expect(User.findOne).toHaveBeenCalledWith({ email: 'new@example.com', _id: { $ne: mockUser._id } });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { email: 'new@example.com' },
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ user: expect.objectContaining({ email: 'new@example.com' }) })
      );
    });

    it('calls next with 400 when the email is not validly formatted', async () => {
      const next = jest.fn();
      await updateProfile({ user: mockUser, body: { email: 'not-an-email' } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('calls next with 409 when the email is already taken by another user', async () => {
      User.findOne.mockResolvedValue({ _id: 'someone-else' });
      const next = jest.fn();
      await updateProfile({ user: mockUser, body: { email: 'taken@example.com' } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('updates both username and email together in one call', async () => {
      User.findOne.mockResolvedValue(null);
      User.findByIdAndUpdate.mockResolvedValue({ ...mockUser, username: 'newname', email: 'new@example.com' });

      await updateProfile(
        { user: mockUser, body: { username: 'newname', email: 'new@example.com' } },
        makeRes(),
        jest.fn()
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { username: 'newname', email: 'new@example.com' },
        expect.any(Object)
      );
    });

    it('calls next with 400 when neither username nor email is provided', async () => {
      const next = jest.fn();
      await updateProfile({ user: mockUser, body: {} }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('updatePassword', () => {
    it('updates the password when the current password is correct and the new one is valid', async () => {
      User.findById.mockResolvedValue({ ...mockUser, password: 'old-hashed' });
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('new-hashed');
      const res = makeRes();

      await updatePassword(
        { user: mockUser, body: { currentPassword: 'OldPass1', newPassword: 'NewPass1' } },
        res,
        jest.fn()
      );

      expect(bcrypt.compare).toHaveBeenCalledWith('OldPass1', 'old-hashed');
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass1', 10);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(mockUser._id, { password: 'new-hashed' });
      expect(res.json).toHaveBeenCalledWith({ message: 'Password updated' });
    });

    it('calls next with 400 when currentPassword or newPassword is missing', async () => {
      const next = jest.fn();
      await updatePassword({ user: mockUser, body: { newPassword: 'NewPass1' } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('calls next with 400 when the new password is too short', async () => {
      const next = jest.fn();
      await updatePassword(
        { user: mockUser, body: { currentPassword: 'OldPass1', newPassword: 'short1' } },
        makeRes(),
        next
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('calls next with 400 when the new password lacks an uppercase letter or a number', async () => {
      const next = jest.fn();
      await updatePassword(
        { user: mockUser, body: { currentPassword: 'OldPass1', newPassword: 'alllowercase' } },
        makeRes(),
        next
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('calls next with 401 when the current password is wrong', async () => {
      User.findById.mockResolvedValue({ ...mockUser, password: 'old-hashed' });
      bcrypt.compare.mockResolvedValue(false);
      const next = jest.fn();

      await updatePassword(
        { user: mockUser, body: { currentPassword: 'WrongPass1', newPassword: 'NewPass1' } },
        makeRes(),
        next
      );

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('forgotPassword', () => {
    it('generates a reset token, saves it, and emails a reset link when the account exists', async () => {
      const save = jest.fn().mockResolvedValue();
      User.findOne.mockResolvedValue({ ...mockUser, save });
      const res = makeRes();

      await forgotPassword({ body: { email: 'alice@example.com' } }, res, jest.fn());

      expect(save).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalledWith('alice@example.com', expect.stringContaining('/reset-password/'));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });

    it('responds the same way when no account matches, and sends no email', async () => {
      User.findOne.mockResolvedValue(null);
      const res = makeRes();

      await forgotPassword({ body: { email: 'ghost@example.com' } }, res, jest.fn());

      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });

    it('lowercases the email before looking up the user', async () => {
      User.findOne.mockResolvedValue(null);
      await forgotPassword({ body: { email: 'Alice@EXAMPLE.com' } }, makeRes(), jest.fn());
      expect(User.findOne).toHaveBeenCalledWith({ email: 'alice@example.com' });
    });
  });

  describe('resetPassword', () => {
    it('hashes and saves the new password, clearing the reset token', async () => {
      const save = jest.fn().mockResolvedValue();
      User.findOne.mockResolvedValue({ ...mockUser, save });
      bcrypt.hash.mockResolvedValue('new-hashed-password');
      const res = makeRes();

      await resetPassword({ params: { token: 'raw-token' }, body: { password: 'NewPass1' } }, res, jest.fn());

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass1', 10);
      expect(save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });

    it('calls next with 400 when the token is invalid or expired', async () => {
      User.findOne.mockResolvedValue(null);
      const next = jest.fn();
      await resetPassword({ params: { token: 'bad-token' }, body: { password: 'NewPass1' } }, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });
});
