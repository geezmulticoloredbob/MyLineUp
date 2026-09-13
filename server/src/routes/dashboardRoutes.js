const express = require('express');

const { getDashboard, getTeamTrend } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getDashboard);
router.get('/trend/:league/:teamId', requireAuth, getTeamTrend);

module.exports = router;
