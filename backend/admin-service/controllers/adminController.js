/**
 * Admin service controller for TigerTix
 * Handles business logic for event creation and management
 */

const adminModel = require('../models/adminModel.js');

/**
 * Creates a new event in the database
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const createEvent = async (req, res) => {
    try {
        const { name, date, ticket_count } = req.body;
        console.log('Received event data:', { name, date, ticket_count });

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
        console.error('Error creating event:', error);
        res.status(500).json({
            error: 'Internal server error: ' + error.message
        });
    }
};

/**
 * Lists all events
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const listEvents = async (req, res) => {
    try {
        const events = await adminModel.getAllEvents();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Internal server error: ' + error.message
        });
    }
};

module.exports = {
    createEvent,
    listEvents
};