import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch events from client microservice on port 5000
  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => {                 // Makes sure events are loaded properly
        console.error(err);
        alert('Failed to load events. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, []);

  const buyTicket = async (eventId, eventName) => {
    try {
      // Send POST request to purchase endpoint
      const response = await fetch(`http://localhost:5000/api/events/${eventId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Purchase failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Update UI dynamically with new ticket count
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                tickets_available: result.tickets_available || event.tickets_available - 1
              }
            : event
        )
      );
      
      // Showing confirmation message
      alert(`Ticket successfully purchased for: ${eventName}`);
    } catch (err) {
      console.error('Error purchasing ticket:', err);
      alert(`Failed to purchase ticket for ${eventName}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="App" role="main">
        <h1>Clemson Campus Events</h1>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="App" role="main">
      <header>
        <h1>Clemson Campus Events</h1>
      </header>
      
      <section>
        <ul>
          {events.map((event) => (
            <li key={event.id} className="event-item">
              <div className="event-info">
                <h3 className="event-name">{event.name}</h3>
                <p className="event-date">Date: {event.date}</p>
                <p className="event-tickets">
                  Tickets available: {event.tickets_available || event.ticketsAvailable || 0}
                </p>
              </div>
              <button
                onClick={() => buyTicket(event.id, event.name)}
                className="buy-ticket-btn"
                disabled={event.tickets_available === 0 || event.ticketsAvailable === 0}
              >
                Buy Ticket
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default App;