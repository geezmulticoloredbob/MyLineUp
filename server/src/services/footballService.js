const env = require('../config/env');
const fetchWithTimeout = require('../utils/fetchWithTimeout');

const FD_BASE = 'https://api.football-data.org/v4';

function fdFetch(path) {
  return fetchWithTimeout(`${FD_BASE}${path}`, {
    headers: { 'X-Auth-Token': env.footballApiKey },
  });
}

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

// Per-competition short-name overrides where our stored name differs from the API's shortName
const SHORTNAME_OVERRIDES = {
  PL: {
    'Manchester City': 'Man City',
    'Manchester United': 'Man Utd',
    'Newcastle United': 'Newcastle Utd',
    'Tottenham Hotspur': 'Spurs',
    "Nottingham Forest": "Nott'm Forest",
  },
};

// --- Per-competition caches ---
const _teamsCache = new Map();    // code → { data, at }
const _standingsCache = new Map();
const _scorersCache = new Map();
const TEAMS_TTL    = 24 * 60 * 60 * 1000;
const STANDINGS_TTL = 5 * 60 * 1000;
const SCORERS_TTL  = 60 * 60 * 1000;

async function getFDTeams(code) {
  const cached = _teamsCache.get(code);
  if (cached && Date.now() - cached.at < TEAMS_TTL) return cached.data;
  const res = await fdFetch(`/competitions/${code}/teams`);
  if (!res.ok) throw new Error(`football-data.org /${code}/teams failed: ${res.status}`);
  const { teams } = await res.json();
  _teamsCache.set(code, { data: teams || [], at: Date.now() });
  return teams || [];
}

async function getFDStandings(code) {
  const cached = _standingsCache.get(code);
  if (cached && Date.now() - cached.at < STANDINGS_TTL) return cached.data;
  const res = await fdFetch(`/competitions/${code}/standings`);
  if (!res.ok) throw new Error(`football-data.org /${code}/standings failed: ${res.status}`);
  const { standings } = await res.json();
  const table = (standings || []).find((s) => s.type === 'TOTAL')?.table || [];
  _standingsCache.set(code, { data: table, at: Date.now() });
  return table;
}

async function getFDScorers(code) {
  const cached = _scorersCache.get(code);
  if (cached && Date.now() - cached.at < SCORERS_TTL) return cached.data;
  const res = await fdFetch(`/competitions/${code}/scorers?limit=50`);
  if (!res.ok) throw new Error(`football-data.org /${code}/scorers failed: ${res.status}`);
  const { scorers } = await res.json();
  _scorersCache.set(code, { data: scorers || [], at: Date.now() });
  return scorers || [];
}

function findFDTeam(allTeams, ourName, code) {
  const overrides = SHORTNAME_OVERRIDES[code] || {};
  const target = (overrides[ourName] || ourName).toLowerCase();
  return allTeams.find(
    (t) =>
      (t.shortName || '').toLowerCase() === target ||
      t.name.toLowerCase().includes(target) ||
      target.includes((t.shortName || '').toLowerCase()),
  );
}

