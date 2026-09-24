const fetchWithTimeout = require('../utils/fetchWithTimeout');

const USER_AGENT = 'MyLineUp/1.0 (personal sports dashboard)';
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

// ESPN sport/league path segments for each supported league code
const ESPN_SPORT_CONFIG = {
  NFL: { sport: 'football', league: 'nfl' },
  NHL: { sport: 'hockey', league: 'nhl' },
  MLB: { sport: 'baseball', league: 'mlb' },
  // Matches the URL already used (and presumably working) in espnColourService.js
  AFL: { sport: 'australian-football', league: 'afl' },
  // NRL isn't addressed by a friendly league name on ESPN's site API — confirmed
  // against the real API (their docs don't document this): it's the numeric
  // league id under the "rugby-league" sport.
  NRL: { sport: 'rugby-league', league: '3' },
  WNBA: { sport: 'basketball', league: 'wnba' },
  NWSL: { sport: 'soccer', league: 'usa.nwsl' },
  ALEAGUE: { sport: 'soccer', league: 'aus.1' },
  LIGAMX: { sport: 'soccer', league: 'mex.1' },
  BRASILEIRAO: { sport: 'soccer', league: 'bra.1' },
  ARGENTINA: { sport: 'soccer', league: 'arg.1' },
  SAUDIPL: { sport: 'soccer', league: 'ksa.1' },
  PRIMEIRALIGA: { sport: 'soccer', league: 'por.1' },
  TURKEY: { sport: 'soccer', league: 'tur.1' },
  SCOTLAND: { sport: 'soccer', league: 'sco.1' },
  JLEAGUE: { sport: 'soccer', league: 'jpn.1' },
};

// Fallback venue timezone when ESPN's schedule doesn't give us a per-venue one —
// each league's home base, not accurate for every individual venue, but far
// closer than a single hardcoded US timezone was for a league played entirely
// in Australia.
const DEFAULT_VENUE_TIMEZONE = {
  NFL: 'America/New_York',
  NHL: 'America/New_York',
  MLB: 'America/New_York',
  AFL: 'Australia/Sydney',
  NRL: 'Australia/Sydney',
  WNBA: 'America/New_York',
  NWSL: 'America/New_York',
  ALEAGUE: 'Australia/Sydney',
  LIGAMX: 'America/Mexico_City',
  BRASILEIRAO: 'America/Sao_Paulo',
  ARGENTINA: 'America/Argentina/Buenos_Aires',
  SAUDIPL: 'Asia/Riyadh',
  PRIMEIRALIGA: 'Europe/Lisbon',
  TURKEY: 'Europe/Istanbul',
  SCOTLAND: 'Europe/London',
  JLEAGUE: 'Asia/Tokyo',
};

function espnFetch(path) {
  return fetchWithTimeout(`${ESPN_BASE}${path}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
}

// Build the crest URL directly from ESPN's CDN convention rather than trusting the
// shape of the `logos` array in the JSON response — same reliable pattern already
// used for NBA/AFL/WC in sportsDataService.espnLogoFromTeamId.
//
// NRL, NWSL, and A-League are keyed by the team's own numeric ESPN id rather
// than its abbreviation — confirmed against real API responses, since ESPN's
// docs don't state this anywhere. NRL's path is "rugby/teams" (not
// "rugby-league"); the two soccer leagues share the same generic "soccer"
// bucket EPL/La Liga/etc. use for their own (separately-tracked) numeric-id
// logo map in sportsDataService.js's EPL_ESPN_IDS.
const LOGO_ID_PATH_OVERRIDES = {
  NRL: 'rugby/teams',
  NWSL: 'soccer',
  ALEAGUE: 'soccer',
  LIGAMX: 'soccer',
  BRASILEIRAO: 'soccer',
  ARGENTINA: 'soccer',
  SAUDIPL: 'soccer',
  PRIMEIRALIGA: 'soccer',
  TURKEY: 'soccer',
  SCOTLAND: 'soccer',
  JLEAGUE: 'soccer',
};

function cdnLogoUrl(sportKey, team) {
  if (!team) return null;

  const idPath = LOGO_ID_PATH_OVERRIDES[sportKey];
  if (idPath) {
    return team.id ? `https://a.espncdn.com/i/teamlogos/${idPath}/500/${team.id}.png` : null;
  }

  if (!team.abbreviation) return null;
  return `https://a.espncdn.com/i/teamlogos/${sportKey.toLowerCase()}/500/${team.abbreviation.toLowerCase()}.png`;
}

// --- Teams (per-league, 24h cache) ---
const _teamsCache = new Map();
const _teamsInFlight = new Map();
const TEAMS_TTL_MS = 24 * 60 * 60 * 1000;

