const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'shared-db', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to shared DB:', err.message);
  } else {
    console.log('Connected to shared DB for user-authentication:', dbPath);
  }
});

// Create users table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
});

module.exports = {
  createUser: (email, hashedPassword) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT INTO users (email, password) VALUES (?, ?)`);
      stmt.run(email, hashedPassword, function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, email });
      });
    });
  },

  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT id, email FROM users WHERE id = ?`, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  removeUser: (email) => {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM users WHERE email = ?`, [email], (err,row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
};