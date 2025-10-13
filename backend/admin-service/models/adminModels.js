const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../shared-db/database.sqlite');

/**
 * Creates a new event in the database
 * @param {string} name Event name
 * @param {string} date Event date
 * @param {number} ticketCount Number of available tickets
 * @returns {Promise<number>} ID of the created event
 */
const createEvent = (name, date, ticketCount) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
        });
        
        const sql = `INSERT INTO events (name, date, ticket_count) VALUES (?, ?, ?)`;
        
        db.run(sql, [name, date, ticketCount], function(err) {
            if (err) {
                console.error('Error inserting event:', err);
                db.close();
                reject(err);
            } else {
                console.log('Event created with ID:', this.lastID);
                db.close();
                resolve(this.lastID);
            }
        });
    });
};

/**
 * Retrieve all events from the database
 * @returns {Promise<Array>} Array of all event objects
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
                db.close();
                resolve(rows);
            }
        });
    });
};

module.exports = {
    createEvent,
    getAllEvents
};