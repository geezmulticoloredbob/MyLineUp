const errorHandler = require('../../middleware/errorHandler');
const ApiError = require('../../utils/apiError');

function makeRes() {
  const res = { headersSent: false };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => { process.env.NODE_ENV = originalEnv; });

  it('uses the error statusCode when present', () => {
    const res = makeRes();
    errorHandler(new ApiError(422, 'Unprocessable'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unprocessable' }));
  });

  it('defaults to 500 for generic errors with no statusCode', () => {
    const res = makeRes();
    errorHandler(new Error('generic failure'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('includes a stack trace in development', () => {
    process.env.NODE_ENV = 'development';
    const res = makeRes();
    errorHandler(new Error('dev error'), {}, res, jest.fn());
    const [body] = res.json.mock.calls[0];
    expect(body).toHaveProperty('stack');
  });

  it('omits the stack trace in production', () => {
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    errorHandler(new Error('prod error'), {}, res, jest.fn());
    const [body] = res.json.mock.calls[0];
    expect(body).not.toHaveProperty('stack');
  });

  it('delegates to next when headers are already sent', () => {
    const res = { headersSent: true };
    const next = jest.fn();
    const err = new Error('too late');
    errorHandler(err, {}, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
