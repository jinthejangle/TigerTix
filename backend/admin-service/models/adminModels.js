const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../shared-db/events.db');
const db = new sqlite3.Database(dbPath);

/**
 * Creates a new event in the database
 * @param {string} name Event name
 * @param {string} date Event date
 * @param {number} ticketCount Number of available tickets
 * @returns {Promise<number>} ID of the created event
 */
const createEvent = (name, date, ticketCount) => {
    return new Promise((resolve, reject) => {       // Promise is an abstraction for a value that may be available
        const sql = `INSERT INTO events (name, date, ticket_count) VALUES (?, ?, ?)`;
        db.run(sql, [name, date, ticketCount], function(err) {
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
        const sql = 'SELECT * FROM events';
        db.all(sql, [], (err, rows) => {
            if (err) {
                return reject(err);
            } 
            else {
                return resolve(rows);
            }
        });
    });
};

module.exports = {
    createEvent,
    getAllEvents
};