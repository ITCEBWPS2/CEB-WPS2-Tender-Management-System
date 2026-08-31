const express = require('express');
const router = express.Router();
const { register, login, verify } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');

const { protect } = require('../middleware/auth');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

router.get('/verify', protect, verify);

module.exports = router;