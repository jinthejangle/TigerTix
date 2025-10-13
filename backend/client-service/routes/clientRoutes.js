/**
 * Client service route definitions
 * Handles event browsing and ticket purchase endpoints
 */

const express = require('express');
const router = express.Router();
const { listEvents, purchaseTicket } = require('../controllers/clientController');

router.get('/events', listEvents);

router.post('/events/:id/purchase', purchaseTicket);

module.exports = router;