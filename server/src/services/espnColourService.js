const fetchWithTimeout = require('../utils/fetchWithTimeout');

const ESPN_LEAGUE_URLS = {
  NBA:        'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
  AFL:        'https://site.api.espn.com/apis/site/v2/sports/australian-football/afl/teams',
  EPL:        'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams',
  LALIGA:     'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams',
  BUNDESLIGA: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/teams',
  SERIEA:     'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/teams',
  LIGUE1:     'https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/teams',
  CHAMPIONSHIP: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.2/teams',
  EREDIVISIE: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ned.1/teams',
  UCL:        'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/teams',
  NFL:        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
  NHL:        'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
  MLB:        'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
};

// Our stored team names that differ from ESPN's displayName / shortDisplayName
const TEAM_NAME_OVERRIDES = {
  'Wolves':    'Wolverhampton Wanderers',
  'Brighton':  'Brighton and Hove Albion',
  'GWS Giants': 'Greater Western Sydney Giants',
  'LA Clippers': 'Los Angeles Clippers',
};

// Strip punctuation and whitespace for fuzzy key matching
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Per-league: Map<normalizedName, { primary, secondary }>
const _cache = new Map();    // league → { data: Map, at }
const _inFlight = new Map(); // league → Promise
const TTL = 24 * 60 * 60 * 1000;

async function fetchLeagueColours(league) {
  const cached = _cache.get(league);
  if (cached && Date.now() - cached.at < TTL) return cached.data;
  if (_inFlight.has(league)) return _inFlight.get(league);

  const url = ESPN_LEAGUE_URLS[league];
  if (!url) return null;

  const promise = fetchWithTimeout(url, {
    headers: { 'User-Agent': 'MyLineUp/1.0 (personal sports dashboard)' },
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`ESPN colours fetch for ${league} returned ${res.status}`);
      const json = await res.json();
      // ESPN wraps results in sports[0].leagues[0].teams; some endpoints return teams directly
      const raw = json.sports?.[0]?.leagues?.[0]?.teams ?? json.teams ?? [];
      const colourMap = new Map();
      for (const entry of raw) {
        const t = entry.team ?? entry;
        if (!t.color) continue;
        const darkLogo = t.logos?.find((l) => l.rel?.includes('dark') && l.rel?.includes('full'));
        const colours = {
          primary: `#${t.color}`,
          secondary: `#${t.alternateColor || t.color}`,
          darkLogoUrl: darkLogo?.href ?? null,
        };
        // Index by every name variant ESPN provides so fuzzy matching is more likely to hit
        for (const name of [t.displayName, t.name, t.shortDisplayName, t.nickname, t.abbreviation]) {
          if (name) colourMap.set(normalize(name), colours);
        }
      }
      _cache.set(league, { data: colourMap, at: Date.now() });
      _inFlight.delete(league);
      return colourMap;
    })
    .catch((err) => {
      console.error(`ESPN colour fetch failed for ${league}:`, err.message);
      _inFlight.delete(league);
      return null;
    });

  _inFlight.set(league, promise);
  return promise;
}

async function getTeamColours(teamName, league) {
  try {
    const colourMap = await fetchLeagueColours(league);
    if (!colourMap) return null;
    const resolvedName = TEAM_NAME_OVERRIDES[teamName] ?? teamName;
    return colourMap.get(normalize(resolvedName)) ?? null;
  } catch {
    return null;
  }
}

module.exports = { getTeamColours };
