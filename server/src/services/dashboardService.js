const Favourite = require('../models/Favourite');
const { hydrateFavouriteTeams } = require('./sportsDataService');
const { hydrateFollowedLeagues } = require('./leagueService');

async function buildDashboard(user, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [total, rawFavourites, leagueOverviews] = await Promise.all([
    Favourite.countDocuments({ user: user._id }),
    Favourite.find({ user: user._id }).sort({ league: 1, teamName: 1 }).skip(skip).limit(limit),
    hydrateFollowedLeagues(user.followedLeagues),
  ]);

  const teams = await hydrateFavouriteTeams(rawFavourites);

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      followedLeagues: user.followedLeagues,
      onboardingComplete: user.onboardingComplete,
    },
    teamCount: total,
    teams,
    leagueOverviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  buildDashboard,
};
