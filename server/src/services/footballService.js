const env = require('../config/env');

const FD_BASE = 'https://api.football-data.org/v4';

function fdFetch(path) {
  return fetch(`${FD_BASE}${path}`, {
    headers: { 'X-Auth-Token': env.footballApiKey },
  });
}

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

// football-data.org shortNames don't always match our display names — override the tricky ones
const SHORTNAME_OVERRIDES = {
  'Manchester City': 'Man City',
  'Manchester United': 'Man Utd',
  'Newcastle United': 'Newcastle Utd',
  'Tottenham Hotspur': 'Spurs',
  'Nottingham Forest': "Nott'm Forest",
};

// --- Teams cache (permanent — squads don't change mid-request) ---
let _plTeamsCache = null;

async function getPLTeams() {
  if (_plTeamsCache) return _plTeamsCache;
  const res = await fdFetch('/competitions/PL/teams');
  if (!res.ok) throw new Error(`football-data.org /teams failed: ${res.status}`);
  const { teams } = await res.json();
  _plTeamsCache = teams;
  return teams;
}

function findFDTeam(allTeams, ourName) {
  const target = (SHORTNAME_OVERRIDES[ourName] || ourName).toLowerCase();
  return allTeams.find(
    (t) =>
      (t.shortName || '').toLowerCase() === target ||
      t.name.toLowerCase().includes(target) ||
      target.includes((t.shortName || '').toLowerCase()),
  );
}

// --- Standings cache with 5-minute TTL ---
let _standingsCache = null;
let _standingsCachedAt = 0;
const STANDINGS_TTL_MS = 5 * 60 * 1000;

async function getPLStandings() {
  if (_standingsCache && Date.now() - _standingsCachedAt < STANDINGS_TTL_MS) {
    return _standingsCache;
  }
  const res = await fdFetch('/competitions/PL/standings');
  if (!res.ok) throw new Error(`football-data.org /standings failed: ${res.status}`);
  const { standings } = await res.json();
  const table = standings.find((s) => s.type === 'TOTAL')?.table || [];
  _standingsCache = table;
  _standingsCachedAt = Date.now();
  return table;
}

async function getEPLTeamData(favourite) {
  const [allTeams, standings] = await Promise.all([getPLTeams(), getPLStandings()]);

  const fdTeam = findFDTeam(allTeams, favourite.teamName);
  if (!fdTeam) {
    console.warn(`football-data.org: no match found for "${favourite.teamName}"`);
    return null;
  }

  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - 30);
  const future = new Date(now);
  future.setDate(future.getDate() + 30);

  const [finishedRes, scheduledRes] = await Promise.all([
    fdFetch(`/teams/${fdTeam.id}/matches?competitions=PL&status=FINISHED&dateFrom=${toDateStr(past)}&dateTo=${toDateStr(now)}&limit=5`),
    fdFetch(`/teams/${fdTeam.id}/matches?competitions=PL&status=SCHEDULED&dateFrom=${toDateStr(now)}&dateTo=${toDateStr(future)}&limit=1`),
  ]);

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
    const outcome =
      winner === null
        ? 'D'
        : (winner === 'HOME_TEAM') === isHome
          ? 'W'
          : 'L';
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
    const matchDate = new Date(nextMatch.utcDate);
    nextFixture = {
      date: toDateStr(matchDate),
      time: matchDate.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Australia/Sydney',
      }),
      opponent,
      venue: isHome ? 'Home' : 'Away',
    };
  }

  const standingRow = (standings || []).find((s) => s.team.id === fdTeam.id);
  const ladderPosition = standingRow?.position ?? null;
  const stats = standingRow
    ? {
        played: standingRow.playedGames,
        won: standingRow.won,
        drawn: standingRow.draw,
        lost: standingRow.lost,
        points: standingRow.points,
      }
    : {};

  return { latestResult, nextFixture, ladderPosition, stats };
}

module.exports = { getEPLTeamData };
