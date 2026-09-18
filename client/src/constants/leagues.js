export const LEAGUES = {
  NBA: 'NBA',
  EPL: 'EPL',
  AFL: 'AFL',
  WC: 'WC',
  LALIGA: 'LALIGA',
  BUNDESLIGA: 'BUNDESLIGA',
  SERIEA: 'SERIEA',
  LIGUE1: 'LIGUE1',
  CHAMPIONSHIP: 'CHAMPIONSHIP',
  EREDIVISIE: 'EREDIVISIE',
  UCL: 'UCL',
  NFL: 'NFL',
  NHL: 'NHL',
  MLB: 'MLB',
  NRL: 'NRL',
  WNBA: 'WNBA',
  NWSL: 'NWSL',
  ALEAGUE: 'ALEAGUE',
  LIGAMX: 'LIGAMX',
  BRASILEIRAO: 'BRASILEIRAO',
};

export const SUPPORTED_LEAGUES = Object.values(LEAGUES);

export const LEAGUE_DISPLAY_NAMES = {
  NBA: 'NBA',
  EPL: 'Premier League',
  AFL: 'AFL',
  WC: 'World Cup',
  LALIGA: 'La Liga',
  BUNDESLIGA: 'Bundesliga',
  SERIEA: 'Serie A',
  LIGUE1: 'Ligue 1',
  CHAMPIONSHIP: 'Championship',
  EREDIVISIE: 'Eredivisie',
  UCL: 'Champions League',
  NFL: 'NFL',
  NHL: 'NHL',
  MLB: 'MLB',
  NRL: 'NRL',
  WNBA: 'WNBA',
  NWSL: 'NWSL',
  ALEAGUE: 'A-League',
  LIGAMX: 'Liga MX',
  BRASILEIRAO: 'Brasileirão',
};

// Short forms for tight spaces (e.g. the team logo strip's per-league sub-labels)
export const LEAGUE_ABBR = {
  NBA: 'NBA',
  EPL: 'EPL',
  AFL: 'AFL',
  WC: 'World Cup',
  LALIGA: 'La Liga',
  BUNDESLIGA: 'Bundesliga',
  SERIEA: 'Serie A',
  LIGUE1: 'Ligue 1',
  CHAMPIONSHIP: 'Championship',
  EREDIVISIE: 'Eredivisie',
  UCL: 'UCL',
  NFL: 'NFL',
  NHL: 'NHL',
  MLB: 'MLB',
  NRL: 'NRL',
  WNBA: 'WNBA',
  NWSL: 'NWSL',
  ALEAGUE: 'A-League',
  LIGAMX: 'Liga MX',
  BRASILEIRAO: 'Brasileirão',
};

// Groups the many soccer competitions under one heading; each other league is its own sport
export const SPORTS = {
  BASKETBALL: 'BASKETBALL',
  SOCCER: 'SOCCER',
  AFL: 'AFL',
  GRIDIRON: 'GRIDIRON',
  HOCKEY: 'HOCKEY',
  BASEBALL: 'BASEBALL',
  RUGBY_LEAGUE: 'RUGBY_LEAGUE',
};

export const LEAGUE_SPORT = {
  NBA: SPORTS.BASKETBALL,
  EPL: SPORTS.SOCCER,
  WC: SPORTS.SOCCER,
  LALIGA: SPORTS.SOCCER,
  BUNDESLIGA: SPORTS.SOCCER,
  SERIEA: SPORTS.SOCCER,
  LIGUE1: SPORTS.SOCCER,
  CHAMPIONSHIP: SPORTS.SOCCER,
  EREDIVISIE: SPORTS.SOCCER,
  UCL: SPORTS.SOCCER,
  AFL: SPORTS.AFL,
  NFL: SPORTS.GRIDIRON,
  NHL: SPORTS.HOCKEY,
  MLB: SPORTS.BASEBALL,
  NRL: SPORTS.RUGBY_LEAGUE,
  // Shares NBA's sport bucket rather than getting its own — same sport, same icon.
  WNBA: SPORTS.BASKETBALL,
  // All four share the soccer bucket with EPL/La Liga/etc. — same sport, same icon.
  NWSL: SPORTS.SOCCER,
  ALEAGUE: SPORTS.SOCCER,
  LIGAMX: SPORTS.SOCCER,
  BRASILEIRAO: SPORTS.SOCCER,
};

export const SPORT_DISPLAY_NAMES = {
  BASKETBALL: 'Basketball',
  SOCCER: 'Soccer',
  AFL: 'AFL',
  GRIDIRON: 'NFL',
  HOCKEY: 'NHL',
  BASEBALL: 'MLB',
  RUGBY_LEAGUE: 'NRL',
};
