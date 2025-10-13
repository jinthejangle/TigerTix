/**
 * Admin service route definitions
 * Handles event creation and management endpoints
 */

const express = require('express');
const router = express.Router();
const { listEvents, createEvent } = require('../controllers/adminController');

router.get('/events', listEvents);
router.post('/events', createEvent);

module.exports = router;