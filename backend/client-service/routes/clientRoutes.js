const express = require('express');
const router = express.Router();
const { listEvents, purchaseTicket } = require('../controllers/clientController');

router.get('/events', listEvents);

router.post('/events/:id/purchase', purchaseTicket);

module.exports = router;