const adminModel = require('../admin-service/models/adminModel');
const clientModel = require('../client-service/models/clientModel');
const llmModel = require('../llm-driven-booking/models/llmModel');
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
        const eventId = await adminModel.createEvent('AdminTestEvent', '11-3-2025', 100, db);
        expect(eventId).toBe(2);
    })

    test('Properly gets events', async () => {
        db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                    VALUES ('Admin Test Event', '11-3-2025', 100, '2025-10-01 12:00:00')`);
        const events = await adminModel.getAllEvents(db);
        expect(events[1]).toEqual(
            {date: '11-3-2025', id: 2, name: 'Admin Test Event', ticket_count: 100}
        );
    })

    test('Properly deletes event', async () => {
        db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                VALUES ('Admin Test Event', '11-3-2025', 100, '2025-10-01 12:00:00')`);
        const deleted = await adminModel.deleteEvent(1, db);
        expect(deleted).toBe(true);
        
        const events = await adminModel.getAllEvents(db);
        expect(events[0]).toEqual(
            {date: '11-3-2025', id: 2, name: 'Admin Test Event', ticket_count: 100}
        );
    })

    test('Gets event by id', async () => {
        db.serialize(() => {
            db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                VALUES ('Admin Test Event', '11-3-2025', 100, '2025-10-01 12:00:00')`);
            db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                VALUES ('Admin Test Event2', '11-3-2025', 200, '2025-10-02 12:00:00')`);
        })
        const event = await adminModel.getEventById(2, db);
        expect(event).toEqual(
            {date: '11-3-2025', id: 2, name: 'Admin Test Event', ticket_count: 100}
        );
    })
})

describe('Client Service Unit Tests', () => {

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

    test('Properly gets events', async () => {
        db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                    VALUES ('Client Test Event', '11-3-2025', 100, '2025-10-01 12:00:00')`);
        const events = await clientModel.getAllEvents(db);
        expect(events[1]).toEqual(
            {date: '11-3-2025', id: 2, name: 'Client Test Event', ticket_count: 100}
        );
    })

    test('Properly purchases ticket', async () => {
        db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                    VALUES ('Client Test Event', '11-3-2025', 100, '2025-10-01 12:00:00')`);
        const updatedEvent = await clientModel.purchaseTicket(2, db);
        expect(updatedEvent).toEqual(
            {date: '11-3-2025', id: 2, name: 'Client Test Event', ticket_count: 99}
        );
    })
})

describe('LLM Booking Unit Tests', () => {

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

    test('LLM parsing works properly', async () => {
        const parsedMessage = await llmModel.parseUserIntent('Book 1 ticket for Test Event');
        expect(parsedMessage).toEqual(
            {intent: 'book', event_name: 'test event', ticket_count: 1, confidence: 0.8}
        );
    })

    test('Properly gets events', async () => {
        db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                    VALUES ('LLM Test Event', '11-3-2025', 100, '2025-10-01 12:00:00')`);
        const events = await llmModel.getAvailableEvents(db);
        expect(events[1]).toEqual(
            {date: '11-3-2025', id: 2, name: 'LLM Test Event', ticket_count: 100}
        );
    })

    test('Finds event by name', async () => {
        db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                    VALUES ('LLM Test Event', '11-3-2025', 100, '2025-10-01 12:00:00')`);
        const event = await llmModel.findEventByName('LLM Test Event', db);
        expect(event).toEqual(
            {date: '11-3-2025', id: 2, name: 'LLM Test Event', ticket_count: 100}
        );
    })

    test('Properly books tickets', async () => {
        db.run(`INSERT INTO events (name, date, ticket_count, created_at)
                    VALUES ('LLM Test Event', '11-3-2025', 100, '2025-10-01 12:00:00')`);
        const bookedEvent = await llmModel.processBooking(2, 2, db);
        expect(bookedEvent).toEqual(
            {event_name: 'LLM Test Event', remaining_tickets: 98, tickets_booked: 2}
        );
    })
})

describe('Integration Tests', () => {
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

    test('Tests functionality between admin and client servers', async () => {
        const newEvent = await adminModel.createEvent('New Test Event', '11-3-2025', 100, db);
        expect(newEvent).toBe(2);

        const events = await clientModel.getAllEvents(db);
        expect(events[1]).toEqual(
            {date: '11-3-2025', id: 2, name: 'New Test Event', ticket_count: 100}
        );

        const updatedEvent = await clientModel.purchaseTicket(2, db);
        expect(updatedEvent).toEqual(
            {date: '11-3-2025', id: 2, name: 'New Test Event', ticket_count: 99}
        );

        const adminEvents = await adminModel.getAllEvents(db);
        expect(adminEvents[1]).toEqual(
            {date: '11-3-2025', id: 2, name: 'New Test Event', ticket_count: 99}
        );
    })

    test('Tests functionality of LLM booking', async () => {
        const newEvent = await adminModel.createEvent('New Test Event', '11-3-2025', 100, db);
        expect(newEvent).toBe(2);

        const events = await llmModel.getAvailableEvents(db);
        expect(events[1]).toEqual(
            {date: '11-3-2025', id: 2, name: 'New Test Event', ticket_count: 100}
        );

        const parsedMessage = await llmModel.parseUserIntent('Book 2 tickets for New Test Event');
        expect(parsedMessage).toEqual(
            {intent: 'book', event_name: 'new test event', ticket_count: 2, confidence: 0.8}
        );
        
        const bookedEvent = await llmModel.processBooking(2, 2, db);
        expect(bookedEvent).toEqual(
            {event_name: 'New Test Event', remaining_tickets: 98, tickets_booked: 2}
        );
    })
})