async function getESPNTeams(sportKey) {
  const config = ESPN_SPORT_CONFIG[sportKey];
  const cached = _teamsCache.get(sportKey);
  if (cached && Date.now() - cached.at < TEAMS_TTL_MS) return cached.data;
  if (_teamsInFlight.has(sportKey)) return _teamsInFlight.get(sportKey);

  const promise = espnFetch(`/${config.sport}/${config.league}/teams?limit=50`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`ESPN ${sportKey} teams fetch failed: ${res.status}`);
      const json = await res.json();
      const raw = json.sports?.[0]?.leagues?.[0]?.teams ?? [];
      const teams = raw.map((entry) => entry.team).filter(Boolean);
      _teamsCache.set(sportKey, { data: teams, at: Date.now() });
      _teamsInFlight.delete(sportKey);
      return teams;
    })
    .catch((err) => { _teamsInFlight.delete(sportKey); throw err; });

  _teamsInFlight.set(sportKey, promise);
  return promise;
}

function findTeamByAbbr(teams, abbr) {
  const target = abbr.toLowerCase();
  return teams.find((t) => (t.abbreviation || '').toLowerCase() === target);
}

function normalizeTeamName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Falls back to matching by team name when the abbreviation lookup misses —
// unlike NFL/NHL/MLB (where our stored team IDs already use ESPN's own
// standard abbreviations), AFL's stored IDs use abbreviations we invented
// ourselves and were never verified against ESPN's actual scheme.
//
// Checks for an exact-name match across every team *before* trying a fuzzy
// substring match on any of them — not just fuzzy-matching the first team
// that happens to qualify. Without that ordering, a short name can shadow
// a different team whose own full name simply contains it as a substring:
// e.g. Scotland's "Dundee" and "Dundee United" are two separate ESPN teams
// (which also happen to share the literal abbreviation "DUN", so this is
// their only path to a correct match) — searching for "Dundee United" must
// not settle for "Dundee" just because it's fuzzily "close enough" and
// listed first.
function findTeamByName(teams, teamName) {
  const target = normalizeTeamName(teamName);
  if (!target) return null;

  const exactMatch = teams.find((t) => {
    const candidates = [t.displayName, t.shortDisplayName, t.name, t.location].map(normalizeTeamName);
    return candidates.some((c) => c === target);
  });
  if (exactMatch) return exactMatch;

  return teams.find((t) => {
    const candidates = [t.displayName, t.shortDisplayName, t.name, t.location].map(normalizeTeamName);
    return candidates.some((c) => c && (target.includes(c) || c.includes(target)));
  });
}

// --- Standings (per-league, 5min cache) ---
// ESPN nests standings under an arbitrary depth of conference/division "children" groups —
// walk recursively and flatten rather than assuming a fixed depth.
function flattenStandingsEntries(node, out = []) {
  if (!node) return out;
  if (Array.isArray(node.entries)) out.push(...node.entries);
  if (node.standings) flattenStandingsEntries(node.standings, out);
  if (Array.isArray(node.children)) node.children.forEach((child) => flattenStandingsEntries(child, out));
  return out;
}

function statValue(entry, name) {
  const stat = (entry.stats || []).find((s) => s.name === name || s.type === name);
  return stat ? (stat.value ?? stat.displayValue ?? null) : null;
}

const _standingsCache = new Map();
const _standingsInFlight = new Map();
const STANDINGS_TTL_MS = 5 * 60 * 1000;

async function getESPNStandingsEntries(sportKey) {
  const config = ESPN_SPORT_CONFIG[sportKey];
  const cached = _standingsCache.get(sportKey);
  if (cached && Date.now() - cached.at < STANDINGS_TTL_MS) return cached.data;
  if (_standingsInFlight.has(sportKey)) return _standingsInFlight.get(sportKey);

  const promise = espnFetch(`/${config.sport}/${config.league}/standings`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`ESPN ${sportKey} standings fetch failed: ${res.status}`);
      const json = await res.json();
      const entries = flattenStandingsEntries(json);
      _standingsCache.set(sportKey, { data: entries, at: Date.now() });
      _standingsInFlight.delete(sportKey);
      return entries;
    })
    .catch((err) => { _standingsInFlight.delete(sportKey); throw err; });

  _standingsInFlight.set(sportKey, promise);
  return promise;
}

// --- Team schedule (per-team, 5min cache) ---
const _scheduleCache = new Map();
const _scheduleInFlight = new Map();
const SCHEDULE_TTL_MS = 5 * 60 * 1000;

