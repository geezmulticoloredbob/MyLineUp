const ApiError = require('../utils/apiError');
const leagues = require('../constants/leagues');

function validateFavouritePayload(req, res, next) {
  const { league, teamId, teamName } = req.body;

  if (!league || !teamId || !teamName) {
    return next(new ApiError(400, 'league, teamId, and teamName are required'));
  }

  if (typeof teamId !== 'string' || typeof teamName !== 'string') {
    return next(new ApiError(400, 'teamId and teamName must be strings'));
  }

  if (!leagues.includes(league)) {
    return next(new ApiError(400, `league must be one of: ${leagues.join(', ')}`));
  }

  next();
}

module.exports = {
  validateFavouritePayload,
};
