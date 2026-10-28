const mongoose = require('mongoose');
const PlayerFavourite = require('../models/PlayerFavourite');
const { getESPNRoster } = require('../services/espnPlayerService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const getRoster = asyncHandler(async (req, res) => {
  const { league, teamId } = req.params;
  const { teamName = '' } = req.query;

  const players = await getESPNRoster(league, { teamId, teamName }).catch((err) => {
    throw new ApiError(502, `Could not load roster: ${err.message}`);
  });

  res.json({ players });
});

const getPlayerFavourites = asyncHandler(async (req, res) => {
  const favourites = await PlayerFavourite.find({ user: req.user._id }).sort({
    league: 1,
    playerName: 1,
  });

  res.json({ favourites });
});

const savePlayerFavourite = asyncHandler(async (req, res) => {
  const { league, playerId, playerName, teamId, teamName, position, headshotUrl } = req.body;

  const favourite = await PlayerFavourite.findOneAndUpdate(
    { user: req.user._id, league, playerId },
    {
      user: req.user._id,
      league,
      playerId,
      playerName,
      teamId,
      teamName: teamName || '',
      position: position || '',
      headshotUrl: headshotUrl || '',
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  res.status(201).json({ favourite });
});

const deletePlayerFavourite = asyncHandler(async (req, res) => {
  const { favouriteId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(favouriteId)) {
    throw new ApiError(404, 'Player favourite not found');
  }

  const favourite = await PlayerFavourite.findOneAndDelete({
    _id: favouriteId,
    user: req.user._id,
  });

  if (!favourite) {
    throw new ApiError(404, 'Player favourite not found');
  }

  res.json({ message: 'Player favourite removed' });
});

module.exports = {
  getRoster,
  getPlayerFavourites,
  savePlayerFavourite,
  deletePlayerFavourite,
};
