const bcrypt = require('bcryptjs');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { signToken } = require('../utils/jwt');

function userShape(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    followedLeagues: user.followedLeagues ?? [],
    onboardingComplete: user.onboardingComplete ?? false,
  };
}

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'An account with that email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  const token = signToken({ userId: user._id.toString() });
  res.status(201).json({ token, user: userShape(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken({ userId: user._id.toString() });
  res.json({ token, user: userShape(user) });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ user: userShape(req.user) });
});

module.exports = {
  register,
  login,
  getCurrentUser,
};
