const { getNBATeamData } = require('./nbaService');
const { getAFLTeamData } = require('./aflService');
const { getFDTeamData } = require('./footballService');
const { getWCTeamData } = require('./worldCupService');

// competition code for each football-data.org league
const FD_COMPETITION_CODES = {
  EPL: 'PL',
  LALIGA: 'PD',
  BUNDESLIGA: 'BL1',
  SERIEA: 'SA',
  LIGUE1: 'FL1',
};

const NBA_ESPN_OVERRIDES = { gsw: 'gs', nop: 'no', nyk: 'ny', sas: 'sa', uta: 'utah', was: 'wsh' };

const EPL_ESPN_IDS = {
  'epl-ars': 359, 'epl-avl': 362, 'epl-bou': 349, 'epl-bre': 337, 'epl-bha': 331,
  'epl-che': 363, 'epl-cry': 384, 'epl-eve': 368, 'epl-ful': 370, 'epl-ips': 373,
  'epl-lei': 375, 'epl-liv': 364, 'epl-mci': 382, 'epl-mun': 360, 'epl-new': 361,
  'epl-nfo': 393, 'epl-sou': 376, 'epl-tot': 367, 'epl-whu': 371, 'epl-wol': 380,
};

function espnLogoFromTeamId(teamId) {
  if (teamId.startsWith('nba-')) {
    const abbr = teamId.replace('nba-', '');
    return `https://a.espncdn.com/i/teamlogos/nba/500/${NBA_ESPN_OVERRIDES[abbr] || abbr}.png`;
  }
  if (teamId.startsWith('afl-')) {
    const abbr = teamId.replace('afl-', '');
    return `https://a.espncdn.com/i/teamlogos/afl/500/${abbr}.png`;
  }
  if (teamId.startsWith('epl-')) {
    const id = EPL_ESPN_IDS[teamId];
    return id ? `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png` : null;
  }
  if (teamId.startsWith('wc-')) {
    const code = teamId.replace('wc-', '');
    return `https://a.espncdn.com/i/teamlogos/countries/500/${code}.png`;
  }
  return null;
}

async function hydrateTeam(favourite) {
  let sportData = null;
  try {
    const fdCode = FD_COMPETITION_CODES[favourite.league];
    if (favourite.league === 'NBA') {
      sportData = await getNBATeamData(favourite);
    } else if (favourite.league === 'AFL') {
      sportData = await getAFLTeamData(favourite);
    } else if (favourite.league === 'WC') {
      sportData = await getWCTeamData(favourite);
    } else if (fdCode) {
      sportData = await getFDTeamData(favourite, fdCode);
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
    topScorers: sportData?.topScorers ?? [],
    dataAvailable: sportData !== null,
    source: sportData ? 'live' : 'unavailable',
    seasonFinished: sportData?.seasonFinished ?? false,
  };
}

async function hydrateFavouriteTeams(favourites) {
  return Promise.all(favourites.map(hydrateTeam));
}

module.exports = { hydrateFavouriteTeams };
