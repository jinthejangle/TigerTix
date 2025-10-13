const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../shared-db/database.sqlite');

/**
 * Creates a new event in the database
 * @param {string} name Event name
 * @param {string} date Event date
 * @param {number} ticketCount Number of available tickets
 * @returns {Promise<number>} ID of the created event
 */
const createEvent = (name, date, ticketCount) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        const sql = `INSERT INTO events (name, date, ticket_count) VALUES (?, ?, ?)`;
        
        db.run(sql, [name, date, ticketCount], function(err) {
            db.close(); // Close connection
            if (err) {
                reject(err);
            } else {
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
        const db = new sqlite3.Database(dbPath);
        const sql = 'SELECT * FROM events ORDER BY created_at DESC';
        
        db.all(sql, [], (err, rows) => {
            db.close(); // Close connection
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

module.exports = {
    createEvent,
    getAllEvents
};