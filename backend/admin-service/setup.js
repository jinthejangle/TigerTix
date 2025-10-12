const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../shared-db');
const dbPath = path.join(dbDir, 'database.sqlite');
const initScriptPath = path.join(dbDir, 'init.sql');

// Error handling
// Ensures shared-db directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Read and execute initialization script
fs.readFile(initScriptPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading init.sql:', err);
        return;
    }

    db.exec(data, (err) => {
        if (err) {
            console.error('Error initializing database:', err);
        } else {
            console.log('Database initialized successfully');
        }
    });
});

db.close();