const express = require('express');
const router = express.Router();
const { register, login, logout, me, registerValidation, loginValidation } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/me', authenticateUser, me);

module.exports = router;
