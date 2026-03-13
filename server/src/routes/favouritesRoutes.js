const express = require('express');

const {
  getFavourites,
  saveFavourite,
  deleteFavourite,
} = require('../controllers/favouritesController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateFavouritePayload } = require('../validators/favouritesValidator');

const router = express.Router();

router.use(requireAuth);
router.get('/', getFavourites);
router.post('/', validateFavouritePayload, saveFavourite);
router.delete('/:favouriteId', deleteFavourite);

module.exports = router;
