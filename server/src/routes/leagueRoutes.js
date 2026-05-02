const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getFollowedLeagues, updateFollowedLeagues, completeOnboarding } = require('../controllers/leagueController');

const router = express.Router();

router.use(requireAuth);

router.get('/', getFollowedLeagues);
router.put('/', updateFollowedLeagues);
router.post('/complete-onboarding', completeOnboarding);

module.exports = router;
