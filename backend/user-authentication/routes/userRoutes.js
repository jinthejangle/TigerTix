const express = require('express');
const router = express.Router();
const { register, login, logout, verifyToken, getCurrentUser } = require('../controllers/userController');

// Public
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout); // Changed to POST

// Protected
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;