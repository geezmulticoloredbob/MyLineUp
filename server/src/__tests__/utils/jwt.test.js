describe('jwt utils', () => {
  let signToken;
  let verifyToken;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests';
    jest.resetModules();
    ({ signToken, verifyToken } = require('../../utils/jwt'));
  });

  it('produces a token that verifies back to the original payload', () => {
    const token = signToken({ userId: 'abc123' });
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('abc123');
  });

  it('includes standard JWT claims (iat, exp)', () => {
    const token = signToken({ userId: 'abc' });
    const decoded = verifyToken(token);
    expect(decoded).toHaveProperty('iat');
    expect(decoded).toHaveProperty('exp');
  });

  it('throws on a completely invalid token string', () => {
    expect(() => verifyToken('not.a.valid.token')).toThrow();
  });

  it('throws on a token signed with a different secret', () => {
    const jwt = require('jsonwebtoken');
    const tampered = jwt.sign({ userId: 'hacker' }, 'wrong-secret');
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('throws on a structurally valid but tampered token', () => {
    const token = signToken({ userId: 'abc' });
    expect(() => verifyToken(token + 'x')).toThrow();
  });
});