async function getFDTeamData(favourite, code) {
  const [allTeams, standings, allScorers] = await Promise.all([
    getFDTeams(code),
    getFDStandings(code),
    getFDScorers(code).catch(() => []),
  ]);

  const fdTeam = findFDTeam(allTeams, favourite.teamName, code);
  if (!fdTeam) {
    console.warn(`football-data.org ${code}: no match found for "${favourite.teamName}"`);
    return null;
  }

  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - 90); // 90 days covers full off-season gap
  const future = new Date(now);
  future.setDate(future.getDate() + 30);

  const [finishedRes, scheduledRes] = await Promise.all([
    fdFetch(`/teams/${fdTeam.id}/matches?competitions=${code}&status=FINISHED&dateFrom=${toDateStr(past)}&dateTo=${toDateStr(now)}&limit=5`),
    fdFetch(`/teams/${fdTeam.id}/matches?competitions=${code}&status=SCHEDULED&dateFrom=${toDateStr(now)}&dateTo=${toDateStr(future)}&limit=1`),
  ]);

  if (!finishedRes.ok) throw new Error(`football-data.org ${code} team matches failed: ${finishedRes.status}`);
  if (!scheduledRes.ok) throw new Error(`football-data.org ${code} team matches failed: ${scheduledRes.status}`);

  const [{ matches: finished }, { matches: scheduled }] = await Promise.all([
    finishedRes.json(),
    scheduledRes.json(),
  ]);

  let latestResult = null;
  const lastMatch = (finished || []).sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))[0];
  if (lastMatch) {
    const isHome = lastMatch.homeTeam.id === fdTeam.id;
    const myScore = isHome ? lastMatch.score.fullTime.home : lastMatch.score.fullTime.away;
    const oppScore = isHome ? lastMatch.score.fullTime.away : lastMatch.score.fullTime.home;
    const opponent = isHome
      ? lastMatch.awayTeam.shortName || lastMatch.awayTeam.name
      : lastMatch.homeTeam.shortName || lastMatch.homeTeam.name;
    const winner = lastMatch.score.winner;
    const outcome = winner === null ? 'D' : (winner === 'HOME_TEAM') === isHome ? 'W' : 'L';
    latestResult = {
      date: lastMatch.utcDate.split('T')[0],
      outcome,
      opponent,
      score: `${myScore}-${oppScore}`,
    };
  }

  let nextFixture = null;
  const nextMatch = (scheduled || []).sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))[0];
  if (nextMatch) {
    const isHome = nextMatch.homeTeam.id === fdTeam.id;
    const opponent = isHome
      ? nextMatch.awayTeam.shortName || nextMatch.awayTeam.name
      : nextMatch.homeTeam.shortName || nextMatch.homeTeam.name;
    const opponentLogoUrl = isHome ? nextMatch.awayTeam.crest || null : nextMatch.homeTeam.crest || null;
    nextFixture = {
      date: toDateStr(new Date(nextMatch.utcDate)),
      utcDate: nextMatch.utcDate,
      venueTimezone: 'Europe/London',
      opponent,
      opponentLogoUrl,
      venue: isHome ? 'Home' : 'Away',
    };
  }

  const standingRow = (standings || []).find((s) => s.team.id === fdTeam.id);
  const ladderPosition = standingRow?.position ?? null;
  const stats = standingRow
    ? { played: standingRow.playedGames, points: standingRow.points, gd: standingRow.goalDifference }
    : {};

  const topScorers = (allScorers || [])
    .filter((s) => s.team?.id === fdTeam.id)
    .sort((a, b) => (b.goals || 0) - (a.goals || 0))
    .slice(0, 2)
    .map((s) => ({ name: s.player.name, stat: `${s.goals} goals` }));

  const seasonFinished = (finished || []).length > 0 && (scheduled || []).length === 0;

  return { latestResult, nextFixture, ladderPosition, stats, logoUrl: fdTeam.crest || null, topScorers, seasonFinished };
}

async function getFDStandingsForOverview(code) {
  const [allTeams, table] = await Promise.all([getFDTeams(code), getFDStandings(code)]);
  return (table || []).map((s) => {
    const team = allTeams.find((t) => t.id === s.team.id);
    return {
      position: s.position,
      teamName: s.team.shortName || s.team.name,
      logoUrl: team?.crest || null,
      stats: { played: s.playedGames, won: s.won, drawn: s.draw, lost: s.lost, points: s.points, gd: s.goalDifference },
    };
  });
}

async function getFDLeagueGames(code) {
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - 10);
  const future = new Date(now);
  future.setDate(future.getDate() + 14);

  const [finishedRes, scheduledRes] = await Promise.all([
    fdFetch(`/competitions/${code}/matches?status=FINISHED&dateFrom=${toDateStr(past)}&dateTo=${toDateStr(now)}`),
    fdFetch(`/competitions/${code}/matches?status=SCHEDULED&dateFrom=${toDateStr(now)}&dateTo=${toDateStr(future)}`),
  ]);

  if (!finishedRes.ok) throw new Error(`football-data.org ${code} league matches failed: ${finishedRes.status}`);
  if (!scheduledRes.ok) throw new Error(`football-data.org ${code} league matches failed: ${scheduledRes.status}`);

  const [{ matches: finished }, { matches: scheduled }] = await Promise.all([
    finishedRes.json(),
    scheduledRes.json(),
  ]);

  const recentResults = (finished || [])
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    .slice(0, 5)
    .map((m) => ({
      homeTeam: m.homeTeam.shortName || m.homeTeam.name,
      awayTeam: m.awayTeam.shortName || m.awayTeam.name,
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
      date: m.utcDate.split('T')[0],
    }));

  const upcomingFixtures = (scheduled || [])
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .slice(0, 5)
    .map((m) => ({
      homeTeam: m.homeTeam.shortName || m.homeTeam.name,
      awayTeam: m.awayTeam.shortName || m.awayTeam.name,
      date: m.utcDate.split('T')[0],
      time: new Date(m.utcDate).toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Australia/Sydney',
      }),
    }));

  return { recentResults, upcomingFixtures };
}

module.exports = { getFDTeamData, getFDStandingsForOverview, getFDLeagueGames };
