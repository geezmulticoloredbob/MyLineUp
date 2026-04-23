const { getNBATeamData } = require('./nbaService');
const { getAFLTeamData } = require('./aflService');
const { getEPLTeamData } = require('./footballService');

async function hydrateTeam(favourite) {
  let sportData = null;
  try {
    if (favourite.league === 'NBA') {
      sportData = await getNBATeamData(favourite);
    } else if (favourite.league === 'AFL') {
      sportData = await getAFLTeamData(favourite);
    } else if (favourite.league === 'EPL') {
      sportData = await getEPLTeamData(favourite);
    }
  } catch (err) {
    console.error(`Sports data error for ${favourite.teamName}:`, err.message);
  }

  return {
    favouriteId: favourite._id,
    teamId: favourite.teamId,
    teamName: favourite.teamName,
    teamLogoUrl: sportData?.logoUrl || favourite.teamLogoUrl || null,
    league: favourite.league,
    latestResult: sportData?.latestResult ?? null,
    nextFixture: sportData?.nextFixture ?? null,
    ladderPosition: sportData?.ladderPosition ?? null,
    stats: sportData?.stats ?? {},
    isLive: sportData !== null,
    source: sportData ? 'live' : 'unavailable',
  };
}

async function hydrateFavouriteTeams(favourites) {
  return Promise.all(favourites.map(hydrateTeam));
}

module.exports = { hydrateFavouriteTeams };
