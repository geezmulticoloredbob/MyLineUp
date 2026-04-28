const env = require('../config/env');

const BDL_BASE = 'https://api.balldontlie.io/v1';

// BallDontLie abbreviations differ from ESPN for a few teams
const ESPN_ABBR_OVERRIDE = { GSW: 'gs', NOP: 'no', NYK: 'ny', SAS: 'sa', UTA: 'utah', WAS: 'wsh' };

function getNBALogoUrl(abbreviation) {
  const espnAbbr = ESPN_ABBR_OVERRIDE[abbreviation] || abbreviation.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`;
}

function bdlFetch(path) {
  return fetch(`${BDL_BASE}${path}`, {
    headers: { Authorization: env.basketballApiKey },
  });
}

let _teamsCache = null;

async function getBDLTeams() {
  if (_teamsCache) return _teamsCache;
  const res = await bdlFetch('/teams?per_page=100');
  if (!res.ok) throw new Error(`BallDontLie teams fetch failed: ${res.status}`);
  const { data } = await res.json();
  _teamsCache = data;
  return data;
}

let _standingsCache = null;
let _standingsCachedAt = 0;
const STANDINGS_TTL_MS = 5 * 60 * 1000;

async function getBDLStandings() {
  if (_standingsCache && Date.now() - _standingsCachedAt < STANDINGS_TTL_MS) {
    return _standingsCache;
  }
  const season = new Date().getFullYear() - (new Date().getMonth() < 9 ? 1 : 0);
  const res = await bdlFetch(`/standings?season=${season}`);
  if (!res.ok) throw new Error(`BallDontLie standings fetch failed: ${res.status}`);
  const { data } = await res.json();
  _standingsCache = data;
  _standingsCachedAt = Date.now();
  return data;
}

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

async function getNBATeamData(favourite) {
  const abbr = favourite.teamId.replace('nba-', '').toUpperCase();
  const teams = await getBDLTeams();
  const bdlTeam = teams.find((t) => t.abbreviation === abbr);
  if (!bdlTeam) return null;

  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - 14);
  const future = new Date(now);
  future.setDate(future.getDate() + 14);

  const [pastRes, futureRes, allStandings] = await Promise.all([
    bdlFetch(`/games?team_ids[]=${bdlTeam.id}&start_date=${toDateStr(past)}&end_date=${toDateStr(now)}&per_page=10`),
    bdlFetch(`/games?team_ids[]=${bdlTeam.id}&start_date=${toDateStr(now)}&end_date=${toDateStr(future)}&per_page=5`),
    getBDLStandings(),
  ]);

  const [{ data: pastGames }, { data: futureGames }] = await Promise.all([
    pastRes.json(),
    futureRes.json(),
  ]);

  const finished = (pastGames || [])
    .filter((g) => g.status === 'Final')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let latestResult = null;
  if (finished[0]) {
    const g = finished[0];
    const isHome = g.home_team.id === bdlTeam.id;
    const myScore = isHome ? g.home_team_score : g.visitor_team_score;
    const oppScore = isHome ? g.visitor_team_score : g.home_team_score;
    const opponent = isHome ? g.visitor_team.full_name : g.home_team.full_name;
    latestResult = {
      date: g.date.split('T')[0],
      outcome: myScore > oppScore ? 'W' : 'L',
      opponent,
      score: `${myScore}-${oppScore}`,
    };
  }

  let nextFixture = null;
  const upcoming = (futureGames || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (upcoming[0]) {
    const g = upcoming[0];
    const isHome = g.home_team.id === bdlTeam.id;
    const opponent = isHome ? g.visitor_team.full_name : g.home_team.full_name;
    nextFixture = {
      date: g.date.split('T')[0],
      time: g.status,
      opponent,
      venue: isHome ? 'Home' : 'Away',
    };
  }

  const standing = (allStandings || []).find((s) => s.team.id === bdlTeam.id);
  const ladderPosition = standing?.conference?.rank ?? null;
  const stats = standing
    ? { wins: standing.wins, losses: standing.losses }
    : {};

  return {
    latestResult,
    nextFixture,
    ladderPosition,
    stats,
    logoUrl: getNBALogoUrl(bdlTeam.abbreviation),
  };
}

async function getNBAStandings() {
  const data = await getBDLStandings();
  return (data || [])
    .sort((a, b) => (a.conference?.rank ?? 99) - (b.conference?.rank ?? 99))
    .map((s) => ({
      position: s.conference?.rank ?? null,
      teamName: s.team.full_name,
      logoUrl: getNBALogoUrl(s.team.abbreviation),
      stats: { wins: s.wins, losses: s.losses },
    }));
}

module.exports = { getNBATeamData, getNBAStandings };
