const { getNBAStandings, getNBALeagueGames } = require('./nbaService');
const { getFDStandingsForOverview, getFDLeagueGames } = require('./footballService');
const { getWCStandings, getWCLeagueGames } = require('./worldCupService');
const { getESPNStandingsOverview, getESPNLeagueGames } = require('./espnTeamSportService');
const { getCricketStandingsOverview, getCricketLeagueGames } = require('./cricketService');

const LEAGUE_FETCHERS = {
  NBA:        { standings: getNBAStandings,                            games: getNBALeagueGames },
  AFL:        { standings: () => getESPNStandingsOverview('AFL'),       games: () => getESPNLeagueGames('AFL') },
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
  NRL:        { standings: () => getESPNStandingsOverview('NRL'),       games: () => getESPNLeagueGames('NRL') },
  WNBA:       { standings: () => getESPNStandingsOverview('WNBA'),      games: () => getESPNLeagueGames('WNBA') },
  NWSL:       { standings: () => getESPNStandingsOverview('NWSL'),      games: () => getESPNLeagueGames('NWSL') },
  ALEAGUE:    { standings: () => getESPNStandingsOverview('ALEAGUE'),   games: () => getESPNLeagueGames('ALEAGUE') },
  LIGAMX:     { standings: () => getESPNStandingsOverview('LIGAMX'),    games: () => getESPNLeagueGames('LIGAMX') },
  BRASILEIRAO: { standings: () => getESPNStandingsOverview('BRASILEIRAO'), games: () => getESPNLeagueGames('BRASILEIRAO') },
  ARGENTINA:  { standings: () => getESPNStandingsOverview('ARGENTINA'),  games: () => getESPNLeagueGames('ARGENTINA') },
  SAUDIPL:    { standings: () => getESPNStandingsOverview('SAUDIPL'),    games: () => getESPNLeagueGames('SAUDIPL') },
  PRIMEIRALIGA: { standings: () => getESPNStandingsOverview('PRIMEIRALIGA'), games: () => getESPNLeagueGames('PRIMEIRALIGA') },
  TURKEY:     { standings: () => getESPNStandingsOverview('TURKEY'),      games: () => getESPNLeagueGames('TURKEY') },
  SCOTLAND:   { standings: () => getESPNStandingsOverview('SCOTLAND'),    games: () => getESPNLeagueGames('SCOTLAND') },
  JLEAGUE:    { standings: () => getESPNStandingsOverview('JLEAGUE'),     games: () => getESPNLeagueGames('JLEAGUE') },
  IPL:        { standings: () => getCricketStandingsOverview('IPL'),      games: () => getCricketLeagueGames('IPL') },
  BBL:        { standings: () => getCricketStandingsOverview('BBL'),      games: () => getCricketLeagueGames('BBL') },
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
