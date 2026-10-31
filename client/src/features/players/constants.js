// Player Pages is being rolled out league by league (see project notes) —
// this is the allowlist of leagues the client shows a "Players" picker for.
// The server's /api/players endpoints already support every ESPN-routed
// league plus NBA (see server's espnTeamSportService.ESPN_SPORT_CONFIG), but
// the client is deliberately gated narrower so each league's roster/stat
// shape gets verified live before its UI ships.
export const PLAYER_PAGES_LEAGUES = ['NFL', 'NBA', 'NHL'];
