const express = require('express');

const {
  getFavourites,
  saveFavourite,
} = require('../controllers/favouritesController');

const router = express.Router();

router.get('/', getFavourites);
router.post('/', saveFavourite);

module.exports = router;

