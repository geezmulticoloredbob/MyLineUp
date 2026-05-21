const ApiError = require('../utils/apiError');

function notFoundMiddleware(req, res, next) {
  next(new ApiError(404, 'Not found'));
}

module.exports = notFoundMiddleware;
