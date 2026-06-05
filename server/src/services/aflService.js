const fetchWithTimeout = require('../utils/fetchWithTimeout');

const SQUIGGLE_BASE = 'https://api.squiggle.com.au';
const USER_AGENT = 'MyLineUp/1.0 (personal sports dashboard)';
const TTL_MS = 5 * 60 * 1000;

// Maps our stored teamName to the name Squiggle uses
const SQUIGGLE_NAME_MAP = {
  'Adelaide Crows': 'Adelaide',
  'Brisbane Lions': 'Brisbane',
  Carlton: 'Carlton',
  Collingwood: 'Collingwood',
  Essendon: 'Essendon',
  Fremantle: 'Fremantle',
  Geelong: 'Geelong',
  'Gold Coast Suns': 'Gold Coast',
  'GWS Giants': 'GWS',
  Hawthorn: 'Hawthorn',
  Melbourne: 'Melbourne',
  'North Melbourne': 'North Melbourne',
  'Port Adelaide': 'Port Adelaide',
  Richmond: 'Richmond',
  'St Kilda': 'St Kilda',
  'Sydney Swans': 'Sydney',
  'West Coast Eagles': 'West Coast',
  'Western Bulldogs': 'Western Bulldogs',
};

// Squiggle times are in AEST/AEDT (Australia/Sydney). Convert to UTC ISO.
function aflDateToUtc(dateStr) {
  if (!dateStr || !dateStr.includes(' ')) return null;
  const month = parseInt(dateStr.substring(5, 7));
  // Oct–Mar: AEDT (UTC+11); Apr–Sep: AEST (UTC+10)
  const offset = month >= 10 || month <= 3 ? '+11:00' : '+10:00';
  return new Date(dateStr.replace(' ', 'T') + offset).toISOString();
}

const AFL_HOME_TIMEZONES = {
  Adelaide: 'Australia/Adelaide',
  'Port Adelaide': 'Australia/Adelaide',
  'West Coast': 'Australia/Perth',
  Fremantle: 'Australia/Perth',
  Brisbane: 'Australia/Brisbane',
  'Gold Coast': 'Australia/Brisbane',
};

const ESPN_LOGO_BASE = 'https://a.espncdn.com/i/teamlogos/afl/500';
const AFL_ESPN_LOGOS = {
  Adelaide: `${ESPN_LOGO_BASE}/adel.png`,
  Brisbane: `${ESPN_LOGO_BASE}/bl.png`,
  Carlton: `${ESPN_LOGO_BASE}/carl.png`,
  Collingwood: `${ESPN_LOGO_BASE}/coll.png`,
  Essendon: `${ESPN_LOGO_BASE}/ess.png`,
  Fremantle: `${ESPN_LOGO_BASE}/fre.png`,
  GWS: `${ESPN_LOGO_BASE}/gws.png`,
  Geelong: `${ESPN_LOGO_BASE}/geel.png`,
  'Gold Coast': `${ESPN_LOGO_BASE}/suns.png`,
  Hawthorn: `${ESPN_LOGO_BASE}/haw.png`,
  Melbourne: `${ESPN_LOGO_BASE}/melb.png`,
  'North Melbourne': `${ESPN_LOGO_BASE}/nmfc.png`,
  'Port Adelaide': `${ESPN_LOGO_BASE}/port.png`,
  Richmond: `${ESPN_LOGO_BASE}/rich.png`,
  'St Kilda': `${ESPN_LOGO_BASE}/stk.png`,
  Sydney: `${ESPN_LOGO_BASE}/syd.png`,
  'West Coast': `${ESPN_LOGO_BASE}/wce.png`,
  'Western Bulldogs': `${ESPN_LOGO_BASE}/wb.png`,
};

let _standingsCache = null;
let _standingsCachedAt = 0;
let _gamesCache = null;
let _gamesCachedAt = 0;

