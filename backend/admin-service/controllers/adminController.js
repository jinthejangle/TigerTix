/**
 * Admin service controller functions
 * Handles business logic for event management operations
 */

const adminModel = require('../models/adminModel');

/**
 * Creates a new event
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const createEvent = async (req, res) => {
    try {
        const { name, date, ticket_count } = req.body;
        // Input validation
        if (!name || !date || ticket_count === undefined) {
            return res.status(400).json({
                error: 'Missing required fields: name, date, ticket_count'
            });
        }
        if (typeof ticket_count !== 'number' || ticket_count < 0) {
            return res.status(400).json({
                error: 'ticket_count must be a non-negative number'
            });
        }
        const eventId = await adminModel.createEvent(name, date, ticket_count);
        
        res.status(201).json({
            message: 'Event created successfully',
            eventId: eventId
        });
    } catch (error) {
        console.error('Error in createEvent controller:', error);
        res.status(500).json({
            error: 'Internal server error while creating event'
        });
    }
};

/**
 * Retrieves all events
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const listEvents = async (req, res) => {
    try {
        const events = await adminModel.getAllEvents();
        
        res.json({
            events: events,
            count: events.length
        });
    } catch (error) {
        console.error('Error in listEvents controller:', error);
        res.status(500).json({
            error: 'Internal server error while retrieving events'
        });
    }
};

/**
 * Gets a specific event by ID
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getEventById = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        
        // Validate event ID
        if (isNaN(eventId) || eventId <= 0) {
            return res.status(400).json({
                error: 'Invalid event ID. Must be a positive number.'
            });
        }
        
        const event = await adminModel.getEventById(eventId);
        
        if (event) {
            res.json({
                event: event
            });
        } else {
            res.status(404).json({
                error: 'Event not found'
            });
        }
        
    } catch (error) {
        console.error('Error in getEventById controller:', error);
        res.status(500).json({
            error: 'Internal server error while retrieving event'
        });
    }
};

/**
 * Deletes an event by ID
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const deleteEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        
        // Validate event ID
        if (isNaN(eventId) || eventId <= 0) {
            return res.status(400).json({
                error: 'Invalid event ID. Must be a positive number.'
            });
        }
        
        const wasDeleted = await adminModel.deleteEvent(eventId);
        
        if (wasDeleted) {
            res.json({
                message: 'Event deleted successfully',
                eventId: eventId
            });
        } else {
            res.status(404).json({
                error: 'Event not found'
            });
        }
        
    } catch (error) {
        console.error('Error in deleteEvent controller:', error);
        res.status(500).json({
            error: 'Internal server error while deleting event'
        });
    }
};

module.exports = {
    createEvent,
    listEvents,
    getEventById,
    deleteEvent
};