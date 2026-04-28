const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const VALID_LEAGUES = ['NBA', 'EPL', 'AFL'];

const getFollowedLeagues = asyncHandler(async (req, res) => {
  res.json({ followedLeagues: req.user.followedLeagues });
});

const updateFollowedLeagues = asyncHandler(async (req, res) => {
  const { leagues } = req.body;
  if (!Array.isArray(leagues) || leagues.some((l) => !VALID_LEAGUES.includes(l))) {
    throw new ApiError(400, 'leagues must be an array of valid league codes (NBA, EPL, AFL)');
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { followedLeagues: leagues },
    { new: true },
  );
  res.json({ followedLeagues: user.followedLeagues });
});

const completeOnboarding = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { onboardingComplete: true });
  res.json({ onboardingComplete: true });
});

module.exports = { getFollowedLeagues, updateFollowedLeagues, completeOnboarding };
