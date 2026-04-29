const { getNBAStandings, getNBALeagueGames } = require('./nbaService');
const { getAFLStandings, getAFLLeagueGames } = require('./aflService');
const { getEPLStandings, getEPLLeagueGames } = require('./footballService');

function getLeagueFetchers(league) {
  if (league === 'NBA') return { standings: getNBAStandings, games: getNBALeagueGames };
  if (league === 'AFL') return { standings: getAFLStandings, games: getAFLLeagueGames };
  if (league === 'EPL') return { standings: getEPLStandings, games: getEPLLeagueGames };
  return null;
}

async function hydrateFollowedLeagues(followedLeagues) {
  return Promise.all(
    (followedLeagues || []).map(async (league) => {
      const fetchers = getLeagueFetchers(league);
      if (!fetchers) return { league, standings: null, recentResults: [], upcomingFixtures: [] };
      try {
        const [standings, games] = await Promise.all([fetchers.standings(), fetchers.games()]);
        return { league, standings, ...games };
      } catch (err) {
        console.error(`League data error for ${league}:`, err.message);
        return { league, standings: null, recentResults: [], upcomingFixtures: [] };
      }
    }),
  );
}

module.exports = { hydrateFollowedLeagues };
