const express = require('express');

const { getCurrentUser, login, register } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateLoginPayload, validateRegisterPayload } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', validateRegisterPayload, register);
router.post('/login', validateLoginPayload, login);
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;
