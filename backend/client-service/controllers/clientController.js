/**
 * Client service controller for TigerTix
 * Handles business logic for event browsing and ticket purchases
 */

const clientModel = require('../models/clientModel');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

/**
 * Middleware to verify JWT token from Authorization header
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = payload; // { id, email }
    next();
  });
};

/**
 * Lists all events
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
 */
const purchaseTicket = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const userId = req.user.id; // Get user ID from verified token
        
        if (isNaN(eventId)) {
            return res.status(400).json({
                error: 'Invalid event ID'
            });
        }
        
        const updatedEvent = await clientModel.purchaseTicket(eventId, userId);
        
        res.json({
            message: 'Ticket purchased successfully',
            event: updatedEvent,
            tickets_available: updatedEvent.ticket_count,
            purchased_by: userId
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
    purchaseTicket,
    verifyToken
};