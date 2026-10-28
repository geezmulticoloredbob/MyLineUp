const express = require('express');

const {
  getRoster,
  getPlayerFavourites,
  savePlayerFavourite,
  deletePlayerFavourite,
} = require('../controllers/playersController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validatePlayerLeagueParam, validatePlayerFavouritePayload } = require('../validators/playersValidator');

const router = express.Router();

router.use(requireAuth);

router.get('/roster/:league/:teamId', validatePlayerLeagueParam, getRoster);
router.get('/favourites', getPlayerFavourites);
router.post('/favourites', validatePlayerFavouritePayload, savePlayerFavourite);
router.delete('/favourites/:favouriteId', deletePlayerFavourite);

module.exports = router;
