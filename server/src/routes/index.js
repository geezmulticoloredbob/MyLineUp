const express = require('express');

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const favouritesRoutes = require('./favouritesRoutes');
const leagueRoutes = require('./leagueRoutes');
const internalRoutes = require('./internalRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/favourites', favouritesRoutes);
router.use('/leagues', leagueRoutes);
router.use('/internal', internalRoutes);

module.exports = router;

