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

let _wcTeamsCache = null;
let _wcTeamsCachedAt = 0;
const TEAMS_TTL_MS = 24 * 60 * 60 * 1000;

async function getWCTeams() {
  if (_wcTeamsCache && Date.now() - _wcTeamsCachedAt < TEAMS_TTL_MS) return _wcTeamsCache;
  const res = await fdFetch('/competitions/WC/teams');
  if (!res.ok) throw new Error(`football-data.org WC /teams failed: ${res.status}`);
  const { teams } = await res.json();
  _wcTeamsCache = teams || [];
  _wcTeamsCachedAt = Date.now();
  return _wcTeamsCache;
}

let _wcStandingsCache = null;
let _wcStandingsCachedAt = 0;
const STANDINGS_TTL_MS = 5 * 60 * 1000;

async function fetchWCStandings() {
  if (_wcStandingsCache && Date.now() - _wcStandingsCachedAt < STANDINGS_TTL_MS) return _wcStandingsCache;
  const res = await fdFetch('/competitions/WC/standings');
  if (!res.ok) return null;
  const { standings } = await res.json();
  _wcStandingsCache = standings || null;
  _wcStandingsCachedAt = Date.now();
  return _wcStandingsCache;
}

function findWCTeam(allTeams, ourName) {
  const target = ourName.toLowerCase();
  return allTeams.find(
    (t) =>
      t.name.toLowerCase() === target ||
      (t.shortName || '').toLowerCase() === target ||
      t.name.toLowerCase().includes(target) ||
      target.includes((t.shortName || '').toLowerCase()),
  );
}

async function getWCTeamData(favourite) {
  const [allTeams, standings] = await Promise.all([
    getWCTeams(),
    fetchWCStandings().catch(() => null),
  ]);

  const fdTeam = findWCTeam(allTeams, favourite.teamName);
  if (!fdTeam) {
    console.warn(`football-data.org WC: no match found for "${favourite.teamName}"`);
    return null;
  }

  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - 60);
  const future = new Date(now);
  future.setDate(future.getDate() + 30);

  const [finishedRes, scheduledRes] = await Promise.all([
    fdFetch(`/teams/${fdTeam.id}/matches?competitions=WC&status=FINISHED&dateFrom=${toDateStr(past)}&dateTo=${toDateStr(now)}&limit=5`),
    fdFetch(`/teams/${fdTeam.id}/matches?competitions=WC&status=SCHEDULED&dateFrom=${toDateStr(now)}&dateTo=${toDateStr(future)}&limit=1`),
  ]);

  if (!finishedRes.ok) throw new Error(`WC team matches failed: ${finishedRes.status}`);
  if (!scheduledRes.ok) throw new Error(`WC team matches failed: ${scheduledRes.status}`);

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
    const opponentLogoUrl = isHome
      ? nextMatch.awayTeam.crest || null
      : nextMatch.homeTeam.crest || null;
    nextFixture = {
      date: toDateStr(new Date(nextMatch.utcDate)),
      utcDate: nextMatch.utcDate,
      venueTimezone: 'America/New_York', // WC 2026 hosted in USA/Canada/Mexico
      opponent,
      opponentLogoUrl,
      venue: isHome ? 'Home' : 'Away',
    };
  }

  // Find group standing
  let ladderPosition = null;
  let stats = {};
  if (standings) {
    for (const group of standings) {
      const row = (group.table || []).find((r) => r.team.id === fdTeam.id);
      if (row) {
        ladderPosition = row.position;
        stats = { played: row.playedGames, points: row.points, gd: row.goalDifference };
        break;
      }
    }
  }

  const hasPlayed = (finished || []).length > 0;
  const seasonFinished = hasPlayed && (scheduled || []).length === 0;

  return {
    latestResult,
    nextFixture,
    ladderPosition,
    stats,
    logoUrl: fdTeam.crest || null,
    topScorers: [],
    seasonFinished,
  };
}

async function getWCStandings() {
  const [allTeams, standings] = await Promise.all([
    getWCTeams(),
    fetchWCStandings().catch(() => null),
  ]);

  if (!standings) return null;

  // Flatten all groups, sort by points then GD, return top entries
  const allRows = standings.flatMap((group) =>
    (group.table || []).map((row) => ({
      position: row.position,
      teamName: row.team.name,
      logoUrl: allTeams.find((t) => t.id === row.team.id)?.crest || null,
      stats: {
        played: row.playedGames,
        points: row.points,
        gd: row.goalDifference,
      },
    })),
  );

  return allRows.sort((a, b) => (b.stats.points - a.stats.points) || (b.stats.gd - a.stats.gd));
}

async function getWCLeagueGames() {
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - 3);
  const future = new Date(now);
  future.setDate(future.getDate() + 7);

  const [finishedRes, scheduledRes] = await Promise.all([
    fdFetch(`/competitions/WC/matches?status=FINISHED&dateFrom=${toDateStr(past)}&dateTo=${toDateStr(now)}`),
    fdFetch(`/competitions/WC/matches?status=SCHEDULED&dateFrom=${toDateStr(now)}&dateTo=${toDateStr(future)}`),
  ]);

  if (!finishedRes.ok) throw new Error(`WC league games fetch failed: ${finishedRes.status}`);
  if (!scheduledRes.ok) throw new Error(`WC league games fetch failed: ${scheduledRes.status}`);

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

module.exports = { getWCTeamData, getWCStandings, getWCLeagueGames };
