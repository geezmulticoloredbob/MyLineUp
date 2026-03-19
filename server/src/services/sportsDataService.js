const { getNBATeamData } = require('./nbaService');
const { getAFLTeamData } = require('./aflService');

async function hydrateTeam(favourite) {
  let sportData = null;
  try {
    if (favourite.league === 'NBA') {
      sportData = await getNBATeamData(favourite);
    } else if (favourite.league === 'AFL') {
      sportData = await getAFLTeamData(favourite);
    }
  } catch (err) {
    console.error(`Sports data error for ${favourite.teamName}:`, err.message);
  }

  return {
    favouriteId: favourite._id,
    teamId: favourite.teamId,
    teamName: favourite.teamName,
    teamLogoUrl: favourite.teamLogoUrl,
    league: favourite.league,
    latestResult: sportData?.latestResult ?? null,
    nextFixture: sportData?.nextFixture ?? null,
    ladderPosition: sportData?.ladderPosition ?? null,
    stats: sportData?.stats ?? {},
    source: sportData ? 'live' : 'unavailable',
  };
}

async function hydrateFavouriteTeams(favourites) {
  return Promise.all(favourites.map(hydrateTeam));
}

module.exports = { hydrateFavouriteTeams };
