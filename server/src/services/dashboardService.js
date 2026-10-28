const Favourite = require('../models/Favourite');
const PlayerFavourite = require('../models/PlayerFavourite');
const { hydrateFavouriteTeams, hydrateFavouritePlayers } = require('./sportsDataService');
const { hydrateFollowedLeagues } = require('./leagueService');

async function buildDashboard(user, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [total, rawFavourites, rawPlayerFavourites, leagueOverviews] = await Promise.all([
    Favourite.countDocuments({ user: user._id }),
    Favourite.find({ user: user._id }).sort({ league: 1, teamName: 1 }).skip(skip).limit(limit),
    PlayerFavourite.find({ user: user._id }).sort({ league: 1, playerName: 1 }),
    hydrateFollowedLeagues(user.followedLeagues),
  ]);

  const [teams, players] = await Promise.all([
    hydrateFavouriteTeams(rawFavourites),
    hydrateFavouritePlayers(rawPlayerFavourites),
  ]);

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
    playerCount: rawPlayerFavourites.length,
    players,
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