async function getESPNSchedule(sportKey, teamEspnId) {
  const config = ESPN_SPORT_CONFIG[sportKey];
  const cacheKey = `${sportKey}-${teamEspnId}`;
  const cached = _scheduleCache.get(cacheKey);
  if (cached && Date.now() - cached.at < SCHEDULE_TTL_MS) return cached.data;
  if (_scheduleInFlight.has(cacheKey)) return _scheduleInFlight.get(cacheKey);

  const promise = espnFetch(`/${config.sport}/${config.league}/teams/${teamEspnId}/schedule`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`ESPN ${sportKey} schedule fetch failed: ${res.status}`);
      const json = await res.json();
      const events = json.events || [];
      _scheduleCache.set(cacheKey, { data: events, at: Date.now() });
      _scheduleInFlight.delete(cacheKey);
      return events;
    })
    .catch((err) => { _scheduleInFlight.delete(cacheKey); throw err; });

  _scheduleInFlight.set(cacheKey, promise);
  return promise;
}

function eventCompetitors(event) {
  return event?.competitions?.[0]?.competitors || [];
}

function isEventCompleted(event) {
  return Boolean(event?.competitions?.[0]?.status?.type?.completed);
}

function eventDate(event) {
  return event?.date || event?.competitions?.[0]?.date;
}

// Build a normalised result/fixture entry for `teamEspnId` out of a schedule event
function describeEvent(event, teamEspnId, sportKey) {
  const competitors = eventCompetitors(event);
  const mine = competitors.find((c) => String(c.team?.id) === String(teamEspnId));
  const opponent = competitors.find((c) => String(c.team?.id) !== String(teamEspnId));
  if (!mine || !opponent) return null;
  return {
    date: eventDate(event),
    isHome: mine.homeAway === 'home',
    myScore: mine.score?.value ?? mine.score ?? null,
    oppScore: opponent.score?.value ?? opponent.score ?? null,
    opponentName: opponent.team?.shortDisplayName || opponent.team?.displayName || opponent.team?.name,
    opponentLogoUrl: cdnLogoUrl(sportKey, opponent.team),
    won: mine.winner === true,
    lost: opponent.winner === true,
  };
}

async function getESPNTeamData(favourite, sportKey) {
  const prefix = `${sportKey.toLowerCase()}-`;
  const abbr = favourite.teamId.startsWith(prefix) ? favourite.teamId.slice(prefix.length) : favourite.teamId;

  const teams = await getESPNTeams(sportKey);
  const team = findTeamByAbbr(teams, abbr) || findTeamByName(teams, favourite.teamName);
  if (!team) return null;

  const [events, standingsEntries] = await Promise.all([
    getESPNSchedule(sportKey, team.id),
    getESPNStandingsEntries(sportKey).catch(() => []),
  ]);

  const now = Date.now();
  const finished = events
    .filter(isEventCompleted)
    .sort((a, b) => new Date(eventDate(b)) - new Date(eventDate(a)));
  const upcoming = events
    .filter((e) => !isEventCompleted(e) && new Date(eventDate(e)).getTime() >= now)
    .sort((a, b) => new Date(eventDate(a)) - new Date(eventDate(b)));

  let latestResult = null;
  const lastEvent = finished[0] && describeEvent(finished[0], team.id, sportKey);
  if (lastEvent) {
    latestResult = {
      date: lastEvent.date.split('T')[0],
      outcome: lastEvent.won ? 'W' : lastEvent.lost ? 'L' : 'D',
      opponent: lastEvent.opponentName,
      score: `${lastEvent.myScore}-${lastEvent.oppScore}`,
    };
  }

  let nextFixture = null;
  const nextEvent = upcoming[0] && describeEvent(upcoming[0], team.id, sportKey);
  if (nextEvent) {
    nextFixture = {
      date: nextEvent.date.split('T')[0],
      utcDate: nextEvent.date,
      venueTimezone: DEFAULT_VENUE_TIMEZONE[sportKey] || 'America/New_York',
      opponent: nextEvent.opponentName,
      opponentLogoUrl: nextEvent.opponentLogoUrl,
      venue: nextEvent.isHome ? 'Home' : 'Away',
    };
  }

  const standingRow = standingsEntries.find((e) => String(e.team?.id) === String(team.id));
  const wins = standingRow ? statValue(standingRow, 'wins') : null;
  const losses = standingRow ? statValue(standingRow, 'losses') : null;
  const rank = standingRow ? statValue(standingRow, 'rank') ?? statValue(standingRow, 'playoffSeed') : null;

  return {
    latestResult,
    nextFixture,
    ladderPosition: rank !== null && rank !== undefined ? Number(rank) : null,
    stats: wins !== null ? { wins: Number(wins), losses: Number(losses) } : {},
    logoUrl: cdnLogoUrl(sportKey, team),
    topScorers: [],
    seasonFinished: finished.length > 0 && upcoming.length === 0,
  };
}

