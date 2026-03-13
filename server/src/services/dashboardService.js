const Favourite = require('../models/Favourite');
const { hydrateFavouriteTeams } = require('./sportsDataService');

async function buildDashboard(user) {
  const favourites = await Favourite.find({ user: user._id }).sort({
    league: 1,
    teamName: 1,
  });
  const teams = await hydrateFavouriteTeams(favourites);

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    teamCount: teams.length,
    teams,
  };
}

module.exports = {
  buildDashboard,
};
