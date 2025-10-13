import React, { useEffect, useState } from 'react';
import './App.css';

/**
 * Main App component for TigerTix event ticketing system
 * Displays a list of events and allows users to purchase tickets
 * Implements accessibility features for screen readers and keyboard navigation
 */
function App() {
  // State management
  const [events, setEvents] = useState([]);           // Stores array of event objects from database
  const [loading, setLoading] = useState(false);       // Tracks loading state for initial fetch
  const [purchaseStatus, setPurchaseStatus] = useState(''); // Stores status messages for user feedback

  /**
   * Fetch events from client microservice on component mount
   * useEffect with empty dependency array [] runs once when component loads
   */
  useEffect(() => {
    setLoading(true);
    
    // Fetch events from client-service on port 6001
    fetch('http://localhost:6001/api/events')
      .then((res) => {
        // Check if response is successful (status 200-299)
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json(); // Parse JSON response
      })
      .then((data) => {
        console.log('Events loaded:', data);
        setEvents(data); // Store events in state
      })
      .catch((err) => {
        // Handle errors (network issues, server down, etc.)
        console.error('Error loading events:', err);
        setPurchaseStatus('Failed to load events. Please make sure the server is running on port 6001.');
      })
      .finally(() => setLoading(false)); // Always stop loading spinner
  }, []);

  /**
   * Handle ticket purchase for a specific event
   * @param {number} eventId The ID of the event to purchase a ticket for
   * @param {string} eventName The name of the event (for display in status messages)
   */
  const buyTicket = async (eventId, eventName) => {
    try {
      setPurchaseStatus(`Processing ticket purchase for ${eventName}...`);
      
      const response = await fetch(`http://localhost:6001/api/events/${eventId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Check if purchase was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Purchase failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Purchase result:', result);
      
      /**
       * Update UI dynamically with new ticket count
       * Uses functional update to ensure we're working with latest state
       * Maps through events array and updates only the purchased event
       */
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event,  // Spread operator creates shallow copy to avoid mutating original
                ticket_count: result.tickets_available // Update with new ticket count
              }
            : event // Keep other events unchanged
        )
      );
      
      setPurchaseStatus(`Ticket successfully purchased for: ${eventName}`);
      
      // Clear status message after 5 seconds so users don't have to dismiss it
      setTimeout(() => setPurchaseStatus(''), 5000);
    } catch (err) {
      // Handle purchase errors (sold out, network issues, etc.)
      console.error('Error purchasing ticket:', err);
      setPurchaseStatus(`Failed to purchase ticket for ${eventName}. ${err.message}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setPurchaseStatus(''), 5000);
    }
  };

  /**
   * Loading state UI
   * Shows while initial event data is being fetched
   * aria-busy="true" tells screen readers content is loading
   */
  if (loading) {
    return (
      <div className="App" role="main">
        <header role="banner">
          <h1>Clemson Campus Events</h1>
        </header>
        <main>    
          <p aria-live="polite" aria-busy="true">Loading events...</p>
        </main>
      </div>
    );
  }

  /**
   * Main application UI
   * Displays event list with purchase functionality
   */
  return (
    <div className="App" role="main">
      {/* Header with semantic HTML for accessibility */}
      <header role="banner">
        <h1>Clemson Campus Events</h1>
      </header>
      
      {/* 
        Hidden status message for screen readers only
        aria-live="polite" announces changes when user is idle (not interrupting)
        aria-atomic="true" ensures entire message is read, not just changed parts
        .sr-only class hides visually but keeps accessible to screen readers
      */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {purchaseStatus}
      </div>

      {/* 
        Visual status display for sighted users
        role="alert" gives this high priority for screen readers
        Only shown when there's a status message to display
      */}
      {purchaseStatus && (
        <div 
          className="status-message"
          role="alert"
          aria-live="polite"
        >
          {purchaseStatus}
        </div>
      )}
      
      <main>
        {/* 
          Section contains all event listings
          aria-labelledby connects this section to its heading for screen readers
        */}
        <section aria-labelledby="events-heading">
          {/* 
            This provides context about what the list contains
          */}
          <h2 id="events-heading" className="sr-only">Available Events</h2>
          
          {/* Show message if no events are available */}
          {events.length === 0 ? (
            <p>No events available at this time.</p>
          ) : (
            <ul role="list" aria-label="List of campus events">
              {/* Map through events array to create list items */}
              {events.map((event) => {
                const ticketsAvailable = event.ticket_count || event.tickets_available || 0;
                const isSoldOut = ticketsAvailable === 0;
                
                return (
                  <li 
                    key={event.id} 
                    className="event-item"
                    role="listitem"
                    aria-label={`Event: ${event.name}`}
                  >
                    {/* Event information display */}
                    <div className="event-info">
                      <h3 className="event-name">{event.name}</h3>
                      <p className="event-date">
                        <strong>Date:</strong> {event.date}
                      </p>
                      {/* 
                        Ticket count with aria-live for dynamic updates
                        Screen readers will announce when this changes after purchase
                      */}
                      <p 
                        className="event-tickets"
                        aria-live="polite"
                      >
                        <strong>Tickets available: </strong> 
                        <span aria-label={`${ticketsAvailable} tickets remaining`}>
                          {ticketsAvailable}
                        </span>
                      </p>
                    </div>
                    
                    {/* 
                      Purchase button
                      disabled attribute prevents clicks when sold out
                    */}
                    <button
                      onClick={() => buyTicket(event.id, event.name)}
                      className="buy-ticket-btn"
                      disabled={isSoldOut}
                      aria-label={
                        isSoldOut 
                          ? `Sold out: ${event.name}` 
                          : `Buy ticket for ${event.name} on ${event.date}`
                      }
                      aria-describedby={`event-desc-${event.id}`}
                    >
                      {isSoldOut ? 'Sold Out' : 'Buy Ticket'}
                    </button>
                    
                    {/* 
                      Hidden description for screen readers
                      Provides additional context about the event and ticket availability
                      Connected to button via aria-describedby
                    */}
                    <div id={`event-desc-${event.id}`} className="sr-only">
                      {isSoldOut 
                        ? `This event is currently sold out.` 
                        : `Purchase a ticket for this event. ${ticketsAvailable} tickets remaining.`
                      }
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;