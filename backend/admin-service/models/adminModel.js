/**
 * Admin service data models for TigerTix
 * Handles database operations for event management
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../shared-db/database.sqlite');

/**
 * Creates a new event in the database
 * @param {string} name Event name
 * @param {string} date Event date
 * @param {number} ticketCount Number of available tickets
 * @param {database} db The path to the desired database
 * @returns {Promise<number>} ID of the created event
 * @throws {Error} When database operation fails
 */
const createEvent = (name, date, ticketCount, db) => {
    return new Promise((resolve, reject) => {
        
        const sql = `INSERT INTO events (name, date, ticket_count) VALUES (?, ?, ?)`;
        
        db.run(sql, [name, date, ticketCount], function(err) {
            if (err) {
                console.error('Error inserting event:', err);
                db.close();
                reject(err);
            } else {
                console.log('Event created with ID:', this.lastID);
                resolve(this.lastID);
            }
        });
    });
};

/**
 * Retrieve all events from the database
 * @param {string} db The path to the desired database
 * @returns {Promise<Array>} Array of all event objects
 * @throws {Error} When database operation fails
 */
const getAllEvents = (db) => {
    return new Promise((resolve, reject) => {
        
        const sql = 'SELECT * FROM events ORDER BY created_at DESC';
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error fetching events:', err);
                db.close();
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

/**
 * Deletes an event from the database by ID
 * @param {number} eventId ID of the event to delete
 * @param {string} database The path to the desired database
 * @returns {Promise<boolean>} True if event was deleted, false if not found
 * @throws {Error} When database operation fails
 */
const deleteEvent = (eventId, database) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(database, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
        });
        
        const sql = 'DELETE FROM events WHERE id = ?';
        
        db.run(sql, [eventId], function(err) {
            if (err) {
                console.error('Error deleting event:', err);
                db.close();
                reject(err);
            } else {
                const wasDeleted = this.changes > 0;
                if (wasDeleted) {
                    console.log(`Event with ID ${eventId} deleted successfully`);
                } else {
                    console.log(`No event found with ID ${eventId}`);
                }
                db.close();
                resolve(wasDeleted);
            }
        });
    });
};

/**
 * Retrieves a specific event by ID from the database
 * @param {number} eventId ID of the event to retrieve
 * @param {string} database The path to the desired database
 * @returns {Promise<Object>} Event object if found, null if not found
 * @throws {Error} When database operation fails
 */
const getEventById = (eventId, database) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(database, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
        });
        
        const sql = 'SELECT * FROM events WHERE id = ?';
        
        db.get(sql, [eventId], (err, row) => {
            if (err) {
                console.error('Error fetching event:', err);
                db.close();
                reject(err);
            } else {
                db.close();
                resolve(row || null);
            }
        });
    });
};

module.exports = {
    createEvent,
    getAllEvents,
    deleteEvent,
    getEventById
};