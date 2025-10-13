const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../shared-db');
const dbPath = path.join(dbDir, 'database.sqlite');

// Ensure shared-db directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create database and table directly
const db = new sqlite3.Database(dbPath);

const createTableSQL = `
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    ticket_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

db.run(createTableSQL, function(err) {
    if (err) {
        console.error('Error creating table:', err);
    } else {
        console.log('Events table created successfully');
    }
    
    // Close the database connection
    db.close((closeErr) => {
        if (closeErr) {
            console.error('Error closing database:', closeErr);
        } else {
            console.log('Database setup completed');
        }
    });
});