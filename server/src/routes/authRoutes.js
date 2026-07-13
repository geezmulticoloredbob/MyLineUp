const express = require('express');
const rateLimit = require('express-rate-limit');

const { getCurrentUser, login, logout, register, updateIcon, updateProfile, updatePassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateLoginPayload, validateRegisterPayload } = require('../validators/authValidator');

const router = express.Router();

const authLimiter =
  process.env.NODE_ENV !== 'test'
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many attempts, please try again in 15 minutes' },
      })
    : (req, res, next) => next();

router.post('/register', authLimiter, validateRegisterPayload, register);
router.post('/login', authLimiter, validateLoginPayload, login);
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', logout);
router.patch('/icon', requireAuth, updateIcon);
router.patch('/profile', requireAuth, updateProfile);
router.patch('/password', requireAuth, updatePassword);

module.exports = router;