async function getESPNStandingsOverview(sportKey) {
  const [teams, entries] = await Promise.all([
    getESPNTeams(sportKey),
    getESPNStandingsEntries(sportKey),
  ]);

  // ESPN sometimes nests a conference-level standings block alongside per-division
  // ones — flattening can see the same team twice, so dedupe by team id.
  const seenTeamIds = new Set();
  const uniqueEntries = entries.filter((entry) => {
    const id = String(entry.team?.id);
    if (seenTeamIds.has(id)) return false;
    seenTeamIds.add(id);
    return true;
  });

  return uniqueEntries
    .map((entry) => {
      const team = teams.find((t) => String(t.id) === String(entry.team?.id));
      const wins = statValue(entry, 'wins');
      const losses = statValue(entry, 'losses');
      const rank = statValue(entry, 'rank') ?? statValue(entry, 'playoffSeed');
      return {
        position: rank !== null && rank !== undefined ? Number(rank) : null,
        teamName: team?.displayName || entry.team?.displayName || 'Unknown',
        logoUrl: cdnLogoUrl(sportKey, team || entry.team),
        stats: wins !== null ? { wins: Number(wins), losses: Number(losses) } : {},
      };
    })
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
}

const _leagueGamesCache = new Map();
const _leagueGamesInFlight = new Map();
const LEAGUE_GAMES_TTL_MS = 5 * 60 * 1000;

// Used to send a `?dates=YYYYMMDD-YYYYMMDD` range here to get a ±7-day
// window. As of 2026-09-17 that now 400s ("Failed to get events endpoint")
// for every league checked — NRL, NFL, AFL, NHL, MLB alike — so this appears
// to be an ESPN-side change/outage rather than a per-league quirk. Omitting
// the date param entirely still works and gives ESPN's own notion of
// "current" games, which isn't quite the same ±7-day window but is the only
// query shape that isn't rejected right now. Revisit if ESPN restores range
// support.
async function fetchESPNScoreboard(sportKey) {
  const cached = _leagueGamesCache.get(sportKey);
  if (cached && Date.now() - cached.at < LEAGUE_GAMES_TTL_MS) return cached.data;
  if (_leagueGamesInFlight.has(sportKey)) return _leagueGamesInFlight.get(sportKey);

  const config = ESPN_SPORT_CONFIG[sportKey];
  const promise = (async () => {
    const res = await espnFetch(`/${config.sport}/${config.league}/scoreboard`);
    if (!res.ok) throw new Error(`ESPN ${sportKey} scoreboard fetch failed: ${res.status}`);
    const { events } = await res.json();
    return events || [];
  })()
    .then((data) => {
      _leagueGamesCache.set(sportKey, { data, at: Date.now() });
      _leagueGamesInFlight.delete(sportKey);
      return data;
    })
    .catch((err) => { _leagueGamesInFlight.delete(sportKey); throw err; });

  _leagueGamesInFlight.set(sportKey, promise);
  return promise;
}

async function getESPNLeagueGames(sportKey) {
  const events = await fetchESPNScoreboard(sportKey);

  const finished = (events || []).filter(isEventCompleted);
  const scheduled = (events || []).filter((e) => !isEventCompleted(e));

  const recentResults = finished
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((e) => {
      const [home, away] = eventCompetitors(e);
      const homeC = home?.homeAway === 'home' ? home : away;
      const awayC = home?.homeAway === 'home' ? away : home;
      return {
        homeTeam: homeC?.team?.shortDisplayName || homeC?.team?.displayName,
        awayTeam: awayC?.team?.shortDisplayName || awayC?.team?.displayName,
        homeScore: homeC?.score?.value ?? homeC?.score ?? null,
        awayScore: awayC?.score?.value ?? awayC?.score ?? null,
        date: e.date.split('T')[0],
      };
    });

  const upcomingFixtures = scheduled
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)
    .map((e) => {
      const [home, away] = eventCompetitors(e);
      const homeC = home?.homeAway === 'home' ? home : away;
      const awayC = home?.homeAway === 'home' ? away : home;
      return {
        homeTeam: homeC?.team?.shortDisplayName || homeC?.team?.displayName,
        awayTeam: awayC?.team?.shortDisplayName || awayC?.team?.displayName,
        date: e.date.split('T')[0],
        time: new Date(e.date).toLocaleTimeString('en-AU', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Australia/Sydney',
        }),
      };
    });

  return { recentResults, upcomingFixtures };
}

module.exports = {
  getESPNTeamData,
  getESPNStandingsOverview,
  getESPNLeagueGames,
};
