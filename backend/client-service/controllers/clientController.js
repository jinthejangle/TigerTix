const clientModel = require('../models/clientModel');

/**
 * Lists all events
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const listEvents = async (req, res) => {
    try {
        const events = await clientModel.getAllEvents();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Internal server error: ' + error.message
        });
    }
};

/**
 * Purchase a ticket for an event
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const purchaseTicket = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        
        if (isNaN(eventId)) {
            return res.status(400).json({
                error: 'Invalid event ID'
            });
        }
        
        const updatedEvent = await clientModel.purchaseTicket(eventId);
        
        res.json({
            message: 'Ticket purchased successfully',
            event: updatedEvent,
            tickets_available: updatedEvent.ticket_count
        });
    } catch (error) {
        console.error('Error purchasing ticket:', error);
        
        if (error.message === 'Event not found') {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        if (error.message === 'No tickets available') {
            return res.status(400).json({ error: 'No tickets available' });
        }
        
        res.status(500).json({
            error: 'Internal server error: ' + error.message
        });
    }
};

module.exports = {
    listEvents,
    purchaseTicket
};