const express = require('express');
const router = express.Router();
const { register, login, logout, verifyToken, getCurrentUser, debugCookies } = require('../controllers/userController');

// Public
router.post('/register', register);
router.post('/login', login);
router.get('/debug-cookies', debugCookies);  // Add this

// Protected
router.get('/me', verifyToken, getCurrentUser);
router.post('/logout', logout);

module.exports = router;