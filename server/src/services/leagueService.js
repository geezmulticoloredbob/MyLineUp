const { getNBAStandings } = require('./nbaService');
const { getAFLStandings } = require('./aflService');
const { getEPLStandings } = require('./footballService');

async function getLeagueStandings(league) {
  if (league === 'NBA') return getNBAStandings();
  if (league === 'AFL') return getAFLStandings();
  if (league === 'EPL') return getEPLStandings();
  return null;
}

async function hydrateFollowedLeagues(followedLeagues) {
  return Promise.all(
    (followedLeagues || []).map(async (league) => {
      try {
        const standings = await getLeagueStandings(league);
        return { league, standings };
      } catch (err) {
        console.error(`League standings error for ${league}:`, err.message);
        return { league, standings: null };
      }
    }),
  );
}

module.exports = { hydrateFollowedLeagues };
