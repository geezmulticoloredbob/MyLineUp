const ApiError = require('../../utils/apiError');

describe('ApiError', () => {
  it('stores statusCode and message', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
  });

  it('is an instance of Error', () => {
    expect(new ApiError(500, 'boom')).toBeInstanceOf(Error);
  });

  it('sets name to ApiError', () => {
    expect(new ApiError(400, 'bad')).toHaveProperty('name', 'ApiError');
  });

  it('works with any valid HTTP status code', () => {
    expect(new ApiError(422, 'Unprocessable').statusCode).toBe(422);
    expect(new ApiError(409, 'Conflict').statusCode).toBe(409);
  });
});