async function getCachedStandings() {
  if (_standingsCache && Date.now() - _standingsCachedAt < TTL_MS) return _standingsCache;
  const year = new Date().getFullYear();
  const res = await fetchWithTimeout(`${SQUIGGLE_BASE}/?q=standings&year=${year}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Squiggle standings fetch failed: ${res.status}`);
  const { standings } = await res.json();
  _standingsCache = standings || [];
  _standingsCachedAt = Date.now();
  return _standingsCache;
}

async function getCachedGames() {
  if (_gamesCache && Date.now() - _gamesCachedAt < TTL_MS) return _gamesCache;
  const year = new Date().getFullYear();
  const res = await fetchWithTimeout(`${SQUIGGLE_BASE}/?q=games&year=${year}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Squiggle league games fetch failed: ${res.status}`);
  const { games } = await res.json();
  _gamesCache = games || [];
  _gamesCachedAt = Date.now();
  return _gamesCache;
}

async function getAFLTeamData(favourite) {
  const squiggleName = SQUIGGLE_NAME_MAP[favourite.teamName];
  if (!squiggleName) return null;

  const now = new Date();

  const [allGames, standings] = await Promise.all([
    getCachedGames(),
    getCachedStandings(),
  ]);

  const teamGames = allGames.filter(
    (g) => g.hteam === squiggleName || g.ateam === squiggleName
  );

  const completed = teamGames
    .filter((g) => g.complete === 100)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const upcoming = teamGames
    .filter((g) => g.complete < 100 && new Date(g.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let latestResult = null;
  if (completed[0]) {
    const g = completed[0];
    const isHome = g.hteam === squiggleName;
    const myScore = isHome ? g.hscore : g.ascore;
    const oppScore = isHome ? g.ascore : g.hscore;
    const opponent = isHome ? g.ateam : g.hteam;
    const outcome = g.winner === squiggleName ? 'W' : g.winner ? 'L' : 'D';
    latestResult = {
      date: g.date.split(' ')[0],
      outcome,
      opponent,
      score: `${myScore}-${oppScore}`,
    };
  }

  let nextFixture = null;
  if (upcoming[0]) {
    const g = upcoming[0];
    const isHome = g.hteam === squiggleName;
    const opponent = isHome ? g.ateam : g.hteam;
    const [date] = g.date.split(' ');
    nextFixture = {
      date,
      utcDate: aflDateToUtc(g.date),
      venueTimezone: AFL_HOME_TIMEZONES[g.hteam] || 'Australia/Sydney',
      opponent,
      opponentLogoUrl: AFL_ESPN_LOGOS[opponent] ?? null,
      venue: g.venue || (isHome ? 'Home' : 'Away'),
    };
  }

  const standing = standings.find((s) => s.name === squiggleName);
  const ladderPosition = standing?.rank ?? null;
  const stats = standing
    ? { wins: standing.wins, losses: standing.losses, points: standing.pts }
    : {};

  const logoUrl = AFL_ESPN_LOGOS[squiggleName] ?? null;
  return { latestResult, nextFixture, ladderPosition, stats, logoUrl };
}

async function getAFLStandings() {
  const standings = await getCachedStandings();
  return standings
    .slice()
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .map((s) => ({
      position: s.rank,
      teamName: s.name,
      logoUrl: AFL_ESPN_LOGOS[s.name] ?? null,
      stats: { wins: s.wins, losses: s.losses, points: s.pts, percentage: Math.round(s.percentage) },
    }));
}

async function getAFLLeagueGames() {
  const now = new Date();
  const games = await getCachedGames();

  const recentResults = games
    .filter((g) => g.complete === 100)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((g) => ({
      homeTeam: g.hteam,
      awayTeam: g.ateam,
      homeScore: g.hscore,
      awayScore: g.ascore,
      date: g.date.split(' ')[0],
    }));

  const upcomingFixtures = games
    .filter((g) => g.complete < 100 && new Date(g.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)
    .map((g) => {
      const [date, time] = g.date.split(' ');
      return { homeTeam: g.hteam, awayTeam: g.ateam, date, time: time || '', venue: g.venue };
    });

  return { recentResults, upcomingFixtures };
}

module.exports = { getAFLTeamData, getAFLStandings, getAFLLeagueGames };
