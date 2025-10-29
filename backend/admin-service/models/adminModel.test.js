/*const adminModel = require('./adminModel')
jest.mock('./adminModel')

/*test('Properly creates new event', () => {
    adminModel.createEvent('NewTestEvent', '11-3-2025', 100)
})

test('Properly gets events', () => {
    return adminModel.getAllEvents().then(data => {
        expect(data).toBe('Test Event')
    })
})*/

const sqlite3 = require('sqlite3').verbose()
const adminModel = require('./adminModel')

describe('Admin event database functions', () => {
    let dbPath = ':memory:' // in-memory database
    let db

    beforeAll(done => {
        db = new sqlite3.Database(dbPath, done)
    })

    beforeEach(done => {
        db.serialize(() => {
            db.run(`DROP TABLE events`)
            db.run(`
                CREATE TABLE events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    date TEXT NOT NULL,
                    ticket_count INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, done)
        })
    })

    afterAll(done => {
        db.close(done)
    })

    test('creates a new event', async () => {
        const eventId = await adminModel.createEvent('Concert', '2025-12-01', 100, dbPath)
        expect(eventId).toBe(1)
    })

    test('fetches all events', async () => {
        const events = await adminModel.getAllEvents(dbPath)
        expect(events.length).toBeGreaterThan(0)
        expect(events[0]).toBe('Concert')
    })
})