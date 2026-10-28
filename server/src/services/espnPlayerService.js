// Player-level data for ESPN-routed leagues, plus NBA (whose team data comes
// from BallDontLie, but whose season_averages endpoint is paid-tier-only on
// the free key this app uses — confirmed live, a 401 even with valid auth.
// ESPN's own athlete endpoints need no key at all and are used here instead,
// for both NBA and every espnTeamSportService.js league. NBA has its own
// entry in that file's ESPN_SPORT_CONFIG for exactly this reason, even
// though its *team* data is never routed through ESPN.
const {
  ESPN_SPORT_CONFIG: PLAYER_SPORT_CONFIG,
  getESPNTeams,
  findTeamByAbbr,
  findTeamByName,
  espnFetch,
} = require('./espnTeamSportService');

const fetchWithTimeout = require('../utils/fetchWithTimeout');

const USER_AGENT = 'MyLineUp/1.0 (personal sports dashboard)';
const STATS_BASE = 'https://site.web.api.espn.com/apis/common/v3/sports';

function athleteFetch(sportKey, path) {
  const config = PLAYER_SPORT_CONFIG[sportKey];
  return fetchWithTimeout(`${STATS_BASE}/${config.sport}/${config.league}${path}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
}

// --- Roster (per-team, 24h cache — same TTL as espnTeamSportService.js's
// own team list, since a roster changes about as often as a team list does) ---
const _rosterCache = new Map(); // `${sportKey}-${espnTeamId}` -> { data, at }
const _rosterInFlight = new Map();
const ROSTER_TTL_MS = 24 * 60 * 60 * 1000;

// Resolves a stored team the same way espnTeamSportService.js's own
// getESPNTeamData does (abbreviation first, name fallback) rather than
// duplicating a second, possibly-divergent matching path.
async function resolveESPNTeam(sportKey, { teamId, teamName }) {
  const prefix = `${sportKey.toLowerCase()}-`;
  const abbr = teamId.startsWith(prefix) ? teamId.slice(prefix.length) : teamId;
  const teams = await getESPNTeams(sportKey);
  return findTeamByAbbr(teams, abbr) || findTeamByName(teams, teamName);
}

function flattenRosterAthletes(athletes) {
  // Some leagues (confirmed: NFL) group the roster by position, each group
  // holding its players under `.items`; others (confirmed: NBA, soccer) return
  // a flat array directly. Detect rather than hardcode per league, since more
  // leagues than checked so far may use either shape.
  if (!athletes.length) return [];
  return Array.isArray(athletes[0]?.items) ? athletes.flatMap((group) => group.items || []) : athletes;
}

async function getESPNRoster(sportKey, team) {
  const espnTeam = await resolveESPNTeam(sportKey, team);
  if (!espnTeam) return [];

  const cacheKey = `${sportKey}-${espnTeam.id}`;
  const cached = _rosterCache.get(cacheKey);
  if (cached && Date.now() - cached.at < ROSTER_TTL_MS) return cached.data;
  if (_rosterInFlight.has(cacheKey)) return _rosterInFlight.get(cacheKey);

  const config = PLAYER_SPORT_CONFIG[sportKey];
  const promise = espnFetch(`/${config.sport}/${config.league}/teams/${espnTeam.id}/roster`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`ESPN ${sportKey} roster fetch failed: ${res.status}`);
      const json = await res.json();
      const flat = flattenRosterAthletes(json.athletes || []);
      const players = flat.map((a) => ({
        id: String(a.id),
        name: a.displayName,
        position: a.position?.abbreviation || a.position?.name || '',
        jersey: a.jersey || '',
        headshotUrl: a.headshot?.href || null,
      }));
      _rosterCache.set(cacheKey, { data: players, at: Date.now() });
      _rosterInFlight.delete(cacheKey);
      return players;
    })
    .catch((err) => { _rosterInFlight.delete(cacheKey); throw err; });

  _rosterInFlight.set(cacheKey, promise);
  return promise;
}

// --- Per-player stats (1h cache, matching footballService.js's SCORERS_TTL —
// a player's season stats don't need to be fresher than that) ---
const _statsCache = new Map(); // `${sportKey}-${playerId}` -> { data, at }
const _statsInFlight = new Map();
const STATS_TTL_MS = 60 * 60 * 1000;

function zipLatestSeason(category) {
  const rows = category.statistics || [];
  const latest = rows[rows.length - 1]; // ESPN orders season-by-season rows oldest-first — confirmed live (NBA)
  if (!latest) return [];
  return category.labels.map((label, i) => ({ label, value: latest.stats[i] })).filter((s) => s.value !== undefined);
}

function zipSoccerSplit(statistics, leagueSlug) {
  const splits = statistics.splits || [];
  const split = splits.find((s) => s.leagueSlug === leagueSlug) || splits[0];
  if (!split) return [];
  return statistics.labels.map((label, i) => ({ label, value: split.stats[i] })).filter((s) => s.value !== undefined);
}

async function getESPNPlayerStats(sportKey, playerId) {
  const cacheKey = `${sportKey}-${playerId}`;
  const cached = _statsCache.get(cacheKey);
  if (cached && Date.now() - cached.at < STATS_TTL_MS) return cached.data;
  if (_statsInFlight.has(cacheKey)) return _statsInFlight.get(cacheKey);

  const config = PLAYER_SPORT_CONFIG[sportKey];
  const isSoccer = config.sport === 'soccer';
  // Soccer's per-player endpoint is /overview, not /stats — confirmed live
  // (the other shape 404s for soccer players). Everything else checked so
  // far (basketball, football) uses /stats.
  const promise = (isSoccer ? athleteFetch(sportKey, `/athletes/${playerId}/overview`) : athleteFetch(sportKey, `/athletes/${playerId}/stats`))
    .then(async (res) => {
      if (!res.ok) throw new Error(`ESPN ${sportKey} player stats failed: ${res.status}`);
      const json = await res.json();
      let stats = [];
      if (isSoccer) {
        stats = zipSoccerSplit(json.statistics, config.league);
      } else {
        const category = (json.categories || [])[0];
        if (category) stats = zipLatestSeason(category);
      }
      _statsCache.set(cacheKey, { data: stats, at: Date.now() });
      _statsInFlight.delete(cacheKey);
      return stats;
    })
    .catch((err) => { _statsInFlight.delete(cacheKey); throw err; });

  _statsInFlight.set(cacheKey, promise);
  return promise;
}

async function getESPNPlayerData(favourite) {
  const stats = await getESPNPlayerStats(favourite.league, favourite.playerId).catch(() => null);
  return {
    stats: stats ?? [],
    dataAvailable: stats !== null,
  };
}

// Team-card "top scorers" for leagues whose team data doesn't already come
// with this baked in (currently just NBA — see nbaService.js). No dedicated
// ESPN "team leaders" endpoint was found (checked live, including
// `?enable=leaders`), so this pulls the full roster, fetches each player's
// stats, and ranks by the given label client-side — ESPN's site API has no
// observed rate limit (unlike football-data.org/BallDontLie), so a roster's
// worth of parallel calls is fine, and each player's result lands in the 1h
// per-player cache above regardless of which team card triggered it.
async function getESPNTeamTopScorers(sportKey, team, statLabel, count = 2) {
  const roster = await getESPNRoster(sportKey, team).catch(() => []);
  const withStats = await Promise.all(
    roster.map(async (p) => {
      const stats = await getESPNPlayerStats(sportKey, p.id).catch(() => []);
      const stat = stats.find((s) => s.label === statLabel);
      const value = stat ? parseFloat(stat.value) : NaN;
      return Number.isFinite(value) ? { name: p.name, value, display: stat.value } : null;
    })
  );
  return withStats
    .filter(Boolean)
    .sort((a, b) => b.value - a.value)
    .slice(0, count);
}

module.exports = {
  getESPNRoster,
  getESPNPlayerData,
  getESPNTeamTopScorers,
  PLAYER_SPORT_CONFIG,
};
