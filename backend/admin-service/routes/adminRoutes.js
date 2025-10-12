const express = require('express');
const router = express.Router();
const { createEvent, listEvents } = require('../controllers/adminController');

// Create new event
router.post('/admin/events', createEvent);

// List all events for admin
router.get('/admin/events', listEvents);

module.exports = router;