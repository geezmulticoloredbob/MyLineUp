const asyncHandler = require('../../utils/asyncHandler');

describe('asyncHandler', () => {
  it('calls the handler with req, res, and next', async () => {
    const handler = jest.fn().mockResolvedValue();
    const wrapped = asyncHandler(handler);
    const req = {};
    const res = {};
    const next = jest.fn();

    await wrapped(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes thrown errors to next', async () => {
    const error = new Error('something went wrong');
    const wrapped = asyncHandler(() => Promise.reject(error));
    const next = jest.fn();

    await wrapped({}, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('passes synchronous errors thrown inside async to next', async () => {
    const error = new Error('sync inside async');
    const wrapped = asyncHandler(async () => { throw error; });
    const next = jest.fn();

    await wrapped({}, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
