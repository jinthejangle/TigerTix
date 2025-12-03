/**
 * Client service data models for TigerTix
 * Handles database operations for event browsing and ticket purchases
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to shared database - go up from models/ to client-service/, then to backend/, then into shared-db/
const dbPath = path.resolve(__dirname, '../../shared-db/database.sqlite');
const baseDb = new sqlite3.Database(dbPath);

/**
 * Retrieve all events from the database
 * @param {database} db The path to the desired database
 * @returns {Promise<Array>} Array of all event objects
 * @throws {Error} When database operation fails
 */
const getAllEvents = (db = baseDb) => {
    return new Promise((resolve, reject) => {

        const sql = 'SELECT id, name, date, ticket_count FROM events ORDER BY created_at DESC';
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error fetching events:', err);
                db.close();
                reject(err);
            } else {
                console.log('Retrieved', rows.length, 'events');
                resolve(rows);
            }
        });
    });
};

/**
 * Purchase a ticket for an event (decrements ticket count)
 * @param {number} eventId Event ID
 * @param {database} db The path to the desired database
 * @returns {Promise<Object>} Updated event object with new ticket count
 * @throws {Error} When event not found, no tickets available, or database error
 */
// Update the function signature to accept userId
const purchaseTicket = (eventId, userId, db = baseDb) => {
    return new Promise((resolve, reject) => {
        
        // Use a transaction to ensure atomic updates
        db.serialize(() => {
            // Start transaction
            db.run('BEGIN TRANSACTION');
            
            // First, check current ticket count
            db.get('SELECT ticket_count FROM events WHERE id = ?', [eventId], (err, row) => {
                if (err) {
                    console.error('Error checking ticket count:', err);
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                }
                
                if (!row) {
                    db.run('ROLLBACK');
                    reject(new Error('Event not found'));
                    return;
                }
                
                if (row.ticket_count <= 0) {
                    db.run('ROLLBACK');
                    reject(new Error('No tickets available'));
                    return;
                }
                
                // Decrement ticket count
                db.run(
                    'UPDATE events SET ticket_count = ticket_count - 1 WHERE id = ?',
                    [eventId],
                    function(err) {
                        if (err) {
                            console.error('Error updating ticket count:', err);
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }
                        
                        // OPTIONAL: Record purchase in purchases table
                        // Create purchases table if it doesn't exist
                        db.run(`
                            CREATE TABLE IF NOT EXISTS purchases (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                event_id INTEGER NOT NULL,
                                user_id INTEGER NOT NULL,
                                purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP
                            )
                        `, (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }
                            
                            // Insert purchase record
                            db.run(
                                'INSERT INTO purchases (event_id, user_id) VALUES (?, ?)',
                                [eventId, userId],
                                function(err) {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        reject(err);
                                        return;
                                    }
                                    
                                    // Get updated event data
                                    db.get('SELECT id, name, date, ticket_count FROM events WHERE id = ?', [eventId], (err, updatedEvent) => {
                                        if (err) {
                                            console.error('Error fetching updated event:', err);
                                            db.run('ROLLBACK');
                                            reject(err);
                                            return;
                                        }
                                        
                                        // Commit transaction
                                        db.run('COMMIT', (err) => {
                                            if (err) {
                                                console.error('Error committing transaction:', err);
                                                reject(err);
                                                return;
                                            }
                                            
                                            console.log(`Ticket purchased for event ${eventId} by user ${userId}`);
                                            resolve(updatedEvent);
                                        });
                                    });
                                }
                            );
                        });
                    }
                );
            });
        });
    });
};

module.exports = {
    getAllEvents,
    purchaseTicket
};