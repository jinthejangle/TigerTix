/**
 * LLM service controller for natural language booking
 */

const llmModel = require('../models/llmModel');

/**
 * Parse natural language request
 */
const parseRequest = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const intent = await llmModel.parseUserIntent(message);
    const availableEvents = await llmModel.getAvailableEvents();
    
    let response = {
      intent: intent.intent,
      confidence: intent.confidence,
      available_events: availableEvents,
      requires_confirmation: false,
      message: ''
    };

    // Handle different intents
    switch (intent.intent) {
      case 'book':
        if (intent.event_name) {
          // Try to find the event they're referring to
          const matchedEvent = await llmModel.findEventByName(intent.event_name);
          if (matchedEvent) {
            response.event_name = matchedEvent.name;
            response.event_id = matchedEvent.id;
            response.ticket_count = intent.ticket_count || 1;
            response.requires_confirmation = true;
            response.message = `Book ${response.ticket_count} ticket(s) for "${matchedEvent.name}"?`;
          } else {
            response.message = `I couldn't find "${intent.event_name}". Available events: ${availableEvents.map(e => e.name).join(', ')}`;
          }
        } else {
          response.message = `Which event would you like to book? Available: ${availableEvents.map(e => e.name).join(', ')}`;
        }
        break;
        
      case 'list_events':
        response.message = availableEvents.length > 0 
          ? `Available events: ${availableEvents.map(e => `${e.name} (${e.ticket_count} tickets)`).join(', ')}`
          : 'No events available at the moment.';
        break;
        
      case 'greeting':
        response.message = 'Hello! I can help you book tickets for events. You can ask me to list events or book tickets.';
        break;
        
      default:
        response.message = 'I can help you book tickets or show available events. What would you like to do?';
    }

    res.json(response);
  } catch (error) {
    console.error('Error parsing request:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
};

/**
 * Confirm and process booking
 */
const confirmBooking = async (req, res) => {
  try {
    const { event_id, event_name, ticket_count } = req.body;
    
    let eventId = event_id;
    
    // If no event_id provided, try to find by name
    if (!eventId && event_name) {
      const event = await llmModel.findEventByName(event_name);
      if (event) {
        eventId = event.id;
      } else {
        return res.status(404).json({ error: `Event "${event_name}" not found` });
      }
    }
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID or name is required' });
    }

    const result = await llmModel.processBooking(eventId, ticket_count || 1);
    
    res.json({
      success: true,
      message: `Successfully booked ${result.tickets_booked} ticket(s) for ${result.event_name}`,
      ...result
    });
  } catch (error) {
    console.error('Error processing booking:', error);
    res.status(400).json({ 
      error: 'Booking failed',
      details: error.message 
    });
  }
};

module.exports = {
  parseRequest,
  confirmBooking
};