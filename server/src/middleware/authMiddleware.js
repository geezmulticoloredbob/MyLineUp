const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    throw new ApiError(401, 'User not found for token');
  }

  req.user = user;
  next();
});

module.exports = {
  requireAuth,
};
