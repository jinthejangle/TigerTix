/**
 * LLM service route definitions
 */

const express = require('express');
const router = express.Router();
const { parseRequest, confirmBooking } = require('../controllers/llmController');

router.post('/parse', parseRequest);
router.post('/confirm-booking', confirmBooking);

module.exports = router;