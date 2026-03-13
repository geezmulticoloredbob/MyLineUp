const Favourite = require('../models/Favourite');
const asyncHandler = require('../utils/asyncHandler');

const getFavourites = asyncHandler(async (req, res) => {
  const favourites = await Favourite.find({ user: req.user._id }).sort({
    league: 1,
    teamName: 1,
  });

  res.json({ favourites });
});

const saveFavourite = asyncHandler(async (req, res) => {
  const { league, teamId, teamName, teamLogoUrl } = req.body;

  const favourite = await Favourite.findOneAndUpdate(
    {
      user: req.user._id,
      league,
      teamId,
    },
    {
      user: req.user._id,
      league,
      teamId,
      teamName,
      teamLogoUrl: teamLogoUrl || '',
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  res.status(201).json({ favourite });
});

const deleteFavourite = asyncHandler(async (req, res) => {
  const { favouriteId } = req.params;

  const favourite = await Favourite.findOneAndDelete({
    _id: favouriteId,
    user: req.user._id,
  });

  if (!favourite) {
    return res.status(404).json({ message: 'Favourite not found' });
  }

  res.json({ message: 'Favourite removed' });
});

module.exports = {
  getFavourites,
  saveFavourite,
  deleteFavourite,
};
