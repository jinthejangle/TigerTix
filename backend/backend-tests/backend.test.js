const adminModel = require('../admin-service/models/adminModel');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, './test-database.sqlite');

describe('Admin Service Unit Tests', () => {

    beforeEach(done => {
        db = new sqlite3.Database(dbPath);
        db.serialize(() => {
            db.run(`DROP TABLE IF EXISTS events`);
            db.run(`
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    date TEXT NOT NULL,
                    ticket_count INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`INSERT INTO events (name, date, ticket_count)
                    VALUES ('Test Event', '11-3-2025', 100)`, done);
        }) 
    })

    afterAll(done => {
        db.serialize(() => {
            db.run(`DROP TABLE IF EXISTS events`);
            db.close(done);
        })
    })

    test('Properly creates new event', async () => {
        const eventId = await adminModel.createEvent('NewTestEvent', '11-3-2025', 100, db);
        expect(eventId).toBe(2);
    })

    test('Properly gets events', async () => {
        db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                    VALUES ('New Test Event', '11-3-2025', 100, '2025-10-01 12:00:00')`);
        const events = await adminModel.getAllEvents(db);
        expect(events[1]).toEqual(
            {created_at: '2025-10-01 12:00:00', date: '11-3-2025', id: 2, name: 'New Test Event', ticket_count: 100}
        );
    })

    test('Properly deletes event', async () => {
        db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                VALUES ('New Test Event', '11-3-2025', 100, '2025-10-01 12:00:00')`);
        const deleted = await adminModel.deleteEvent(1, db);
        expect(deleted).toBe(true);
        
        const events = await adminModel.getAllEvents(db);
        expect(events[0]).toEqual(
            {created_at: '2025-10-01 12:00:00', date: '11-3-2025', id: 2, name: 'New Test Event', ticket_count: 100}
        );
    })

    test('Gets event by id', async () => {
        db.serialize(() => {
            db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                VALUES ('New Test Event', '11-3-2025', 100, '2025-10-01 12:00:00')`);
            db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                VALUES ('New Test Event2', '11-3-2025', 200, '2025-10-02 12:00:00')`);
        })
        const event = await adminModel.getEventById(2, db);
        expect(event).toEqual(
            {created_at: '2025-10-01 12:00:00', date: '11-3-2025', id: 2, name: 'New Test Event', ticket_count: 100}
        );
    })
})