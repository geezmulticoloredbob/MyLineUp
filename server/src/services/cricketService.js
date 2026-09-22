const fetchWithTimeout = require('../utils/fetchWithTimeout');
const env = require('../config/env');

const API_BASE = 'https://api.cricapi.com/v1';

// cricketdata.org (formerly CricAPI) has no stable per-league id the way
// ESPN does — "IPL" only exists as "Indian Premier League 2026", a
// different UUID each season, found via /series?search=. These need
// manually refreshing once a year when a new season's series appears;
// there's no cheap way to auto-discover "this year's IPL" at request time
// without burning an extra call against the tight 100/day free-tier limit
// on every single lookup. When a season rolls over and a league's data
// looks stale/empty, search https://api.cricapi.com/v1/series?apikey=KEY&search=<name>
// for the new id.
const SERIES_IDS = {
  IPL: '87c62aac-bc3c-4738-ab93-19da0690488f', // Indian Premier League 2026
  BBL: 'c6ae878d-fcb7-4342-a7d7-a65ee3fe3de2', // Big Bash League 2026-27 (empty until the season starts in December)
};

// Free tier is a hard 100 requests/day shared across every league and every
// user of this app — nothing like ESPN's effectively-unlimited free tier.
// Long TTLs here are deliberate headroom, not laziness: T20 matches happen
// roughly daily during an active season at most, so a few hours of
// staleness costs little, while every avoided call preserves the shared
// daily budget.
const SERIES_INFO_TTL_MS = 3 * 60 * 60 * 1000; // 3h
const SERIES_POINTS_TTL_MS = 3 * 60 * 60 * 1000; // 3h

function cricketFetch(path, params) {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set('apikey', env.cricketApiKey);
  for (const [key, value] of Object.entries(params || {})) {
    url.searchParams.set(key, value);
  }
  return fetchWithTimeout(url.toString());
}

// --- Series info: match list (per-league, 3h cache) ---
const _seriesInfoCache = new Map();
const _seriesInfoInFlight = new Map();

async function getSeriesInfo(leagueKey) {
  const cached = _seriesInfoCache.get(leagueKey);
  if (cached && Date.now() - cached.at < SERIES_INFO_TTL_MS) return cached.data;
  if (_seriesInfoInFlight.has(leagueKey)) return _seriesInfoInFlight.get(leagueKey);

  const promise = cricketFetch('/series_info', { id: SERIES_IDS[leagueKey] })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Cricket ${leagueKey} series_info fetch failed: ${res.status}`);
      const json = await res.json();
      if (json.status !== 'success') throw new Error(`Cricket ${leagueKey} series_info returned status "${json.status}"`);
      _seriesInfoCache.set(leagueKey, { data: json.data, at: Date.now() });
      _seriesInfoInFlight.delete(leagueKey);
      return json.data;
    })
    .catch((err) => { _seriesInfoInFlight.delete(leagueKey); throw err; });

  _seriesInfoInFlight.set(leagueKey, promise);
  return promise;
}

// --- Points table (per-league, 3h cache) ---
const _pointsCache = new Map();
const _pointsInFlight = new Map();

async function getSeriesPoints(leagueKey) {
  const cached = _pointsCache.get(leagueKey);
  if (cached && Date.now() - cached.at < SERIES_POINTS_TTL_MS) return cached.data;
  if (_pointsInFlight.has(leagueKey)) return _pointsInFlight.get(leagueKey);

  const promise = cricketFetch('/series_points', { id: SERIES_IDS[leagueKey] })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Cricket ${leagueKey} series_points fetch failed: ${res.status}`);
      const json = await res.json();
      // A season with no matches played yet (e.g. BBL before December) returns
      // status "success" with an empty array, not an error — treat as "no rows".
      const rows = json.status === 'success' ? json.data || [] : [];
      _pointsCache.set(leagueKey, { data: rows, at: Date.now() });
      _pointsInFlight.delete(leagueKey);
      return rows;
    })
    .catch((err) => { _pointsInFlight.delete(leagueKey); throw err; });

  _pointsInFlight.set(leagueKey, promise);
  return promise;
}

function findTeamInfo(matches, abbr, teamName) {
  const targetAbbr = (abbr || '').toLowerCase();
  const targetName = (teamName || '').toLowerCase();

  for (const match of matches) {
    const found = (match.teamInfo || []).find(
      (t) => (t.shortname || '').toLowerCase() === targetAbbr || (t.name || '').toLowerCase() === targetName,
    );
    if (found) return found;
  }
  return null;
}

