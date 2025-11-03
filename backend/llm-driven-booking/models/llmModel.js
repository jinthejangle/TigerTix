/**
 * LLM service data models for natural language processing with Ollama
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const ollama = require('ollama');

const dbPath = path.resolve(__dirname, '../../shared-db/database.sqlite');
const baseDb = new sqlite3.Database(dbPath);

// Configuration for Ollama
const OLLAMA_CONFIG = {
  host: process.env.OLLAMA_HOST || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.1',
  useMock: true // Set to false when Ollama is working
};

// Fallback keyword patterns
const FALLBACK_PATTERNS = {
  book: ['book', 'reserve', 'buy', 'purchase', 'get ticket', 'tickets'],
  events: ['events', 'shows', 'concerts', 'what\'s available'],
  greeting: ['hello', 'hi', 'hey', 'greetings']
};

/**
 * Parse natural language using Ollama or fallback keyword matching
 */
const parseUserIntent = async (userMessage) => {
  // Use mock for now until Ollama is fixed
  if (OLLAMA_CONFIG.useMock) {
    return parseWithEnhancedKeywords(userMessage);
  }

  try {
    // Try Ollama parsing with correct API
    const ollamaResult = await parseWithOllama(userMessage);
    if (ollamaResult && ollamaResult.intent) {
      return ollamaResult;
    }
  } catch (error) {
    console.log('Ollama parsing failed, using fallback:', error.message);
  }
  
  // Fallback to keyword matching
  return parseWithEnhancedKeywords(userMessage);
};

/**
 * Parse using Ollama Node.js client - FIXED VERSION
 */
const parseWithOllama = async (userMessage) => {
  try {
    // Use the correct Ollama API
    const response = await ollama.chat({
      model: OLLAMA_CONFIG.model,
      messages: [
        { 
          role: 'user', 
          content: `You are a ticket booking assistant for TigerTix. Extract the booking intent from this message.

Return ONLY valid JSON with this structure:
{
  "intent": "book" | "list_events" | "greeting" | "unknown",
  "event_name": "event name if booking intent detected",
  "ticket_count": number if specified,
  "confidence": 0.0-1.0
}

User message: "${userMessage}"`
        }
      ],
      options: {
        temperature: 0.1
      }
    });

    const content = response.message.content;
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No valid JSON found in Ollama response');
    }
  } catch (error) {
    throw new Error(`Ollama parsing failed: ${error.message}`);
  }
};

/**
 * Enhanced keyword-based parsing with mock LLM responses
 */
const parseWithEnhancedKeywords = (userMessage) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Mock responses for testing
  if (FALLBACK_PATTERNS.greeting.some(word => lowerMessage.includes(word))) {
    return { 
      intent: 'greeting', 
      confidence: 0.9
    };
  }

  if (FALLBACK_PATTERNS.events.some(word => lowerMessage.includes(word))) {
    return { 
      intent: 'list_events', 
      confidence: 0.85
    };
  }

  // Booking intent detection
  const bookMatch = FALLBACK_PATTERNS.book.some(word => lowerMessage.includes(word));
  if (bookMatch) {
    // Extract ticket count
    const ticketMatch = lowerMessage.match(/(\d+)\s*ticket/);
    const ticketCount = ticketMatch ? parseInt(ticketMatch[1]) : 1;
    
    // Extract event name
    let eventName = null;
    const eventPatterns = [
      /(?:for|to)\s+([^,.!?]+)/,
      /tickets?\s+for\s+([^,.!?]+)/,
      /(?:see|watch|attend)\s+([^,.!?]+)/
    ];
    
    for (const pattern of eventPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        eventName = match[1].trim();
        break;
      }
    }
    
    return {
      intent: 'book',
      event_name: eventName,
      ticket_count: ticketCount,
      confidence: eventName ? 0.8 : 0.6
    };
  }

  return { 
    intent: 'unknown', 
    confidence: 0.3
  };
};

/**
 * Get available events from database - FIXED PATH
 */
const getAvailableEvents = (db = baseDb) => {
  return new Promise((resolve, reject) => {
    
    const sql = 'SELECT id, name, date, ticket_count FROM events WHERE ticket_count > 0 ORDER BY date';
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        reject(err);
      } else {
        console.log(`Found ${rows.length} events`);
        resolve(rows);
      }
    });
  });
};

/**
 * Find event by name (fuzzy matching)
 */
const findEventByName = async (eventName) => {
  try {
    const events = await getAvailableEvents();
    if (events.length === 0) return null;
    
    const lowerSearch = eventName.toLowerCase();
    
    // Exact match
    const exactMatch = events.find(event => 
      event.name.toLowerCase() === lowerSearch
    );
    if (exactMatch) return exactMatch;
    
    // Partial match
    const partialMatch = events.find(event => 
      event.name.toLowerCase().includes(lowerSearch) || 
      lowerSearch.includes(event.name.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    // Return first available event if no specific match
    return events[0];
  } catch (error) {
    console.error('Error finding event:', error);
    return null;
  }
};

/**
 * Process ticket booking with transaction safety
 */
const processBooking = (eventId, ticketCount = 1, db = baseDb) => {
  return new Promise((resolve, reject) => {

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Check current ticket count
      db.get('SELECT name, ticket_count FROM events WHERE id = ?', [eventId], (err, row) => {
        if (err) {
          db.run('ROLLBACK');
          db.close();
          reject(err);
          return;
        }

        if (row.ticket_count < ticketCount) {
          db.run('ROLLBACK');
          db.close();
          reject(new Error(`Only ${row.ticket_count} tickets available`));
          return;
        }

        // Update ticket count
        db.run(
          'UPDATE events SET ticket_count = ticket_count - ? WHERE id = ?',
          [ticketCount, eventId],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              db.close();
              reject(err);
              return;
            }

            // Commit transaction
            db.run('COMMIT', (err) => {
              if (err) {
                db.close();
                reject(err);
                return;
              }

              resolve({
                event_name: row.name,
                tickets_booked: ticketCount,
                remaining_tickets: row.ticket_count - ticketCount
              });
            });
          }
        );
      });
    });
  });
};

module.exports = {
  parseUserIntent,
  getAvailableEvents,
  findEventByName,
  processBooking
};