const SQUIGGLE_BASE = 'https://api.squiggle.com.au';
const USER_AGENT = 'MyLineUp/1.0 (personal sports dashboard)';

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

let _teamsCache = null;

async function getSquiggleTeams() {
  if (_teamsCache) return _teamsCache;
  const res = await fetch(`${SQUIGGLE_BASE}/?q=teams`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Squiggle teams fetch failed: ${res.status}`);
  const { teams } = await res.json();
  _teamsCache = teams;
  return teams;
}

async function getAFLTeamData(favourite) {
  const squiggleName = SQUIGGLE_NAME_MAP[favourite.teamName];
  if (!squiggleName) return null;

  const teams = await getSquiggleTeams();
  const team = teams.find((t) => t.name === squiggleName);
  if (!team) return null;

  const year = new Date().getFullYear();

  const [gamesRes, standingsRes] = await Promise.all([
    fetch(`${SQUIGGLE_BASE}/?q=games&year=${year}&team=${team.id}`, {
      headers: { 'User-Agent': USER_AGENT },
    }),
    fetch(`${SQUIGGLE_BASE}/?q=standings&year=${year}`, {
      headers: { 'User-Agent': USER_AGENT },
    }),
  ]);

  const [{ games }, { standings }] = await Promise.all([
    gamesRes.json(),
    standingsRes.json(),
  ]);

  const now = new Date();

  const completed = (games || [])
    .filter((g) => g.complete === 100)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const upcoming = (games || [])
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
    const [date, time] = g.date.split(' ');
    nextFixture = {
      date,
      time: time || '',
      opponent,
      venue: g.venue || (isHome ? 'Home' : 'Away'),
    };
  }

  const standing = (standings || []).find((s) => s.name === squiggleName);
  const ladderPosition = standing?.rank ?? null;
  const stats = standing
    ? { wins: standing.wins, losses: standing.losses, points: standing.pts }
    : {};

  return { latestResult, nextFixture, ladderPosition, stats, logoUrl: team.logo || null };
}

async function getAFLStandings() {
  const year = new Date().getFullYear();
  const res = await fetch(`${SQUIGGLE_BASE}/?q=standings&year=${year}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Squiggle standings fetch failed: ${res.status}`);
  const { standings } = await res.json();
  return (standings || [])
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .map((s) => ({
      position: s.rank,
      teamName: s.name,
      logoUrl: null,
      stats: { wins: s.wins, losses: s.losses, points: s.pts, percentage: Math.round(s.percentage) },
    }));
}

module.exports = { getAFLTeamData, getAFLStandings };
