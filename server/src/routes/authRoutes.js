const express = require('express');

const { login, register } = require('../controllers/authController');
const { validateLoginPayload, validateRegisterPayload } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', validateRegisterPayload, register);
router.post('/login', validateLoginPayload, login);

module.exports = router;
