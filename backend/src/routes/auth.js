const express = require('express');
const router = express.Router();
const { login, verify } = require('../controllers/authController');
const { validateLogin } = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');

router.post('/login', authLimiter, validateLogin, login);
router.get('/verify', protect, verify);

module.exports = router;