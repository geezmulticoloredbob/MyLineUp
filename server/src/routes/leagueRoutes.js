const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { getFollowedLeagues, updateFollowedLeagues, completeOnboarding } = require('../controllers/leagueController');

const router = express.Router();

router.use(authenticate);

router.get('/', getFollowedLeagues);
router.put('/', updateFollowedLeagues);
router.post('/complete-onboarding', completeOnboarding);

module.exports = router;
