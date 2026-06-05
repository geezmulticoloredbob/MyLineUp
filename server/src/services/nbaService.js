const env = require('../config/env');
const fetchWithTimeout = require('../utils/fetchWithTimeout');

const BDL_BASE = 'https://api.balldontlie.io/v1';

// BallDontLie abbreviations differ from ESPN for a few teams
const ESPN_ABBR_OVERRIDE = { GSW: 'gs', NOP: 'no', NYK: 'ny', SAS: 'sa', UTA: 'utah', WAS: 'wsh' };

const NBA_HOME_TIMEZONES = {
  'Boston Celtics': 'America/New_York',
  'Brooklyn Nets': 'America/New_York',
  'New York Knicks': 'America/New_York',
  'Philadelphia 76ers': 'America/New_York',
  'Toronto Raptors': 'America/Toronto',
  'Chicago Bulls': 'America/Chicago',
  'Cleveland Cavaliers': 'America/New_York',
  'Detroit Pistons': 'America/Detroit',
  'Indiana Pacers': 'America/Indiana/Indianapolis',
  'Milwaukee Bucks': 'America/Chicago',
  'Atlanta Hawks': 'America/New_York',
  'Charlotte Hornets': 'America/New_York',
  'Miami Heat': 'America/New_York',
  'Orlando Magic': 'America/New_York',
  'Washington Wizards': 'America/New_York',
  'Denver Nuggets': 'America/Denver',
  'Minnesota Timberwolves': 'America/Chicago',
  'Oklahoma City Thunder': 'America/Chicago',
  'Portland Trail Blazers': 'America/Los_Angeles',
  'Utah Jazz': 'America/Denver',
  'Golden State Warriors': 'America/Los_Angeles',
  'Los Angeles Clippers': 'America/Los_Angeles',
  'Los Angeles Lakers': 'America/Los_Angeles',
  'Phoenix Suns': 'America/Phoenix',
  'Sacramento Kings': 'America/Los_Angeles',
  'Dallas Mavericks': 'America/Chicago',
  'Houston Rockets': 'America/Chicago',
  'Memphis Grizzlies': 'America/Chicago',
  'New Orleans Pelicans': 'America/Chicago',
  'San Antonio Spurs': 'America/Chicago',
};

// Parse "7:00 pm ET" + BDL date string into a UTC ISO string
function parseNBAGameTime(dateStr, statusStr) {
  if (!statusStr || statusStr === 'Final') return null;
  const match = statusStr.match(/(\d+):(\d+)\s*(am|pm)\s*ET/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3].toLowerCase();
  if (ampm === 'pm' && hours !== 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;
  const dateOnly = dateStr.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  // EDT (UTC-4): Mar-Nov; EST (UTC-5): Dec-Feb
  const etOffset = month >= 3 && month <= 11 ? 4 : 5;
  return new Date(Date.UTC(year, month - 1, day, hours + etOffset, minutes)).toISOString();
}

function getNBALogoUrl(abbreviation) {
  const espnAbbr = ESPN_ABBR_OVERRIDE[abbreviation] || abbreviation.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`;
}

function bdlFetch(path) {
  return fetchWithTimeout(`${BDL_BASE}${path}`, {
    headers: { Authorization: env.basketballApiKey },
  });
}

let _teamsCache = null;
let _teamsCachedAt = 0;
const TEAMS_TTL_MS = 24 * 60 * 60 * 1000;

async function getBDLTeams() {
  if (_teamsCache && Date.now() - _teamsCachedAt < TEAMS_TTL_MS) return _teamsCache;
  const res = await bdlFetch('/teams?per_page=100');
  if (!res.ok) throw new Error(`BallDontLie teams fetch failed: ${res.status}`);
  const { data } = await res.json();
  _teamsCache = data;
  _teamsCachedAt = Date.now();
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
    getBDLStandings().catch(() => null),
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
    const opponentTeam = isHome ? g.visitor_team : g.home_team;
    const homeTeamName = isHome ? bdlTeam.full_name : g.home_team.full_name;
    nextFixture = {
      date: g.date.split('T')[0],
      time: g.status,
      utcDate: parseNBAGameTime(g.date, g.status),
      venueTimezone: NBA_HOME_TIMEZONES[homeTeamName] || 'America/New_York',
      opponent,
      opponentLogoUrl: getNBALogoUrl(opponentTeam.abbreviation),
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
  const data = await getBDLStandings().catch(() => null);
  return (data || [])
    .sort((a, b) => (a.conference?.rank ?? 99) - (b.conference?.rank ?? 99))
    .map((s) => ({
      position: s.conference?.rank ?? null,
      teamName: s.team.full_name,
      logoUrl: getNBALogoUrl(s.team.abbreviation),
      stats: { wins: s.wins, losses: s.losses },
    }));
}

async function getNBALeagueGames() {
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - 7);
  const future = new Date(now);
  future.setDate(future.getDate() + 7);

  const [pastRes, futureRes] = await Promise.all([
    bdlFetch(`/games?start_date=${toDateStr(past)}&end_date=${toDateStr(now)}&per_page=15`),
    bdlFetch(`/games?start_date=${toDateStr(now)}&end_date=${toDateStr(future)}&per_page=15`),
  ]);
  const [{ data: pastGames }, { data: futureGames }] = await Promise.all([
    pastRes.json(),
    futureRes.json(),
  ]);

  const recentResults = (pastGames || [])
    .filter((g) => g.status === 'Final')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((g) => ({
      homeTeam: g.home_team.full_name,
      awayTeam: g.visitor_team.full_name,
      homeScore: g.home_team_score,
      awayScore: g.visitor_team_score,
      date: g.date.split('T')[0],
    }));

  const upcomingFixtures = (futureGames || [])
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)
    .map((g) => ({
      homeTeam: g.home_team.full_name,
      awayTeam: g.visitor_team.full_name,
      date: g.date.split('T')[0],
      time: typeof g.status === 'string' && g.status !== 'Final' ? g.status : '',
    }));

  return { recentResults, upcomingFixtures };
}

module.exports = { getNBATeamData, getNBAStandings, getNBALeagueGames };