// Result text is deliberately not forced into a numeric score — cricket's own
// convention is to describe a result by margin ("won by 23 runs"), not a
// simple final tally the way football/basketball scorelines work, and the
// series_info match list this reads from doesn't carry per-innings run
// totals anyway (only a per-match detail endpoint would, at the cost of one
// extra call per match — not viable against the 100/day budget).
function outcomeFromStatus(status, teamName) {
  const s = (status || '').toLowerCase();
  if (s.includes('tied')) return 'D';
  if (teamName && s.startsWith(teamName.toLowerCase())) return 'W';
  if (s.includes('won by')) return 'L';
  return null; // abandoned, no result, or an unparseable status string
}

async function getCricketTeamData(favourite, leagueKey) {
  const prefix = `${leagueKey.toLowerCase()}-`;
  const abbr = favourite.teamId.startsWith(prefix) ? favourite.teamId.slice(prefix.length) : favourite.teamId;

  const [seriesInfo, points] = await Promise.all([
    getSeriesInfo(leagueKey),
    getSeriesPoints(leagueKey).catch(() => []),
  ]);

  const allMatches = seriesInfo.matchList || [];
  const myTeamInfo = findTeamInfo(allMatches, abbr, favourite.teamName);
  if (!myTeamInfo) return null;

  const teamMatches = allMatches.filter((m) =>
    (m.teamInfo || []).some((t) => t.shortname === myTeamInfo.shortname),
  );

  const finished = teamMatches
    .filter((m) => m.matchEnded)
    .sort((a, b) => new Date(b.dateTimeGMT) - new Date(a.dateTimeGMT));
  const upcoming = teamMatches
    .filter((m) => !m.matchStarted)
    .sort((a, b) => new Date(a.dateTimeGMT) - new Date(b.dateTimeGMT));

  let latestResult = null;
  if (finished[0]) {
    const m = finished[0];
    const opponent = (m.teamInfo || []).find((t) => t.shortname !== myTeamInfo.shortname);
    latestResult = {
      date: m.date,
      outcome: outcomeFromStatus(m.status, myTeamInfo.name),
      opponent: opponent?.name || 'TBD',
      score: m.status || '',
    };
  }

  let nextFixture = null;
  if (upcoming[0]) {
    const m = upcoming[0];
    const opponent = (m.teamInfo || []).find((t) => t.shortname !== myTeamInfo.shortname);
    nextFixture = {
      date: m.date,
      utcDate: m.dateTimeGMT ? `${m.dateTimeGMT}Z` : null,
      venue: m.venue || null,
      opponent: opponent?.name || 'TBD',
      opponentLogoUrl: opponent?.img || null,
    };
  }

  // Rank derived from wins (the free-tier points table has no points/NRR
  // fields to sort by properly) — a close approximation, not an official
  // ladder position.
  const pointsRow = points.find((p) => p.shortname === myTeamInfo.shortname);
  let ladderPosition = null;
  if (pointsRow) {
    const sorted = [...points].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0) || (a.loss ?? 0) - (b.loss ?? 0));
    ladderPosition = sorted.findIndex((p) => p.shortname === myTeamInfo.shortname) + 1;
  }

  return {
    latestResult,
    nextFixture,
    ladderPosition,
    stats: pointsRow ? { wins: pointsRow.wins ?? 0, losses: pointsRow.loss ?? 0 } : {},
    logoUrl: myTeamInfo.img || null,
    topScorers: [],
    seasonFinished: teamMatches.length > 0 && upcoming.length === 0,
  };
}

async function getCricketStandingsOverview(leagueKey) {
  const points = await getSeriesPoints(leagueKey);
  return [...points]
    .sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0) || (a.loss ?? 0) - (b.loss ?? 0))
    .map((row, i) => ({
      position: i + 1,
      teamName: row.teamname,
      logoUrl: row.img || null,
      stats: { wins: row.wins ?? 0, losses: row.loss ?? 0 },
    }));
}

// The Today feed / league overview's recentResults/upcomingFixtures expect a
// numeric homeScore/awayScore (LeagueCard.jsx compares them directly to
// highlight the winner) — cricket has no such number available without a
// per-match detail call, so this deliberately returns empty rather than
// forcing something misleading into those fields. Per-team dashboard cards
// (getCricketTeamData above) aren't affected — their "score" is just
// display text, not compared numerically.
async function getCricketLeagueGames() {
  return { recentResults: [], upcomingFixtures: [] };
}

module.exports = {
  getCricketTeamData,
  getCricketStandingsOverview,
  getCricketLeagueGames,
};
