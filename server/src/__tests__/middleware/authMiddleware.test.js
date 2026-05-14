jest.mock('../../utils/jwt');
jest.mock('../../models/User', () => ({ findById: jest.fn() }));

const { requireAuth } = require('../../middleware/authMiddleware');
const { verifyToken } = require('../../utils/jwt');
const User = require('../../models/User');

function makeContext(authHeader) {
  return {
    req: { headers: { authorization: authHeader ?? '' } },
    res: {},
    next: jest.fn(),
  };
}

describe('requireAuth', () => {
  it('calls next with 401 when there is no Authorization header', async () => {
    const { req, res, next } = makeContext('');
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with 401 when the scheme is not Bearer', async () => {
    const { req, res, next } = makeContext('Basic dXNlcjpwYXNz');
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with an error when the token fails verification', async () => {
    verifyToken.mockImplementation(() => { throw new Error('jwt malformed'); });
    const { req, res, next } = makeContext('Bearer bad.token.here');
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('calls next with 401 when the user is not found in the database', async () => {
    verifyToken.mockReturnValue({ userId: 'abc' });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const { req, res, next } = makeContext('Bearer valid.token.here');
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('sets req.user and calls next with no args on success', async () => {
    const mockUser = { _id: 'abc', username: 'alice' };
    verifyToken.mockReturnValue({ userId: 'abc' });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
    const { req, res, next } = makeContext('Bearer valid.token.here');
    await requireAuth(req, res, next);
    expect(req.user).toBe(mockUser);
    expect(next).toHaveBeenCalledWith();
  });
});
