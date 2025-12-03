/**
 * Client service controller for TigerTix
 * Handles business logic for event browsing and ticket purchases
 */

const clientModel = require('../models/clientModel');

// local verify-token needed now because backend and frontend are separate deployments
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const COOKIE_NAME = 'tiger_token';

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
        const userId = req.user.id; // Get user ID from verified token
        
        if (isNaN(eventId)) {
            return res.status(400).json({
                error: 'Invalid event ID'
            });
        }
        
        // Pass userId to your model if you want to track who purchased
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

const verifyToken = (req, res, next) => {
  const token = (req.cookies && req.cookies[COOKIE_NAME]) || 
                (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  
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

module.exports = {
    listEvents,
    purchaseTicket,
    verifyToken
};