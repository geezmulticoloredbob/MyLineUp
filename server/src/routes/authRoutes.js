const express = require('express');
const rateLimit = require('express-rate-limit');

const { getCurrentUser, login, register } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateLoginPayload, validateRegisterPayload } = require('../validators/authValidator');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in 15 minutes' },
});

router.post('/register', authLimiter, validateRegisterPayload, register);
router.post('/login', authLimiter, validateLoginPayload, login);
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;
