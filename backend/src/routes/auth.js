const express = require('express');
const router = express.Router();
const { register, login, verify } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');

const { protect } = require('../middleware/auth');

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);

router.get('/verify', protect, verify);

module.exports = router;