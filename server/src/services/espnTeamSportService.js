const fetchWithTimeout = require('../utils/fetchWithTimeout');

const USER_AGENT = 'MyLineUp/1.0 (personal sports dashboard)';
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

// ESPN sport/league path segments for each supported league code
const ESPN_SPORT_CONFIG = {
  NFL: { sport: 'football', league: 'nfl' },
  NHL: { sport: 'hockey', league: 'nhl' },
  MLB: { sport: 'baseball', league: 'mlb' },
};

function espnFetch(path) {
  return fetchWithTimeout(`${ESPN_BASE}${path}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
}

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

function toCompactDate(d) {
  return toDateStr(d).replace(/-/g, '');
}

function pickLogoUrl(team) {
  const logos = team?.logos || [];
  const full = logos.find((l) => l.rel?.includes('full') && !l.rel?.includes('dark'));
  return full?.href || logos[0]?.href || null;
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
function describeEvent(event, teamEspnId) {
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
    opponentLogoUrl: pickLogoUrl(opponent.team),
    won: mine.winner === true,
    lost: opponent.winner === true,
  };
}

async function getESPNTeamData(favourite, sportKey) {
  const prefix = `${sportKey.toLowerCase()}-`;
  const abbr = favourite.teamId.startsWith(prefix) ? favourite.teamId.slice(prefix.length) : favourite.teamId;

  const teams = await getESPNTeams(sportKey);
  const team = findTeamByAbbr(teams, abbr);
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
  const lastEvent = finished[0] && describeEvent(finished[0], team.id);
  if (lastEvent) {
    latestResult = {
      date: lastEvent.date.split('T')[0],
      outcome: lastEvent.won ? 'W' : lastEvent.lost ? 'L' : 'D',
      opponent: lastEvent.opponentName,
      score: `${lastEvent.myScore}-${lastEvent.oppScore}`,
    };
  }

  let nextFixture = null;
  const nextEvent = upcoming[0] && describeEvent(upcoming[0], team.id);
  if (nextEvent) {
    nextFixture = {
      date: nextEvent.date.split('T')[0],
      utcDate: nextEvent.date,
      venueTimezone: 'America/New_York',
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
    logoUrl: pickLogoUrl(team),
    topScorers: [],
    seasonFinished: finished.length > 0 && upcoming.length === 0,
  };
}

async function getESPNStandingsOverview(sportKey) {
  const [teams, entries] = await Promise.all([
    getESPNTeams(sportKey),
    getESPNStandingsEntries(sportKey),
  ]);

  return entries
    .map((entry) => {
      const team = teams.find((t) => String(t.id) === String(entry.team?.id));
      const wins = statValue(entry, 'wins');
      const losses = statValue(entry, 'losses');
      const rank = statValue(entry, 'rank') ?? statValue(entry, 'playoffSeed');
      return {
        position: rank !== null && rank !== undefined ? Number(rank) : null,
        teamName: team?.displayName || entry.team?.displayName || 'Unknown',
        logoUrl: pickLogoUrl(team) || pickLogoUrl(entry.team),
        stats: wins !== null ? { wins: Number(wins), losses: Number(losses) } : {},
      };
    })
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
}

async function getESPNLeagueGames(sportKey) {
  const config = ESPN_SPORT_CONFIG[sportKey];
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - 7);
  const future = new Date(now);
  future.setDate(future.getDate() + 7);

  const res = await espnFetch(
    `/${config.sport}/${config.league}/scoreboard?dates=${toCompactDate(past)}-${toCompactDate(future)}`,
  );
  if (!res.ok) throw new Error(`ESPN ${sportKey} scoreboard fetch failed: ${res.status}`);
  const { events } = await res.json();

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
