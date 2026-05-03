const { getNBATeamData } = require('./nbaService');
const { getAFLTeamData } = require('./aflService');
const { getEPLTeamData } = require('./footballService');

const NBA_ESPN_OVERRIDES = { gsw: 'gs', nop: 'no', nyk: 'ny', sas: 'sa', uta: 'utah', was: 'wsh' };

function espnLogoFromTeamId(teamId) {
  if (teamId.startsWith('nba-')) {
    const abbr = teamId.replace('nba-', '');
    return `https://a.espncdn.com/i/teamlogos/nba/500/${NBA_ESPN_OVERRIDES[abbr] || abbr}.png`;
  }
  if (teamId.startsWith('afl-')) {
    const abbr = teamId.replace('afl-', '');
    return `https://a.espncdn.com/i/teamlogos/afl/500/${abbr}.png`;
  }
  return null;
}

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
    teamLogoUrl: sportData?.logoUrl || favourite.teamLogoUrl || espnLogoFromTeamId(favourite.teamId),
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
