const ApiError = require('../utils/apiError');
const leagues = require('../constants/leagues');
const { PLAYER_SPORT_CONFIG } = require('../services/espnPlayerService');

// V1 scope: player pages only cover the ESPN-routed leagues plus NBA (whose
// team data comes from BallDontLie, but whose player data comes from ESPN —
// see espnPlayerService.js). football-data.org leagues (EPL, La Liga, etc.)
// and World Cup/cricket aren't supported yet — rejected clearly here rather
// than failing deep inside a fetch with a confusing error.
const SUPPORTED_PLAYER_LEAGUES = new Set(Object.keys(PLAYER_SPORT_CONFIG));

function validatePlayerLeagueParam(req, res, next) {
  const { league } = req.params;
  if (!SUPPORTED_PLAYER_LEAGUES.has(league)) {
    return next(new ApiError(400, `Player pages aren't available for ${league} yet`));
  }
  next();
}

function validatePlayerFavouritePayload(req, res, next) {
  const { league, playerId, playerName, teamId } = req.body;

  if (!league || !playerId || !playerName || !teamId) {
    return next(new ApiError(400, 'league, playerId, playerName, and teamId are required'));
  }

  if (typeof playerId !== 'string' || typeof playerName !== 'string' || typeof teamId !== 'string') {
    return next(new ApiError(400, 'playerId, playerName, and teamId must be strings'));
  }

  if (!leagues.includes(league)) {
    return next(new ApiError(400, `league must be one of: ${leagues.join(', ')}`));
  }

  if (!SUPPORTED_PLAYER_LEAGUES.has(league)) {
    return next(new ApiError(400, `Player pages aren't available for ${league} yet`));
  }

  next();
}

module.exports = {
  validatePlayerLeagueParam,
  validatePlayerFavouritePayload,
};
