const express = require('express');
const router = express.Router();
const { register, login, logout, verifyToken, getCurrentUser } = require('../controllers/userController');

// Public
router.post('/register', register);
router.post('/login', login);

// Protected
router.get('/me', verifyToken, getCurrentUser);
router.post('/logout', logout);

module.exports = router;