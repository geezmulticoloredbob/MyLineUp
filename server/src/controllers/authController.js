const bcrypt = require('bcryptjs');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { signToken } = require('../utils/jwt');
const env = require('../config/env');

const VALID_ICON_IDS = ['football', 'basketball', 'rugby', 'trophy', 'star', 'flame', 'crown', 'shield', 'dart', 'lightning'];

const COOKIE_BASE = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
};

const COOKIE_OPTIONS = {
  ...COOKIE_BASE,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function userShape(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    followedLeagues: user.followedLeagues ?? [],
    onboardingComplete: user.onboardingComplete ?? false,
    iconId: user.iconId ?? 'football',
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
  res.cookie('token', token, COOKIE_OPTIONS);
  res.status(201).json({ user: userShape(user) });
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
  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ user: userShape(user) });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', COOKIE_BASE);
  res.json({ message: 'Logged out' });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ user: userShape(req.user) });
});

const updateIcon = asyncHandler(async (req, res) => {
  const { iconId } = req.body;
  if (!iconId || !VALID_ICON_IDS.includes(iconId)) {
    throw new ApiError(400, 'Invalid icon');
  }
  const user = await User.findByIdAndUpdate(req.user._id, { iconId }, { returnDocument: 'after' });
  res.json({ user: userShape(user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { username, email } = req.body;
  const updates = {};

  if (username !== undefined) {
    if (typeof username !== 'string' || username.trim().length < 2 || username.trim().length > 30) {
      throw new ApiError(400, 'Username must be between 2 and 30 characters');
    }
    updates.username = username.trim();
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new ApiError(400, 'A valid email is required');
    }
    const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
    if (taken) throw new ApiError(409, 'That email is already in use');
    updates.email = email.toLowerCase();
  }

  if (!Object.keys(updates).length) throw new ApiError(400, 'No valid fields provided');

  const user = await User.findByIdAndUpdate(req.user._id, updates, { returnDocument: 'after' });
  res.json({ user: userShape(user) });
});

const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    throw new ApiError(400, 'New password must contain at least one uppercase letter and one number');
  }
  const user = await User.findById(req.user._id);
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new ApiError(401, 'Current password is incorrect');
  const hashed = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(req.user._id, { password: hashed });
  res.json({ message: 'Password updated' });
});

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  updateIcon,
  updateProfile,
  updatePassword,
};
