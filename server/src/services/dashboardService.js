const Favourite = require('../models/Favourite');
const { hydrateFavouriteTeams } = require('./sportsDataService');
const { hydrateFollowedLeagues } = require('./leagueService');

async function buildDashboard(user) {
  const [favourites, leagueOverviews] = await Promise.all([
    Favourite.find({ user: user._id }).sort({ league: 1, teamName: 1 }),
    hydrateFollowedLeagues(user.followedLeagues),
  ]);
  const teams = await hydrateFavouriteTeams(favourites);

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      followedLeagues: user.followedLeagues,
      onboardingComplete: user.onboardingComplete,
    },
    teamCount: teams.length,
    teams,
    leagueOverviews,
  };
}

module.exports = {
  buildDashboard,
};
