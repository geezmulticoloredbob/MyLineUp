const express = require('express');

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const favouritesRoutes = require('./favouritesRoutes');
const leagueRoutes = require('./leagueRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/favourites', favouritesRoutes);
router.use('/leagues', leagueRoutes);

module.exports = router;

