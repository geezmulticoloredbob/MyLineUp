const express = require('express');

const { refreshSnapshots } = require('../controllers/internalController');
const { requireInternalSecret } = require('../middleware/internalAuthMiddleware');

const router = express.Router();

router.post('/refresh-snapshots', requireInternalSecret, refreshSnapshots);

module.exports = router;
