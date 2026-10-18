export const teamsByLeague = {
  NBA: [
    { teamId: 'nba-atl', teamName: 'Atlanta Hawks' },
    { teamId: 'nba-bos', teamName: 'Boston Celtics' },
    { teamId: 'nba-bkn', teamName: 'Brooklyn Nets' },
    { teamId: 'nba-cha', teamName: 'Charlotte Hornets' },
    { teamId: 'nba-chi', teamName: 'Chicago Bulls' },
    { teamId: 'nba-cle', teamName: 'Cleveland Cavaliers' },
    { teamId: 'nba-dal', teamName: 'Dallas Mavericks' },
    { teamId: 'nba-den', teamName: 'Denver Nuggets' },
    { teamId: 'nba-det', teamName: 'Detroit Pistons' },
    { teamId: 'nba-gsw', teamName: 'Golden State Warriors' },
    { teamId: 'nba-hou', teamName: 'Houston Rockets' },
    { teamId: 'nba-ind', teamName: 'Indiana Pacers' },
    { teamId: 'nba-lac', teamName: 'LA Clippers' },
    { teamId: 'nba-lal', teamName: 'Los Angeles Lakers' },
    { teamId: 'nba-mem', teamName: 'Memphis Grizzlies' },
    { teamId: 'nba-mia', teamName: 'Miami Heat' },
    { teamId: 'nba-mil', teamName: 'Milwaukee Bucks' },
    { teamId: 'nba-min', teamName: 'Minnesota Timberwolves' },
    { teamId: 'nba-nop', teamName: 'New Orleans Pelicans' },
    { teamId: 'nba-nyk', teamName: 'New York Knicks' },
    { teamId: 'nba-okc', teamName: 'Oklahoma City Thunder' },
    { teamId: 'nba-orl', teamName: 'Orlando Magic' },
    { teamId: 'nba-phi', teamName: 'Philadelphia 76ers' },
    { teamId: 'nba-phx', teamName: 'Phoenix Suns' },
    { teamId: 'nba-por', teamName: 'Portland Trail Blazers' },
    { teamId: 'nba-sac', teamName: 'Sacramento Kings' },
    { teamId: 'nba-sas', teamName: 'San Antonio Spurs' },
    { teamId: 'nba-tor', teamName: 'Toronto Raptors' },
    { teamId: 'nba-uta', teamName: 'Utah Jazz' },
    { teamId: 'nba-was', teamName: 'Washington Wizards' },
  ],

  // Promotion/relegation means this roster needs a manual refresh each
  // season — see .claude/rules/sports-integration-notes.md for the full
  // audit (2026-10-09/11) that found this one (and 7 other football-data.org
  // leagues) had drifted. Verified live against football-data.org's current
  // PL roster before this edit, not assumed: Leicester City, Southampton,
  // West Ham United and Wolves are no longer in the Premier League (all
  // confirmed live in the Championship below instead — see that list's own
  // comment); Coventry City, Hull City, Leeds United and Sunderland are the
  // teams that replaced them. Every new entry's stored name was checked
  // against findFDTeam's actual matching logic before being added, not just
  // assumed plausible — see the Man Utd/Spurs/Nott'm Forest lesson earlier
  // in this file's own history.
  EPL: [
    { teamId: 'epl-ars', teamName: 'Arsenal' },
    { teamId: 'epl-avl', teamName: 'Aston Villa' },
    { teamId: 'epl-bou', teamName: 'Bournemouth' },
    { teamId: 'epl-bre', teamName: 'Brentford' },
    { teamId: 'epl-bha', teamName: 'Brighton' },
    { teamId: 'epl-che', teamName: 'Chelsea' },
    { teamId: 'epl-cov', teamName: 'Coventry City' },
    { teamId: 'epl-cry', teamName: 'Crystal Palace' },
    { teamId: 'epl-eve', teamName: 'Everton' },
    { teamId: 'epl-ful', teamName: 'Fulham' },
    { teamId: 'epl-hul', teamName: 'Hull City' },
    { teamId: 'epl-ips', teamName: 'Ipswich Town' },
    { teamId: 'epl-lee', teamName: 'Leeds United' },
    { teamId: 'epl-liv', teamName: 'Liverpool' },
    { teamId: 'epl-mci', teamName: 'Manchester City' },
    { teamId: 'epl-mun', teamName: 'Manchester United' },
    { teamId: 'epl-new', teamName: 'Newcastle United' },
    { teamId: 'epl-nfo', teamName: 'Nottingham Forest' },
    { teamId: 'epl-sun', teamName: 'Sunderland' },
    { teamId: 'epl-tot', teamName: 'Tottenham Hotspur' },
  ],

  AFL: [
    { teamId: 'afl-ade', teamName: 'Adelaide Crows' },
    { teamId: 'afl-bri', teamName: 'Brisbane Lions' },
    { teamId: 'afl-car', teamName: 'Carlton' },
    { teamId: 'afl-col', teamName: 'Collingwood' },
    { teamId: 'afl-ess', teamName: 'Essendon' },
    { teamId: 'afl-fre', teamName: 'Fremantle' },
    { teamId: 'afl-gee', teamName: 'Geelong' },
    { teamId: 'afl-gcs', teamName: 'Gold Coast Suns' },
    { teamId: 'afl-gws', teamName: 'GWS Giants' },
    { teamId: 'afl-haw', teamName: 'Hawthorn' },
    { teamId: 'afl-mel', teamName: 'Melbourne' },
    { teamId: 'afl-nmf', teamName: 'North Melbourne' },
    { teamId: 'afl-por', teamName: 'Port Adelaide' },
    { teamId: 'afl-ric', teamName: 'Richmond' },
    { teamId: 'afl-stk', teamName: 'St Kilda' },
    { teamId: 'afl-syd', teamName: 'Sydney Swans' },
    { teamId: 'afl-wce', teamName: 'West Coast Eagles' },
    { teamId: 'afl-wbd', teamName: 'Western Bulldogs' },
  ],

  WC: [
    { teamId: 'wc-arg', teamName: 'Argentina' },
    { teamId: 'wc-aus', teamName: 'Australia' },
    { teamId: 'wc-aut', teamName: 'Austria' },
    { teamId: 'wc-bel', teamName: 'Belgium' },
    { teamId: 'wc-bra', teamName: 'Brazil' },
    { teamId: 'wc-can', teamName: 'Canada' },
    { teamId: 'wc-cmr', teamName: 'Cameroon' },
    { teamId: 'wc-col', teamName: 'Colombia' },
    { teamId: 'wc-cri', teamName: 'Costa Rica' },
    { teamId: 'wc-cro', teamName: 'Croatia' },
    { teamId: 'wc-den', teamName: 'Denmark' },
    { teamId: 'wc-ecu', teamName: 'Ecuador' },
    { teamId: 'wc-egy', teamName: 'Egypt' },
    { teamId: 'wc-eng', teamName: 'England' },
    { teamId: 'wc-fra', teamName: 'France' },
    { teamId: 'wc-ger', teamName: 'Germany' },
    { teamId: 'wc-gha', teamName: 'Ghana' },
    { teamId: 'wc-hun', teamName: 'Hungary' },
    { teamId: 'wc-irn', teamName: 'Iran' },
    { teamId: 'wc-ita', teamName: 'Italy' },
    { teamId: 'wc-jam', teamName: 'Jamaica' },
    { teamId: 'wc-jpn', teamName: 'Japan' },
    { teamId: 'wc-kor', teamName: 'South Korea' },
    { teamId: 'wc-mar', teamName: 'Morocco' },
    { teamId: 'wc-mex', teamName: 'Mexico' },
    { teamId: 'wc-ned', teamName: 'Netherlands' },
    { teamId: 'wc-nga', teamName: 'Nigeria' },
    { teamId: 'wc-pan', teamName: 'Panama' },
    { teamId: 'wc-pol', teamName: 'Poland' },
    { teamId: 'wc-por', teamName: 'Portugal' },
    { teamId: 'wc-sau', teamName: 'Saudi Arabia' },
    { teamId: 'wc-sco', teamName: 'Scotland' },
    { teamId: 'wc-sen', teamName: 'Senegal' },
    { teamId: 'wc-srb', teamName: 'Serbia' },
    { teamId: 'wc-esp', teamName: 'Spain' },
    { teamId: 'wc-sui', teamName: 'Switzerland' },
    { teamId: 'wc-tur', teamName: 'Turkey' },
    { teamId: 'wc-usa', teamName: 'USA' },
    { teamId: 'wc-uru', teamName: 'Uruguay' },
    { teamId: 'wc-ven', teamName: 'Venezuela' },
  ],

  // Same yearly-refresh need as EPL/Championship — see that comment block
  // and sports-integration-notes.md for the full promotion/relegation audit
  // (2026-10-09/12). Verified live against football-data.org's current PD
  // roster before this edit. Girona, Mallorca, Las Palmas, Leganés and
  // Valladolid are no longer in La Liga (no Spanish second division is
  // tracked by this app, so they're removed outright, same as EPL's
  // Leicester/Oxford/Sheffield Wednesday situation); Elche CF, Levante UD,
  // Málaga CF, RC Deportivo La Coruña and Real Racing Club de Santander are
  // this season's actual replacements. Every new entry's stored name was
  // checked against findFDTeam's actual matching logic before being added.
  LALIGA: [
    { teamId: 'lla-rma', teamName: 'Real Madrid' },
    { teamId: 'lla-bar', teamName: 'Barcelona' },
    { teamId: 'lla-atm', teamName: 'Atletico Madrid' },
    { teamId: 'lla-ath', teamName: 'Athletic Club' },
    { teamId: 'lla-vil', teamName: 'Villarreal' },
    { teamId: 'lla-rso', teamName: 'Real Sociedad' },
    { teamId: 'lla-sev', teamName: 'Sevilla' },
    { teamId: 'lla-bet', teamName: 'Real Betis' },
    { teamId: 'lla-val', teamName: 'Valencia' },
    { teamId: 'lla-osa', teamName: 'Osasuna' },
    { teamId: 'lla-cel', teamName: 'Celta Vigo' },
    { teamId: 'lla-ray', teamName: 'Rayo Vallecano' },
    { teamId: 'lla-get', teamName: 'Getafe' },
    { teamId: 'lla-ala', teamName: 'Alaves' },
    { teamId: 'lla-esp', teamName: 'Espanyol' },
    { teamId: 'lla-mga', teamName: 'Malaga' },
    { teamId: 'lla-lev', teamName: 'Levante' },
    { teamId: 'lla-elc', teamName: 'Elche' },
    { teamId: 'lla-dep', teamName: 'Deportivo La Coruna' },
    { teamId: 'lla-rac', teamName: 'Racing Santander' },
  ],

  // Same yearly-refresh need as EPL/Championship/La Liga — see those comment
  // blocks and sports-integration-notes.md for the full promotion/relegation
  // audit. Verified live against football-data.org's current BL1 team list
  // AND standings (both agree, 18 rows each) before this edit. VfL Wolfsburg,
  // Heidenheim, VfL Bochum, St. Pauli and Holstein Kiel are no longer in the
  // Bundesliga (no German second division is tracked by this app, so
  // they're removed outright); 1. FC Köln, FC Schalke 04, Hamburger SV, SC
  // Paderborn 07 and SV 07 Elversberg are this season's actual replacements.
  // Every new entry's stored name was checked against findFDTeam's actual
  // matching logic before being added.
  BUNDESLIGA: [
    { teamId: 'bun-bay', teamName: 'Bayern Munich' },
    { teamId: 'bun-bvb', teamName: 'Borussia Dortmund' },
    { teamId: 'bun-b04', teamName: 'Bayer Leverkusen' },
    { teamId: 'bun-rbl', teamName: 'RB Leipzig' },
    { teamId: 'bun-sge', teamName: 'Eintracht Frankfurt' },
    { teamId: 'bun-vfb', teamName: 'VfB Stuttgart' },
    { teamId: 'bun-bmg', teamName: 'Borussia Mönchengladbach' },
    { teamId: 'bun-scf', teamName: 'SC Freiburg' },
    { teamId: 'bun-tsg', teamName: 'Hoffenheim' },
    { teamId: 'bun-fca', teamName: 'FC Augsburg' },
    { teamId: 'bun-wer', teamName: 'Werder Bremen' },
    { teamId: 'bun-fcu', teamName: 'Union Berlin' },
    { teamId: 'bun-m05', teamName: 'Mainz 05' },
    { teamId: 'bun-koe', teamName: 'FC Koln' },
    { teamId: 'bun-s04', teamName: 'Schalke 04' },
    { teamId: 'bun-hsv', teamName: 'Hamburger SV' },
    { teamId: 'bun-scp', teamName: 'SC Paderborn' },
    { teamId: 'bun-elv', teamName: 'Elversberg' },
  ],

  // Same yearly-refresh need as EPL/Championship/La Liga/Bundesliga — see
  // those comment blocks and sports-integration-notes.md for the full
  // promotion/relegation audit. Verified live against football-data.org's
  // current SA standings before this edit. Empoli and Verona are no longer
  // in Serie A (no Italian second division is tracked by this app, so
  // they're removed outright); Frosinone and Sassuolo are this season's
  // actual replacements. Both checked against findFDTeam's actual matching
  // logic before being added.
  SERIEA: [
    { teamId: 'ser-int', teamName: 'Inter Milan' },
    { teamId: 'ser-acm', teamName: 'AC Milan' },
    { teamId: 'ser-juv', teamName: 'Juventus' },
    { teamId: 'ser-nap', teamName: 'Napoli' },
    { teamId: 'ser-rom', teamName: 'Roma' },
    { teamId: 'ser-laz', teamName: 'Lazio' },
    { teamId: 'ser-ata', teamName: 'Atalanta' },
    { teamId: 'ser-fio', teamName: 'Fiorentina' },
    { teamId: 'ser-tor', teamName: 'Torino' },
    { teamId: 'ser-bol', teamName: 'Bologna' },
    { teamId: 'ser-udi', teamName: 'Udinese' },
    { teamId: 'ser-cag', teamName: 'Cagliari' },
    { teamId: 'ser-mon', teamName: 'Monza' },
    { teamId: 'ser-gen', teamName: 'Genoa' },
    { teamId: 'ser-lec', teamName: 'Lecce' },
    { teamId: 'ser-com', teamName: 'Como' },
    { teamId: 'ser-par', teamName: 'Parma' },
    { teamId: 'ser-ven', teamName: 'Venezia' },
    { teamId: 'ser-fro', teamName: 'Frosinone' },
    { teamId: 'ser-sas', teamName: 'Sassuolo' },
  ],

  // Same yearly-refresh need as EPL/Championship/La Liga/Bundesliga/Serie A
  // — see those comment blocks and sports-integration-notes.md for the full
  // promotion/relegation audit. Verified live against football-data.org's
  // current FL1 standings before this edit. Reims, Montpellier, Nantes and
  // Saint-Etienne are no longer in Ligue 1 (no French second division is
  // tracked by this app, so they're removed outright); Paris FC, Lorient,
  // Le Mans and Troyes are this season's actual replacements. Also fixed a
  // pre-existing matching bug found during this audit: the stored "Rennes"
  // never matched findFDTeam at all (real name "Stade Rennais FC 1901",
  // shortName "Stade Rennais" — "Rennes" fails all three of its
  // conditions, since the real name says "Rennais" not "Rennes") — renamed
  // to "Stade Rennais" (exact shortName match). Every new/renamed entry's
  // stored name was checked against findFDTeam's actual matching logic
  // before being added.
  LIGUE1: [
    { teamId: 'l1-psg', teamName: 'Paris Saint-Germain' },
    { teamId: 'l1-mon', teamName: 'Monaco' },
    { teamId: 'l1-lil', teamName: 'Lille' },
    { teamId: 'l1-ol',  teamName: 'Lyon' },
    { teamId: 'l1-ogc', teamName: 'Nice' },
    { teamId: 'l1-rcl', teamName: 'Lens' },
    { teamId: 'l1-ren', teamName: 'Stade Rennais' },
    { teamId: 'l1-om',  teamName: 'Marseille' },
    { teamId: 'l1-tfc', teamName: 'Toulouse' },
    { teamId: 'l1-rcsa',teamName: 'Strasbourg' },
    { teamId: 'l1-sbb', teamName: 'Brest' },
    { teamId: 'l1-auxi',teamName: 'Auxerre' },
    { teamId: 'l1-ang', teamName: 'Angers' },
    { teamId: 'l1-hac', teamName: 'Le Havre' },
    { teamId: 'l1-pfc', teamName: 'Paris FC' },
    { teamId: 'l1-lor', teamName: 'Lorient' },
    { teamId: 'l1-lma', teamName: 'Le Mans' },
    { teamId: 'l1-tro', teamName: 'Troyes' },
  ],

  // Same yearly-refresh need as EPL above — verified live against
  // football-data.org's current ELC roster before this edit. Oxford United,
  // Leicester City and Sheffield Wednesday are no longer in the
  // Championship (nor the Premier League — confirmed against both; they've
  // dropped to a tier this app doesn't track at all, the same way a real
  // League Two side can fall out of the whole EFL). Coventry City, Ipswich
  // Town and Hull City moved up to the Premier League (see that list
  // above); Bolton Wanderers, Burnley, Cardiff City, Lincoln City, West Ham
  // United and Wolverhampton Wanderers are this season's actual Championship
  // clubs that replace all six. "Wolves" (the old EPL short name) isn't
  // used here — it doesn't match football-data.org's name for this club at
  // all (no override exists for it, unlike the fixed PL overrides earlier
  // in this file's history), so the full "Wolverhampton Wanderers" is used
  // instead, checked live against findFDTeam's actual matching logic.
  CHAMPIONSHIP: [
    { teamId: 'cha-mil', teamName: 'Millwall' },
    { teamId: 'cha-sou', teamName: 'Southampton' },
    { teamId: 'cha-mid', teamName: 'Middlesbrough' },
    { teamId: 'cha-wre', teamName: 'Wrexham' },
    { teamId: 'cha-der', teamName: 'Derby County' },
    { teamId: 'cha-nor', teamName: 'Norwich City' },
    { teamId: 'cha-bir', teamName: 'Birmingham City' },
    { teamId: 'cha-swa', teamName: 'Swansea City' },
    { teamId: 'cha-bri', teamName: 'Bristol City' },
    { teamId: 'cha-shu', teamName: 'Sheffield United' },
    { teamId: 'cha-pre', teamName: 'Preston North End' },
    { teamId: 'cha-qpr', teamName: 'Queens Park Rangers' },
    { teamId: 'cha-wat', teamName: 'Watford' },
    { teamId: 'cha-sto', teamName: 'Stoke City' },
    { teamId: 'cha-por', teamName: 'Portsmouth' },
    { teamId: 'cha-chr', teamName: 'Charlton Athletic' },
    { teamId: 'cha-bla', teamName: 'Blackburn Rovers' },
    { teamId: 'cha-wba', teamName: 'West Bromwich Albion' },
    { teamId: 'cha-bol', teamName: 'Bolton Wanderers' },
    { teamId: 'cha-bur', teamName: 'Burnley' },
    { teamId: 'cha-car', teamName: 'Cardiff City' },
    { teamId: 'cha-lin', teamName: 'Lincoln City' },
    { teamId: 'cha-whu', teamName: 'West Ham United' },
    { teamId: 'cha-wol', teamName: 'Wolverhampton Wanderers' },
  ],

  EREDIVISIE: [
    { teamId: 'ere-ajx', teamName: 'Ajax' },
    { teamId: 'ere-psv', teamName: 'PSV' },
    { teamId: 'ere-fey', teamName: 'Feyenoord' },
    { teamId: 'ere-az',  teamName: 'AZ' },
    { teamId: 'ere-twe', teamName: 'FC Twente' },
    { teamId: 'ere-utr', teamName: 'FC Utrecht' },
    { teamId: 'ere-gae', teamName: 'Go Ahead Eagles' },
    { teamId: 'ere-hee', teamName: 'SC Heerenveen' },
    { teamId: 'ere-spa', teamName: 'Sparta Rotterdam' },
    { teamId: 'ere-for', teamName: 'Fortuna Sittard' },
    { teamId: 'ere-nec', teamName: 'NEC Nijmegen' },
    { teamId: 'ere-pec', teamName: 'PEC Zwolle' },
    { teamId: 'ere-gro', teamName: 'FC Groningen' },
    { teamId: 'ere-cam', teamName: 'SC Cambuur' },
    { teamId: 'ere-wil', teamName: 'Willem II' },
    { teamId: 'ere-tel', teamName: 'Telstar' },
    { teamId: 'ere-ado', teamName: 'ADO Den Haag' },
    { teamId: 'ere-exc', teamName: 'Excelsior Rotterdam' },
  ],

  // UCL is structurally different from the other football-data.org leagues
  // above: its 36-club league-phase roster changes completely every season
  // (no promotion/relegation pattern, just a fresh draw), so this needs a
  // full re-derivation from the live standings each time, not an
  // incremental diff. Verified live against football-data.org's current CL
  // /teams endpoint (confirmed it now exactly matches /standings — 36 for
  // 36, zero discrepancy — unlike the "includes qualifying-only clubs"
  // problem assumed here previously, which was apparently never actually
  // re-checked against live data). 18 of the 36 previously-stored clubs are
  // no longer in this season's competition and are removed outright: Bayer
  // Leverkusen, Chelsea, Juventus, Atalanta, Benfica, Athletic Club,
  // Tottenham Hotspur, Newcastle United, Marseille, Monaco, Ajax,
  // Copenhagen, Olympiacos, Union Saint-Gilloise, Qarabag, Kairat Almaty,
  // Pafos, Eintracht Frankfurt. Replaced by this season's actual 18: VfB
  // Stuttgart, Aston Villa, Manchester United, Real Betis, Roma, FC Porto,
  // Lille, Lens, Fenerbahce, Feyenoord, RB Leipzig, Shakhtar Donetsk, AEK,
  // LASK Linz, Viking, Como, Slovan Bratislava, Sabah FK.
  //
  // Also fixed a real matching bug on an unrelated, still-present entry:
  // "Bodo/Glimt" (plain ASCII o) never matched findFDTeam at all — the
  // real club is "FK Bodø/Glimt", and unlike é/í/ö (which fold() handles by
  // NFD-decomposing into base+combining-mark and stripping the mark), ø is
  // its own distinct Unicode letter with no decomposition, so fold() can't
  // normalise "ø" to "o". Storing the real accented spelling fixes the
  // match directly without needing to touch fold() itself.
  //
  // Every current and new name here was checked against findFDTeam's
  // actual matching logic before being added, and the complete 36-entry
  // list was validated together for collisions (confirmed: 36 distinct
  // real teams, zero collisions, full coverage of the real 36-club field).
  UCL: [
    { teamId: 'ucl-rma', teamName: 'Real Madrid' },
    { teamId: 'ucl-bar', teamName: 'Barcelona' },
    { teamId: 'ucl-bay', teamName: 'Bayern Munich' },
    { teamId: 'ucl-mci', teamName: 'Manchester City' },
    { teamId: 'ucl-liv', teamName: 'Liverpool' },
    { teamId: 'ucl-ars', teamName: 'Arsenal' },
    { teamId: 'ucl-psg', teamName: 'Paris Saint-Germain' },
    { teamId: 'ucl-int', teamName: 'Inter Milan' },
    { teamId: 'ucl-bvb', teamName: 'Borussia Dortmund' },
    { teamId: 'ucl-atm', teamName: 'Atletico Madrid' },
    { teamId: 'ucl-nap', teamName: 'Napoli' },
    { teamId: 'ucl-spo', teamName: 'Sporting CP' },
    { teamId: 'ucl-vil', teamName: 'Villarreal' },
    { teamId: 'ucl-clb', teamName: 'Club Brugge' },
    { teamId: 'ucl-psv', teamName: 'PSV' },
    { teamId: 'ucl-gal', teamName: 'Galatasaray' },
    { teamId: 'ucl-slp', teamName: 'Slavia Praha' },
    { teamId: 'ucl-bod', teamName: 'Bodø/Glimt' },
    { teamId: 'ucl-vfb', teamName: 'VfB Stuttgart' },
    { teamId: 'ucl-avl', teamName: 'Aston Villa' },
    { teamId: 'ucl-mun', teamName: 'Manchester United' },
    { teamId: 'ucl-bet', teamName: 'Real Betis' },
    { teamId: 'ucl-rom', teamName: 'Roma' },
    { teamId: 'ucl-por', teamName: 'FC Porto' },
    { teamId: 'ucl-lil', teamName: 'Lille' },
    { teamId: 'ucl-rcl', teamName: 'Lens' },
    { teamId: 'ucl-fen', teamName: 'Fenerbahce' },
    { teamId: 'ucl-fey', teamName: 'Feyenoord' },
    { teamId: 'ucl-rbl', teamName: 'RB Leipzig' },
    { teamId: 'ucl-shk', teamName: 'Shakhtar Donetsk' },
    { teamId: 'ucl-aek', teamName: 'AEK' },
    { teamId: 'ucl-lask',teamName: 'LASK Linz' },
    { teamId: 'ucl-vik', teamName: 'Viking' },
    { teamId: 'ucl-com', teamName: 'Como' },
    { teamId: 'ucl-slb', teamName: 'Slovan Bratislava' },
    { teamId: 'ucl-sab', teamName: 'Sabah FK' },
  ],

  NFL: [
    { teamId: 'nfl-ari', teamName: 'Arizona Cardinals' },
    { teamId: 'nfl-atl', teamName: 'Atlanta Falcons' },
    { teamId: 'nfl-bal', teamName: 'Baltimore Ravens' },
    { teamId: 'nfl-buf', teamName: 'Buffalo Bills' },
    { teamId: 'nfl-car', teamName: 'Carolina Panthers' },
    { teamId: 'nfl-chi', teamName: 'Chicago Bears' },
    { teamId: 'nfl-cin', teamName: 'Cincinnati Bengals' },
    { teamId: 'nfl-cle', teamName: 'Cleveland Browns' },
    { teamId: 'nfl-dal', teamName: 'Dallas Cowboys' },
    { teamId: 'nfl-den', teamName: 'Denver Broncos' },
    { teamId: 'nfl-det', teamName: 'Detroit Lions' },
    { teamId: 'nfl-gb',  teamName: 'Green Bay Packers' },
    { teamId: 'nfl-hou', teamName: 'Houston Texans' },
    { teamId: 'nfl-ind', teamName: 'Indianapolis Colts' },
    { teamId: 'nfl-jax', teamName: 'Jacksonville Jaguars' },
    { teamId: 'nfl-kc',  teamName: 'Kansas City Chiefs' },
    { teamId: 'nfl-lac', teamName: 'Los Angeles Chargers' },
    { teamId: 'nfl-lar', teamName: 'Los Angeles Rams' },
    { teamId: 'nfl-lv',  teamName: 'Las Vegas Raiders' },
    { teamId: 'nfl-mia', teamName: 'Miami Dolphins' },
    { teamId: 'nfl-min', teamName: 'Minnesota Vikings' },
    { teamId: 'nfl-ne',  teamName: 'New England Patriots' },
    { teamId: 'nfl-no',  teamName: 'New Orleans Saints' },
    { teamId: 'nfl-nyg', teamName: 'New York Giants' },
    { teamId: 'nfl-nyj', teamName: 'New York Jets' },
    { teamId: 'nfl-phi', teamName: 'Philadelphia Eagles' },
    { teamId: 'nfl-pit', teamName: 'Pittsburgh Steelers' },
    { teamId: 'nfl-sea', teamName: 'Seattle Seahawks' },
    { teamId: 'nfl-sf',  teamName: 'San Francisco 49ers' },
    { teamId: 'nfl-tb',  teamName: 'Tampa Bay Buccaneers' },
    { teamId: 'nfl-ten', teamName: 'Tennessee Titans' },
    { teamId: 'nfl-wsh', teamName: 'Washington Commanders' },
  ],

  NHL: [
    { teamId: 'nhl-ana', teamName: 'Anaheim Ducks' },
    { teamId: 'nhl-bos', teamName: 'Boston Bruins' },
    { teamId: 'nhl-buf', teamName: 'Buffalo Sabres' },
    { teamId: 'nhl-cgy', teamName: 'Calgary Flames' },
    { teamId: 'nhl-car', teamName: 'Carolina Hurricanes' },
    { teamId: 'nhl-chi', teamName: 'Chicago Blackhawks' },
    { teamId: 'nhl-col', teamName: 'Colorado Avalanche' },
    { teamId: 'nhl-cbj', teamName: 'Columbus Blue Jackets' },
    { teamId: 'nhl-dal', teamName: 'Dallas Stars' },
    { teamId: 'nhl-det', teamName: 'Detroit Red Wings' },
    { teamId: 'nhl-edm', teamName: 'Edmonton Oilers' },
    { teamId: 'nhl-fla', teamName: 'Florida Panthers' },
    { teamId: 'nhl-la',  teamName: 'Los Angeles Kings' },
    { teamId: 'nhl-min', teamName: 'Minnesota Wild' },
    { teamId: 'nhl-mtl', teamName: 'Montreal Canadiens' },
    { teamId: 'nhl-nsh', teamName: 'Nashville Predators' },
    { teamId: 'nhl-nj',  teamName: 'New Jersey Devils' },
    { teamId: 'nhl-nyi', teamName: 'New York Islanders' },
    { teamId: 'nhl-nyr', teamName: 'New York Rangers' },
    { teamId: 'nhl-ott', teamName: 'Ottawa Senators' },
    { teamId: 'nhl-phi', teamName: 'Philadelphia Flyers' },
    { teamId: 'nhl-pit', teamName: 'Pittsburgh Penguins' },
    { teamId: 'nhl-sj',  teamName: 'San Jose Sharks' },
    { teamId: 'nhl-sea', teamName: 'Seattle Kraken' },
    { teamId: 'nhl-stl', teamName: 'St. Louis Blues' },
    { teamId: 'nhl-tb',  teamName: 'Tampa Bay Lightning' },
    { teamId: 'nhl-tor', teamName: 'Toronto Maple Leafs' },
    { teamId: 'nhl-utah', teamName: 'Utah Mammoth' },
    { teamId: 'nhl-van', teamName: 'Vancouver Canucks' },
    { teamId: 'nhl-vgk', teamName: 'Vegas Golden Knights' },
    { teamId: 'nhl-wsh', teamName: 'Washington Capitals' },
    { teamId: 'nhl-wpg', teamName: 'Winnipeg Jets' },
  ],

  MLB: [
    { teamId: 'mlb-ari', teamName: 'Arizona Diamondbacks' },
    { teamId: 'mlb-atl', teamName: 'Atlanta Braves' },
    { teamId: 'mlb-bal', teamName: 'Baltimore Orioles' },
    { teamId: 'mlb-bos', teamName: 'Boston Red Sox' },
    { teamId: 'mlb-chc', teamName: 'Chicago Cubs' },
    { teamId: 'mlb-cws', teamName: 'Chicago White Sox' },
    { teamId: 'mlb-cin', teamName: 'Cincinnati Reds' },
    { teamId: 'mlb-cle', teamName: 'Cleveland Guardians' },
    { teamId: 'mlb-col', teamName: 'Colorado Rockies' },
    { teamId: 'mlb-det', teamName: 'Detroit Tigers' },
    { teamId: 'mlb-hou', teamName: 'Houston Astros' },
    { teamId: 'mlb-kc',  teamName: 'Kansas City Royals' },
    { teamId: 'mlb-laa', teamName: 'Los Angeles Angels' },
    { teamId: 'mlb-lad', teamName: 'Los Angeles Dodgers' },
    { teamId: 'mlb-mia', teamName: 'Miami Marlins' },
    { teamId: 'mlb-mil', teamName: 'Milwaukee Brewers' },
    { teamId: 'mlb-min', teamName: 'Minnesota Twins' },
    { teamId: 'mlb-nym', teamName: 'New York Mets' },
    { teamId: 'mlb-nyy', teamName: 'New York Yankees' },
    { teamId: 'mlb-ath', teamName: 'Athletics' },
    { teamId: 'mlb-phi', teamName: 'Philadelphia Phillies' },
    { teamId: 'mlb-pit', teamName: 'Pittsburgh Pirates' },
    { teamId: 'mlb-sd',  teamName: 'San Diego Padres' },
    { teamId: 'mlb-sf',  teamName: 'San Francisco Giants' },
    { teamId: 'mlb-sea', teamName: 'Seattle Mariners' },
    { teamId: 'mlb-stl', teamName: 'St. Louis Cardinals' },
    { teamId: 'mlb-tb',  teamName: 'Tampa Bay Rays' },
    { teamId: 'mlb-tex', teamName: 'Texas Rangers' },
    { teamId: 'mlb-tor', teamName: 'Toronto Blue Jays' },
    { teamId: 'mlb-wsh', teamName: 'Washington Nationals' },
  ],

  // Our own abbreviations, not verified against ESPN's — espnTeamSportService
  // falls back to matching by team name when they don't line up (same
  // approach already used for AFL; see findTeamByName in that file).
  NRL: [
    { teamId: 'nrl-bri', teamName: 'Brisbane Broncos' },
    { teamId: 'nrl-cby', teamName: 'Canterbury-Bankstown Bulldogs' },
    { teamId: 'nrl-cbr', teamName: 'Canberra Raiders' },
    { teamId: 'nrl-cro', teamName: 'Cronulla-Sutherland Sharks' },
    { teamId: 'nrl-dol', teamName: 'Dolphins' },
    { teamId: 'nrl-gct', teamName: 'Gold Coast Titans' },
    { teamId: 'nrl-man', teamName: 'Manly Warringah Sea Eagles' },
    { teamId: 'nrl-mel', teamName: 'Melbourne Storm' },
    { teamId: 'nrl-nzw', teamName: 'New Zealand Warriors' },
    { teamId: 'nrl-new', teamName: 'Newcastle Knights' },
    { teamId: 'nrl-nql', teamName: 'North Queensland Cowboys' },
    { teamId: 'nrl-par', teamName: 'Parramatta Eels' },
    { teamId: 'nrl-pen', teamName: 'Penrith Panthers' },
    { teamId: 'nrl-sou', teamName: 'South Sydney Rabbitohs' },
    { teamId: 'nrl-stg', teamName: 'St George Illawarra Dragons' },
    { teamId: 'nrl-syd', teamName: 'Sydney Roosters' },
    { teamId: 'nrl-wst', teamName: 'Wests Tigers' },
  ],

  // Abbreviations deliberately match ESPN's own (verified against the live
  // API), unlike NRL above — so these resolve on the first abbreviation
  // lookup rather than needing the name-based fallback.
  WNBA: [
    { teamId: 'wnba-atl', teamName: 'Atlanta Dream' },
    { teamId: 'wnba-chi', teamName: 'Chicago Sky' },
    { teamId: 'wnba-con', teamName: 'Connecticut Sun' },
    { teamId: 'wnba-dal', teamName: 'Dallas Wings' },
    { teamId: 'wnba-gs',  teamName: 'Golden State Valkyries' },
    { teamId: 'wnba-ind', teamName: 'Indiana Fever' },
    { teamId: 'wnba-lv',  teamName: 'Las Vegas Aces' },
    { teamId: 'wnba-la',  teamName: 'Los Angeles Sparks' },
    { teamId: 'wnba-min', teamName: 'Minnesota Lynx' },
    { teamId: 'wnba-ny',  teamName: 'New York Liberty' },
    { teamId: 'wnba-phx', teamName: 'Phoenix Mercury' },
    { teamId: 'wnba-por', teamName: 'Portland Fire' },
    { teamId: 'wnba-sea', teamName: 'Seattle Storm' },
    { teamId: 'wnba-tor', teamName: 'Toronto Tempo' },
    { teamId: 'wnba-wsh', teamName: 'Washington Mystics' },
  ],

  // Abbreviations match ESPN's own, same as WNBA — though for NWSL it barely
  // matters, since its logos are id-keyed rather than abbreviation-keyed
  // anyway (see espnTeamSportService's LOGO_ID_PATH_OVERRIDES).
  NWSL: [
    { teamId: 'nwsl-la',  teamName: 'Angel City FC' },
    { teamId: 'nwsl-bay', teamName: 'Bay FC' },
    { teamId: 'nwsl-bos', teamName: 'Boston Legacy FC' },
    { teamId: 'nwsl-chi', teamName: 'Chicago Stars FC' },
    { teamId: 'nwsl-den', teamName: 'Denver Summit FC' },
    { teamId: 'nwsl-gfc', teamName: 'Gotham FC' },
    { teamId: 'nwsl-hou', teamName: 'Houston Dash' },
    { teamId: 'nwsl-kc',  teamName: 'Kansas City Current' },
    { teamId: 'nwsl-nc',  teamName: 'North Carolina Courage' },
    { teamId: 'nwsl-orl', teamName: 'Orlando Pride' },
    { teamId: 'nwsl-por', teamName: 'Portland Thorns FC' },
    { teamId: 'nwsl-lou', teamName: 'Racing Louisville FC' },
    { teamId: 'nwsl-sd',  teamName: 'San Diego Wave FC' },
    { teamId: 'nwsl-sea', teamName: 'Seattle Reign FC' },
    { teamId: 'nwsl-uta', teamName: 'Utah Royals' },
    { teamId: 'nwsl-was', teamName: 'Washington Spirit' },
  ],

  // Same id-keyed logo scheme as NWSL — abbreviations here are ESPN's own too.
  ALEAGUE: [
    { teamId: 'aleague-ade', teamName: 'Adelaide United' },
    { teamId: 'aleague-afc', teamName: 'Auckland FC' },
    { teamId: 'aleague-brr', teamName: 'Brisbane Roar' },
    { teamId: 'aleague-ccm', teamName: 'Central Coast Mariners' },
    { teamId: 'aleague-mac', teamName: 'Macarthur FC' },
    { teamId: 'aleague-mcy', teamName: 'Melbourne City FC' },
    { teamId: 'aleague-mvc', teamName: 'Melbourne Victory' },
    { teamId: 'aleague-new', teamName: 'Newcastle Jets' },
    { teamId: 'aleague-per', teamName: 'Perth Glory' },
    { teamId: 'aleague-syd', teamName: 'Sydney FC' },
    { teamId: 'aleague-wel', teamName: 'Wellington Phoenix FC' },
    { teamId: 'aleague-wsw', teamName: 'Western Sydney Wanderers' },
  ],

  // Same id-keyed logo scheme as NWSL/A-League — abbreviations here are
  // ESPN's own too, though it matters less than for abbreviation-keyed
  // leagues since the logo lookup doesn't depend on them matching.
  LIGAMX: [
    { teamId: 'ligamx-ame', teamName: 'América' },
    { teamId: 'ligamx-atl', teamName: 'Atlante' },
    { teamId: 'ligamx-ats', teamName: 'Atlas' },
    { teamId: 'ligamx-asl', teamName: 'Atlético de San Luis' },
    { teamId: 'ligamx-caz', teamName: 'Cruz Azul' },
    { teamId: 'ligamx-jua', teamName: 'FC Juárez' },
    { teamId: 'ligamx-gdl', teamName: 'Guadalajara' },
    { teamId: 'ligamx-leo', teamName: 'León' },
    { teamId: 'ligamx-mty', teamName: 'Monterrey' },
    { teamId: 'ligamx-ncx', teamName: 'Necaxa' },
    { teamId: 'ligamx-pac', teamName: 'Pachuca' },
    { teamId: 'ligamx-pue', teamName: 'Puebla' },
    { teamId: 'ligamx-unam', teamName: 'Pumas UNAM' },
    { teamId: 'ligamx-qro', teamName: 'Querétaro' },
    { teamId: 'ligamx-san', teamName: 'Santos Laguna' },
    { teamId: 'ligamx-uanl', teamName: 'Tigres UANL' },
    { teamId: 'ligamx-tij', teamName: 'Tijuana' },
    { teamId: 'ligamx-tol', teamName: 'Toluca' },
  ],

  BRASILEIRAO: [
    { teamId: 'brasileirao-cap', teamName: 'Athletico-PR' },
    { teamId: 'brasileirao-cam', teamName: 'Atlético-MG' },
    { teamId: 'brasileirao-bah', teamName: 'Bahia' },
    { teamId: 'brasileirao-bot', teamName: 'Botafogo' },
    { teamId: 'brasileirao-cha', teamName: 'Chapecoense' },
    { teamId: 'brasileirao-cor', teamName: 'Corinthians' },
    { teamId: 'brasileirao-cfc', teamName: 'Coritiba' },
    { teamId: 'brasileirao-cru', teamName: 'Cruzeiro' },
    { teamId: 'brasileirao-fla', teamName: 'Flamengo' },
    { teamId: 'brasileirao-flu', teamName: 'Fluminense' },
    { teamId: 'brasileirao-gre', teamName: 'Grêmio' },
    { teamId: 'brasileirao-int', teamName: 'Internacional' },
    { teamId: 'brasileirao-mir', teamName: 'Mirassol' },
    { teamId: 'brasileirao-pal', teamName: 'Palmeiras' },
    { teamId: 'brasileirao-rbb', teamName: 'Red Bull Bragantino' },
    { teamId: 'brasileirao-rem', teamName: 'Remo' },
    { teamId: 'brasileirao-san', teamName: 'Santos' },
    { teamId: 'brasileirao-sao', teamName: 'São Paulo' },
    { teamId: 'brasileirao-vas', teamName: 'Vasco da Gama' },
    { teamId: 'brasileirao-vit', teamName: 'Vitória' },
  ],

  // Largest roster added so far (30 clubs). Two ESPN entries share the
  // literal abbreviation "RIV" — Independiente Rivadavia and River Plate —
  // handled deliberately: Independiente Rivadavia keeps "riv" (matches
  // ESPN's own abbreviation and happens to resolve to itself, since it's
  // the first "RIV" in ESPN's own team list), while River Plate gets a
  // distinct abbreviation ESPN doesn't use, forcing it through
  // espnTeamSportService's name-based fallback instead — which is safe for
  // "River Plate" (no other club's name collides with it) but would NOT be
  // safe for Independiente Rivadavia, whose name contains the separate club
  // "Independiente" as a substring. See that service's tests for the
  // reasoning in full.
  ARGENTINA: [
    { teamId: 'argentina-aldo', teamName: 'Aldosivi' },
    { teamId: 'argentina-argj', teamName: 'Argentinos Juniors' },
    { teamId: 'argentina-cat',  teamName: 'Atlético Tucumán' },
    { teamId: 'argentina-ban',  teamName: 'Banfield' },
    { teamId: 'argentina-bar',  teamName: 'Barracas Central' },
    { teamId: 'argentina-bel',  teamName: 'Belgrano' },
    { teamId: 'argentina-cabj', teamName: 'Boca Juniors' },
    { teamId: 'argentina-ctr',  teamName: 'Central Córdoba' },
    { teamId: 'argentina-dyj',  teamName: 'Defensa y Justicia' },
    { teamId: 'argentina-rie',  teamName: 'Deportivo Riestra' },
    { teamId: 'argentina-est',  teamName: 'Estudiantes de La Plata' },
    { teamId: 'argentina-aae',  teamName: 'Estudiantes de Río Cuarto' },
    { teamId: 'argentina-gmz',  teamName: 'Gimnasia (Mendoza)' },
    { teamId: 'argentina-glp',  teamName: 'Gimnasia La Plata' },
    { teamId: 'argentina-hur',  teamName: 'Huracán' },
    { teamId: 'argentina-ind',  teamName: 'Independiente' },
    { teamId: 'argentina-riv',  teamName: 'Independiente Rivadavia' },
    { teamId: 'argentina-iacc', teamName: 'Instituto' },
    { teamId: 'argentina-lan',  teamName: 'Lanús' },
    { teamId: 'argentina-nob',  teamName: "Newell's Old Boys" },
    { teamId: 'argentina-pla',  teamName: 'Platense' },
    { teamId: 'argentina-rac',  teamName: 'Racing Club' },
    { teamId: 'argentina-rvpl', teamName: 'River Plate' },
    { teamId: 'argentina-ros',  teamName: 'Rosario Central' },
    { teamId: 'argentina-slo',  teamName: 'San Lorenzo' },
    { teamId: 'argentina-sarm', teamName: 'Sarmiento' },
    { teamId: 'argentina-tall', teamName: 'Talleres' },
    { teamId: 'argentina-tig',  teamName: 'Tigre' },
    { teamId: 'argentina-usf',  teamName: 'Unión (Santa Fe)' },
    { teamId: 'argentina-vel',  teamName: 'Vélez Sarsfield' },
  ],

  SAUDIPL: [
    { teamId: 'saudipl-abh',  teamName: 'Abha' },
    { teamId: 'saudipl-ahl',  teamName: 'Al Ahli' },
    { teamId: 'saudipl-dir',  teamName: 'Al Diriyah' },
    { teamId: 'saudipl-ett',  teamName: 'Al Ettifaq' },
    { teamId: 'saudipl-alf',  teamName: 'Al Faisaly' },
    { teamId: 'saudipl-fat',  teamName: 'Al Fateh' },
    { teamId: 'saudipl-fay',  teamName: 'Al Fayha' },
    { teamId: 'saudipl-haz',  teamName: 'Al Hazem' },
    { teamId: 'saudipl-hil',  teamName: 'Al Hilal' },
    { teamId: 'saudipl-itt',  teamName: 'Al Ittihad' },
    { teamId: 'saudipl-kha',  teamName: 'Al Khaleej' },
    { teamId: 'saudipl-kho',  teamName: 'Al Kholood' },
    { teamId: 'saudipl-nsr',  teamName: 'Al Nassr' },
    { teamId: 'saudipl-qad',  teamName: 'Al Qadsiah' },
    { teamId: 'saudipl-riy',  teamName: 'Al Riyadh' },
    { teamId: 'saudipl-sha',  teamName: 'Al Shabab' },
    { teamId: 'saudipl-taa',  teamName: 'Al Taawoun' },
    { teamId: 'saudipl-neom', teamName: 'Neom SC' },
  ],

  PRIMEIRALIGA: [
    { teamId: 'primeiraliga-acv',  teamName: 'Académico de Viseu' },
    { teamId: 'primeiraliga-alv',  teamName: 'Alverca' },
    { teamId: 'primeiraliga-fca',  teamName: 'Arouca' },
    { teamId: 'primeiraliga-slb',  teamName: 'Benfica' },
    { teamId: 'primeiraliga-scb',  teamName: 'Braga' },
    { teamId: 'primeiraliga-cdn',  teamName: 'C.D. Nacional' },
    { teamId: 'primeiraliga-cpac', teamName: 'Casa Pia' },
    { teamId: 'primeiraliga-epf',  teamName: 'Estoril' },
    { teamId: 'primeiraliga-est',  teamName: 'Estrela' },
    { teamId: 'primeiraliga-fcf',  teamName: 'Famalicão' },
    { teamId: 'primeiraliga-fcp',  teamName: 'FC Porto' },
    { teamId: 'primeiraliga-gvfc', teamName: 'Gil Vicente' },
    { teamId: 'primeiraliga-mar',  teamName: 'Marítimo' },
    { teamId: 'primeiraliga-mfc',  teamName: 'Moreirense' },
    { teamId: 'primeiraliga-rafc', teamName: 'Rio Ave' },
    { teamId: 'primeiraliga-cdsc', teamName: 'Santa Clara' },
    { teamId: 'primeiraliga-scp',  teamName: 'Sporting CP' },
    { teamId: 'primeiraliga-vsc',  teamName: 'Vitória de Guimarães' },
  ],

  TURKEY: [
    { teamId: 'turkey-ala',  teamName: 'Alanyaspor' },
    { teamId: 'turkey-amed', teamName: 'Amed SFK' },
    { teamId: 'turkey-bes',  teamName: 'Besiktas' },
    { teamId: 'turkey-cay',  teamName: 'Caykur Rizespor' },
    { teamId: 'turkey-erz',  teamName: 'Erzurum BB' },
    { teamId: 'turkey-eyu',  teamName: 'Eyupspor' },
    { teamId: 'turkey-fen',  teamName: 'Fenerbahce' },
    { teamId: 'turkey-gal',  teamName: 'Galatasaray' },
    { teamId: 'turkey-gaz',  teamName: 'Gaziantep FK' },
    { teamId: 'turkey-gen',  teamName: 'Genclerbirligi' },
    { teamId: 'turkey-goz',  teamName: 'Goztepe' },
    { teamId: 'turkey-ibfk', teamName: 'Istanbul Basaksehir' },
    { teamId: 'turkey-kas',  teamName: 'Kasimpasa' },
    { teamId: 'turkey-koc',  teamName: 'Kocaelispor' },
    { teamId: 'turkey-kny',  teamName: 'Konyaspor' },
    { teamId: 'turkey-sam',  teamName: 'Samsunspor' },
    { teamId: 'turkey-trab', teamName: 'Trabzonspor' },
    { teamId: 'turkey-cor',  teamName: 'Çorum FK' },
  ],

  // ESPN's own data has two different clubs sharing the literal abbreviation
  // "DUN" — Dundee and Dundee United. Dundee keeps "dun" (matches ESPN's own
  // abbreviation and correctly resolves to itself, being the first "DUN" in
  // ESPN's own team list); Dundee United gets a distinct abbreviation ESPN
  // doesn't use, forcing it through espnTeamSportService's name-based
  // fallback — which only resolves this correctly because that fallback
  // checks for an exact name match everywhere before ever trying a fuzzy
  // one (otherwise "Dundee", a genuine substring of "Dundee United" and
  // listed first, would incorrectly win). See that service's tests.
  SCOTLAND: [
    { teamId: 'scotland-abe',  teamName: 'Aberdeen' },
    { teamId: 'scotland-cel',  teamName: 'Celtic' },
    { teamId: 'scotland-dun',  teamName: 'Dundee' },
    { teamId: 'scotland-dnu',  teamName: 'Dundee United' },
    { teamId: 'scotland-falk', teamName: 'Falkirk' },
    { teamId: 'scotland-hom',  teamName: 'Heart of Midlothian' },
    { teamId: 'scotland-hibs', teamName: 'Hibernian' },
    { teamId: 'scotland-kil',  teamName: 'Kilmarnock' },
    { teamId: 'scotland-mot',  teamName: 'Motherwell' },
    { teamId: 'scotland-ran',  teamName: 'Rangers' },
    { teamId: 'scotland-stj',  teamName: 'St Johnstone' },
    { teamId: 'scotland-stm',  teamName: 'St Mirren' },
  ],

  // Every abbreviation below is ESPN's own (checked against soccer/jpn.1's
  // live team list), so each club resolves via abbreviation matching first.
  // One name trap if that ever stops being true: ESPN's shortDisplayName for
  // FC Tokyo is plain "Tokyo", a literal substring of "Tokyo Verdy" — safe
  // only because findTeamByName checks for an exact name match (Tokyo
  // Verdy's own shortDisplayName) before any fuzzy one. See that service's tests.
  JLEAGUE: [
    { teamId: 'jleague-avf',  teamName: 'Avispa Fukuoka' },
    { teamId: 'jleague-cer',  teamName: 'Cerezo Osaka' },
    { teamId: 'jleague-tok',  teamName: 'FC Tokyo' },
    { teamId: 'jleague-oka',  teamName: 'Fagiano Okayama' },
    { teamId: 'jleague-gam',  teamName: 'Gamba Osaka' },
    { teamId: 'jleague-jef',  teamName: 'JEF United Ichihara-Chiba' },
    { teamId: 'jleague-kan',  teamName: 'Kashima Antlers' },
    { teamId: 'jleague-kre',  teamName: 'Kashiwa Reysol' },
    { teamId: 'jleague-kaw',  teamName: 'Kawasaki Frontale' },
    { teamId: 'jleague-kyo',  teamName: 'Kyoto Sanga' },
    { teamId: 'jleague-zel',  teamName: 'Machida Zelvia' },
    { teamId: 'jleague-mito', teamName: 'Mito Hollyhock' },
    { teamId: 'jleague-nag',  teamName: 'Nagoya Grampus' },
    { teamId: 'jleague-san',  teamName: 'Sanfrecce Hiroshima' },
    { teamId: 'jleague-shi',  teamName: 'Shimizu S-Pulse' },
    { teamId: 'jleague-tykv', teamName: 'Tokyo Verdy' },
    { teamId: 'jleague-ura',  teamName: 'Urawa Red Diamonds' },
    { teamId: 'jleague-vvn',  teamName: 'V-Varen Nagasaki' },
    { teamId: 'jleague-vis',  teamName: 'Vissel Kobe' },
    { teamId: 'jleague-yok',  teamName: 'Yokohama F. Marinos' },
  ],

  // Every abbreviation below is ESPN's own (checked against soccer/bel.1's
  // live team list for 2026-27), all unique, and no club's name is a
  // substring of another's — so no disambiguation needed here.
  BELGIUM: [
    { teamId: 'belgium-and',  teamName: 'Anderlecht' },
    { teamId: 'belgium-ant',  teamName: 'Antwerp' },
    { teamId: 'belgium-cbk',  teamName: 'Cercle Brugge KSV' },
    { teamId: 'belgium-bru',  teamName: 'Club Brugge' },
    { teamId: 'belgium-gent', teamName: 'KAA Gent' },
    { teamId: 'belgium-kvk',  teamName: 'KV Kortrijk' },
    { teamId: 'belgium-kvm',  teamName: 'KV Mechelen' },
    { teamId: 'belgium-kvcw', teamName: 'KVC Westerlo' },
    { teamId: 'belgium-lom',  teamName: 'Lommel SK' },
    { teamId: 'belgium-ohl',  teamName: 'OH Leuven' },
    { teamId: 'belgium-rll',  teamName: 'RAAL La Louvière' },
    { teamId: 'belgium-genk', teamName: 'Racing Genk' },
    { teamId: 'belgium-cha',  teamName: 'Royal Charleroi SC' },
    { teamId: 'belgium-stvv', teamName: 'Sint-Truidense' },
    { teamId: 'belgium-stl',  teamName: 'Standard Liege' },
    { teamId: 'belgium-usg',  teamName: 'Union St.-Gilloise' },
    { teamId: 'belgium-waa',  teamName: 'Waasland-Beveren' },
    { teamId: 'belgium-zul',  teamName: 'Zulte-Waregem' },
  ],

  // Every abbreviation below is ESPN's own (checked against soccer/usa.1's
  // live team list), all 30 unique, and no club's name is a substring of
  // another's — so no disambiguation needed here. All 30 also have real
  // ESPN colour data (no placeholder 000000/000000 or 000000/C60000 pairs).
  MLS: [
    { teamId: 'mls-atl',  teamName: 'Atlanta United FC' },
    { teamId: 'mls-atx',  teamName: 'Austin FC' },
    { teamId: 'mls-mtl',  teamName: 'CF Montréal' },
    { teamId: 'mls-clt',  teamName: 'Charlotte FC' },
    { teamId: 'mls-chi',  teamName: 'Chicago Fire FC' },
    { teamId: 'mls-col',  teamName: 'Colorado Rapids' },
    { teamId: 'mls-clb',  teamName: 'Columbus Crew' },
    { teamId: 'mls-dc',   teamName: 'D.C. United' },
    { teamId: 'mls-cin',  teamName: 'FC Cincinnati' },
    { teamId: 'mls-dal',  teamName: 'FC Dallas' },
    { teamId: 'mls-hou',  teamName: 'Houston Dynamo FC' },
    { teamId: 'mls-mia',  teamName: 'Inter Miami CF' },
    { teamId: 'mls-la',   teamName: 'LA Galaxy' },
    { teamId: 'mls-lafc', teamName: 'LAFC' },
    { teamId: 'mls-min',  teamName: 'Minnesota United FC' },
    { teamId: 'mls-nsh',  teamName: 'Nashville SC' },
    { teamId: 'mls-ne',   teamName: 'New England Revolution' },
    { teamId: 'mls-nyc',  teamName: 'New York City FC' },
    { teamId: 'mls-orl',  teamName: 'Orlando City SC' },
    { teamId: 'mls-phi',  teamName: 'Philadelphia Union' },
    { teamId: 'mls-por',  teamName: 'Portland Timbers' },
    { teamId: 'mls-rsl',  teamName: 'Real Salt Lake' },
    { teamId: 'mls-rbny', teamName: 'Red Bull New York' },
    { teamId: 'mls-sd',   teamName: 'San Diego FC' },
    { teamId: 'mls-sj',   teamName: 'San Jose Earthquakes' },
    { teamId: 'mls-sea',  teamName: 'Seattle Sounders FC' },
    { teamId: 'mls-skc',  teamName: 'Sporting Kansas City' },
    { teamId: 'mls-stl',  teamName: 'St. Louis CITY SC' },
    { teamId: 'mls-tor',  teamName: 'Toronto FC' },
    { teamId: 'mls-van',  teamName: 'Vancouver Whitecaps' },
  ],

  // First non-ESPN league — routes through cricketService.js (cricketdata.org)
  // instead. Logos and team identity come straight from that API at request
  // time, not a hand-built CDN URL, so abbreviations here matter less than
  // for ESPN leagues; cricketService also falls back to matching by full
  // team name, same safety net as espnTeamSportService's findTeamByName.
  IPL: [
    { teamId: 'ipl-csk',  teamName: 'Chennai Super Kings' },
    { teamId: 'ipl-dc',   teamName: 'Delhi Capitals' },
    { teamId: 'ipl-gt',   teamName: 'Gujarat Titans' },
    { teamId: 'ipl-kkr',  teamName: 'Kolkata Knight Riders' },
    { teamId: 'ipl-lsg',  teamName: 'Lucknow Super Giants' },
    { teamId: 'ipl-mi',   teamName: 'Mumbai Indians' },
    { teamId: 'ipl-pbks', teamName: 'Punjab Kings' },
    { teamId: 'ipl-rr',   teamName: 'Rajasthan Royals' },
    { teamId: 'ipl-rcb',  teamName: 'Royal Challengers Bengaluru' },
    { teamId: 'ipl-srh',  teamName: 'Sunrisers Hyderabad' },
  ],

  // BBL's 2026-27 season doesn't start until December, so this team list came
  // from the most recently completed season (2025-26) instead — the same 8
  // franchises play every year, only the results/points table are season-specific.
  BBL: [
    { teamId: 'bbl-brh', teamName: 'Brisbane Heat' },
    { teamId: 'bbl-syt', teamName: 'Sydney Thunder' },
    { teamId: 'bbl-hbh', teamName: 'Hobart Hurricanes' },
    { teamId: 'bbl-mlr', teamName: 'Melbourne Renegades' },
    { teamId: 'bbl-sys', teamName: 'Sydney Sixers' },
    { teamId: 'bbl-ads', teamName: 'Adelaide Strikers' },
    { teamId: 'bbl-prs', teamName: 'Perth Scorchers' },
    { teamId: 'bbl-mls', teamName: 'Melbourne Stars' },
  ],
};
