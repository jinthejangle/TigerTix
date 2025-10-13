/**
 * Client service data models for TigerTix
 * Handles database operations for event browsing and ticket purchases
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to shared database - go up from models/ to client-service/, then to backend/, then into shared-db/
const dbPath = path.resolve(__dirname, '../../shared-db/database.sqlite');

/**
 * Retrieve all events from the database
 * @returns {Promise<Array>} Array of all event objects
 * @throws {Error} When database operation fails
 */
const getAllEvents = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
        });
        
        const sql = 'SELECT * FROM events ORDER BY created_at DESC';
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error fetching events:', err);
                db.close();
                reject(err);
            } else {
                console.log('Retrieved', rows.length, 'events');
                db.close();
                resolve(rows);
            }
        });
    });
};

/**
 * Purchase a ticket for an event (decrements ticket count)
 * @param {number} eventId Event ID
 * @returns {Promise<Object>} Updated event object with new ticket count
 * @throws {Error} When event not found, no tickets available, or database error
 */
const purchaseTicket = (eventId) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
        });
        
        // Use a transaction to ensure atomic updates
        db.serialize(() => {
            // Start transaction
            db.run('BEGIN TRANSACTION');
            
            // First, check current ticket count
            db.get('SELECT ticket_count FROM events WHERE id = ?', [eventId], (err, row) => {
                if (err) {
                    console.error('Error checking ticket count:', err);
                    db.run('ROLLBACK');
                    db.close();
                    reject(err);
                    return;
                }
                
                if (!row) {
                    db.run('ROLLBACK');
                    db.close();
                    reject(new Error('Event not found'));
                    return;
                }
                
                if (row.ticket_count <= 0) {
                    db.run('ROLLBACK');
                    db.close();
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
                            db.close();
                            reject(err);
                            return;
                        }
                        
                        // Get updated event data
                        db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, updatedEvent) => {
                            if (err) {
                                console.error('Error fetching updated event:', err);
                                db.run('ROLLBACK');
                                db.close();
                                reject(err);
                                return;
                            }
                            
                            // Commit transaction
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    console.error('Error committing transaction:', err);
                                    db.close();
                                    reject(err);
                                    return;
                                }
                                
                                console.log('Ticket purchased for event', eventId);
                                db.close();
                                resolve(updatedEvent);
                            });
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