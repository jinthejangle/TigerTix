/**
 * Admin service route definitions
 * Handles event creation and management endpoints
 */

const express = require('express');
const router = express.Router();
const { 
    listEvents, 
    createEvent, 
    getEventById, 
    deleteEvent 
} = require('../controllers/adminController');

// GET /api/admin/events - Get all events
router.get('/events', listEvents);

// POST /api/admin/events - Create a new event
router.post('/events', createEvent);

// GET /api/admin/events/:id - Get a specific event by ID
router.get('/events/:id', getEventById);

// DELETE /api/admin/events/:id - Delete an event by ID
router.delete('/events/:id', deleteEvent);

module.exports = router;