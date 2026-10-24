const env = require('../config/env');
const fetchWithTimeout = require('../utils/fetchWithTimeout');
const { throttle } = require('../utils/requestThrottle');

const FD_BASE = 'https://api.football-data.org/v4';
// Same football-data.org account/key as footballService.js — shares the
// 'football-data' bucket so combined call volume from both stays under the
// single global 10 req/min limit, not 10/min each.
const FD_MIN_SPACING_MS = 6500;

function fdFetch(path) {
  return throttle('football-data', FD_MIN_SPACING_MS, () =>
    fetchWithTimeout(`${FD_BASE}${path}`, {
      headers: { 'X-Auth-Token': env.footballApiKey },
    })
  );
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
// Bumped from 5min to 15min — same reasoning as footballService.js's
// identical TTLs, which share this same throttled 'football-data' bucket.
const STANDINGS_TTL_MS = 15 * 60 * 1000;

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

const _wcTeamMatchesCache = new Map();
const _wcTeamMatchesInFlight = new Map();
const TEAM_MATCHES_TTL_MS = 15 * 60 * 1000; // bumped from 5min, same reasoning as footballService.js

async function getWCTeamMatches(teamId) {
  const cached = _wcTeamMatchesCache.get(teamId);
  if (cached && Date.now() - cached.at < TEAM_MATCHES_TTL_MS) return cached.data;
  if (_wcTeamMatchesInFlight.has(teamId)) return _wcTeamMatchesInFlight.get(teamId);

  const promise = (async () => {
    const now = new Date();
    const past = new Date(now);
    past.setDate(past.getDate() - 60);
    const future = new Date(now);
    future.setDate(future.getDate() + 30);

    // One combined call spanning the full past+future window, instead of two
    // separately-throttled FINISHED/SCHEDULED calls — same fix as
    // footballService.js's identical pattern; omitting `status` entirely
    // returns both finished and upcoming matches in one response. Halves
    // the throttled-call count per team on the same shared 'football-data'
    // bucket footballService.js uses.
    const res = await fdFetch(`/teams/${teamId}/matches?competitions=WC&dateFrom=${toDateStr(past)}&dateTo=${toDateStr(future)}`);
    if (!res.ok) throw new Error(`WC team matches failed: ${res.status}`);
    const { matches } = await res.json();
    const finished = (matches || []).filter((m) => m.status === 'FINISHED');
    const scheduled = (matches || []).filter((m) => m.status !== 'FINISHED' && new Date(m.utcDate) >= now);
    return { finished, scheduled };
  })()
    .then((data) => {
      _wcTeamMatchesCache.set(teamId, { data, at: Date.now() });
      _wcTeamMatchesInFlight.delete(teamId);
      return data;
    })
    .catch((err) => { _wcTeamMatchesInFlight.delete(teamId); throw err; });

  _wcTeamMatchesInFlight.set(teamId, promise);
  return promise;
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

  const { finished, scheduled } = await getWCTeamMatches(fdTeam.id);

  let latestResult = null;
  const lastMatch = (finished || []).sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))[0];
  if (lastMatch) {
    const isHome = lastMatch.homeTeam.id === fdTeam.id;
    const myScore = isHome ? lastMatch.score.fullTime.home : lastMatch.score.fullTime.away;
    const oppScore = isHome ? lastMatch.score.fullTime.away : lastMatch.score.fullTime.home;
    const opponent = isHome
      ? lastMatch.awayTeam.shortName || lastMatch.awayTeam.name
      : lastMatch.homeTeam.shortName || lastMatch.homeTeam.name;
    // football-data.org's real value for a drawn match is the literal
    // string 'DRAW', not null — see footballService.js's identical fix for
    // the live confirmation (both services read this field the same way).
    // `null` is kept as a second, defensive check.
    const winner = lastMatch.score.winner;
    const outcome = (winner === 'DRAW' || winner === null) ? 'D' : (winner === 'HOME_TEAM') === isHome ? 'W' : 'L';
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

let _wcLeagueMatchesCache = null;
let _wcLeagueMatchesCachedAt = 0;
let _wcLeagueMatchesInFlight = null;
const LEAGUE_MATCHES_TTL_MS = 15 * 60 * 1000; // bumped from 5min, same reasoning as footballService.js

async function getWCLeagueMatches() {
  if (_wcLeagueMatchesCache && Date.now() - _wcLeagueMatchesCachedAt < LEAGUE_MATCHES_TTL_MS) return _wcLeagueMatchesCache;
  if (_wcLeagueMatchesInFlight) return _wcLeagueMatchesInFlight;

  _wcLeagueMatchesInFlight = (async () => {
    const now = new Date();
    const past = new Date(now);
    past.setDate(past.getDate() - 3);
    const future = new Date(now);
    future.setDate(future.getDate() + 7);

    // Combined call, same fix as getWCTeamMatches above — one request
    // spanning the full window instead of two separately-throttled ones.
    const res = await fdFetch(`/competitions/WC/matches?dateFrom=${toDateStr(past)}&dateTo=${toDateStr(future)}`);
    if (!res.ok) throw new Error(`WC league games fetch failed: ${res.status}`);
    const { matches } = await res.json();
    const finished = (matches || []).filter((m) => m.status === 'FINISHED');
    const scheduled = (matches || []).filter((m) => m.status !== 'FINISHED' && new Date(m.utcDate) >= now);
    return { finished, scheduled };
  })()
    .then((data) => {
      _wcLeagueMatchesCache = data;
      _wcLeagueMatchesCachedAt = Date.now();
      _wcLeagueMatchesInFlight = null;
      return data;
    })
    .catch((err) => { _wcLeagueMatchesInFlight = null; throw err; });

  return _wcLeagueMatchesInFlight;
}

async function getWCLeagueGames() {
  const { finished, scheduled } = await getWCLeagueMatches();

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
