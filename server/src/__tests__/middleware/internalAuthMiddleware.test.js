jest.mock('../../config/env', () => ({ internalRefreshSecret: 'correct-secret' }));

const { requireInternalSecret } = require('../../middleware/internalAuthMiddleware');

function makeReq(headerValue) {
  return { get: (name) => (name === 'x-internal-secret' ? headerValue : undefined) };
}

describe('requireInternalSecret', () => {
  it('calls next() with no error when the header matches the configured secret', () => {
    const next = jest.fn();
    requireInternalSecret(makeReq('correct-secret'), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next with 401 when the header is missing', () => {
    const next = jest.fn();
    requireInternalSecret(makeReq(undefined), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with 401 when the header is wrong', () => {
    const next = jest.fn();
    requireInternalSecret(makeReq('guessed-secret'), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with 401 when the header is a different length than the secret', () => {
    const next = jest.fn();
    requireInternalSecret(makeReq('short'), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('requireInternalSecret with no secret configured', () => {
  it('always rejects, even an empty header, rather than matching on falsy === falsy', () => {
    jest.resetModules();
    jest.doMock('../../config/env', () => ({ internalRefreshSecret: '' }));
    const { requireInternalSecret: requireInternalSecretUnconfigured } = require('../../middleware/internalAuthMiddleware');

    const next = jest.fn();
    requireInternalSecretUnconfigured(makeReq(''), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
