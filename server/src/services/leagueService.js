const { getNBAStandings, getNBALeagueGames } = require('./nbaService');
const { getAFLStandings, getAFLLeagueGames } = require('./aflService');
const { getFDStandingsForOverview, getFDLeagueGames } = require('./footballService');
const { getWCStandings, getWCLeagueGames } = require('./worldCupService');
const { getESPNStandingsOverview, getESPNLeagueGames } = require('./espnTeamSportService');

const LEAGUE_FETCHERS = {
  NBA:        { standings: getNBAStandings,                            games: getNBALeagueGames },
  AFL:        { standings: getAFLStandings,                            games: getAFLLeagueGames },
  EPL:        { standings: () => getFDStandingsForOverview('PL'),      games: () => getFDLeagueGames('PL') },
  LALIGA:     { standings: () => getFDStandingsForOverview('PD'),      games: () => getFDLeagueGames('PD') },
  BUNDESLIGA: { standings: () => getFDStandingsForOverview('BL1'),     games: () => getFDLeagueGames('BL1') },
  SERIEA:     { standings: () => getFDStandingsForOverview('SA'),      games: () => getFDLeagueGames('SA') },
  LIGUE1:     { standings: () => getFDStandingsForOverview('FL1'),     games: () => getFDLeagueGames('FL1') },
  CHAMPIONSHIP: { standings: () => getFDStandingsForOverview('ELC'),   games: () => getFDLeagueGames('ELC') },
  EREDIVISIE: { standings: () => getFDStandingsForOverview('DED'),     games: () => getFDLeagueGames('DED') },
  UCL:        { standings: () => getFDStandingsForOverview('CL'),      games: () => getFDLeagueGames('CL') },
  WC:         { standings: getWCStandings,                             games: getWCLeagueGames },
  NFL:        { standings: () => getESPNStandingsOverview('NFL'),       games: () => getESPNLeagueGames('NFL') },
  NHL:        { standings: () => getESPNStandingsOverview('NHL'),       games: () => getESPNLeagueGames('NHL') },
  MLB:        { standings: () => getESPNStandingsOverview('MLB'),       games: () => getESPNLeagueGames('MLB') },
};

async function hydrateFollowedLeagues(followedLeagues) {
  return Promise.all(
    (followedLeagues || []).map(async (league) => {
      const fetchers = LEAGUE_FETCHERS[league];
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
