const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const decoded = verifyToken(token);
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
