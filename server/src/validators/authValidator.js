const ApiError = require('../utils/apiError');

function validateEmail(email) {
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
}

function validateRegisterPayload(req, res, next) {
  const { username, email, password } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    return next(new ApiError(400, 'username must be at least 2 characters long'));
  }

  if (!validateEmail(email)) {
    return next(new ApiError(400, 'A valid email is required'));
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return next(new ApiError(400, 'password must be at least 8 characters long'));
  }

  next();
}

function validateLoginPayload(req, res, next) {
  const { email, password } = req.body;

  if (!validateEmail(email)) {
    return next(new ApiError(400, 'A valid email is required'));
  }

  if (!password || typeof password !== 'string') {
    return next(new ApiError(400, 'password is required'));
  }

  next();
}

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
};
