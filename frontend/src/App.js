// import React, { useEffect, useState } from 'react';
// import './App.css';

// function App() {
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Fetch events from client microservice on port 5000
//   useEffect(() => {
//     setLoading(true);
//     fetch('http://localhost:5000/api/events')
//       .then((res) => res.json())        // Parses JSON response
//       .then((data) => setEvents(data))  // Stores parsed data
//       .catch((err) => {                 // Makes sure events are loaded properly
//         console.error(err);
//         alert('Failed to load events. Please try again later.');
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const buyTicket = async (eventId, eventName) => {
//     try {
//       // Send POST request to purchase endpoint
//       const response = await fetch(`http://localhost:5000/api/events/${eventId}/purchase`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`Purchase failed: ${response.status}`);
//       }

//       const result = await response.json();
      
//       // Update UI dynamically with new ticket count
//       setEvents(prevEvents => 
//         prevEvents.map(event => 
//           event.id === eventId 
//             ? { 
//                 ...event,   // ...event creates shallow copy to avoid mutating og event object
//                 tickets_available: result.tickets_available || event.tickets_available - 1
//               }
//             : event
//         )
//       );
      
//       // Update status for screen readers
//       setPurchaseStatus(`Ticket successfully purchased for: ${eventName}`);
      
//       // Clear status after 5 seconds so visually impaired users don't need to find close button
//       setTimeout(() => setPurchaseStatus(''), 5000);
//     } catch (err) {
//       console.error('Error purchasing ticket:', err);
//       setPurchaseStatus(`Failed to purchase ticket for ${eventName}. Please try again.`);
//     }
//   };

//   /* (notes for myself) aria-live="polite" announces text when it changes, but only when user is idle
//     aria-live="assertive" interrupts to announce text immediately, ex. for urgent matters
//     aria-busy="true" tells screen reader that content is loading */
//   const [purchaseStatus, setPurchaseStatus] = useState(''); 

//   if (loading) {
//     return (
//       <div className="App" role="main">
//         <header role="banner">
//           <h1>Clemson Campus Events</h1>
//         </header>
//         <main>    
//           <p aria-live="polite" aria-busy="true">Loading events...</p>
//         </main>
//       </div>
//     );
//   }

//   return (
//     <div className="App" role="main">
//       <header role="banner">
//         <h1>Clemson Campus Events</h1>
//       </header>
      
//       {/* 
//         ARIA live "settings" for screen readers to announce status changes
//         aria-atomic ensures whole region is read, not just changed text
//         sr-only hides element visually but keeps it accessible to screen readers 
//       */}
//       <div 
//         aria-live="polite" 
//         aria-atomic="true"
//         className="sr-only"
//       >
//         {purchaseStatus}
//       </div>
      
//       <main>
//         <section aria-labelledby="events-heading">
//           <h2 id="events-heading" className="sr-only">Available Events</h2>
          
//           {events.length === 0 ? (
//             <p>No events available at this time.</p>
//           ) : (
//             <ul role="list" aria-label="List of campus events">
//               {events.map((event, index) => {
//                 const ticketsAvailable = event.tickets_available || event.ticketsAvailable || 0;
//                 const isSoldOut = ticketsAvailable === 0;
                
//                 return (
//                   <li 
//                     key={event.id} 
//                     className="event-item"
//                     role="listitem"
//                     aria-label={`Event: ${event.name}`}
//                   >
//                     <div className="event-info">
//                       <h3 className="event-name">{event.name}</h3>
//                       <p className="event-date">
//                         <strong>Date:</strong> {event.date}
//                       </p>
//                       <p 
//                         className="event-tickets"
//                         aria-live="polite"
//                       >
//                         <strong>Tickets available:</strong> 
//                         <span aria-label={`${ticketsAvailable} tickets remaining`}>
//                           {ticketsAvailable}
//                         </span>
//                       </p>
//                     </div>
//                     <button
//                       onClick={() => buyTicket(event.id, event.name)}
//                       className="buy-ticket-btn"
//                       disabled={isSoldOut}
//                       aria-label={
//                         isSoldOut 
//                           ? `Sold out: ${event.name}` 
//                           : `Buy ticket for ${event.name} on ${event.date}`
//                       }
//                       aria-describedby={`event-desc-${event.id}`}
//                     >
//                       {isSoldOut ? 'Sold Out' : 'Buy Ticket'}
//                     </button>
//                     <div id={`event-desc-${event.id}`} className="sr-only">
//                       {isSoldOut 
//                         ? `This event is currently sold out.` 
//                         : `Purchase a ticket for this event. ${ticketsAvailable} tickets remaining.`
//                       }
//                     </div>
//                   </li>
//                 );
//               })}
//             </ul>
//           )}
//         </section>
//       </main>
//     </div>
//   );
// }

// export default App;

import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock data for testing frontend without backend
  const mockEvents = [
    {
      id: 1,
      name: "Clemson Football Game vs South Carolina",
      date: "2024-11-30",
      tickets_available: 150
    },
    {
      id: 2,
      name: "Spring Music Festival",
      date: "2024-04-15",
      tickets_available: 75
    },
    {
      id: 3,
      name: "Computer Science Career Fair",
      date: "2024-03-22",
      tickets_available: 0
    },
    {
      id: 4,
      name: "Art Gallery Opening",
      date: "2024-05-10",
      tickets_available: 25
    }
  ];

  // Mock fetch function to simulate API call
  const fetchMockEvents = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockEvents);
      }, 1000); // Simulate network delay
    });
  };

  // Mock purchase function
  const mockPurchaseTicket = (eventId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const event = mockEvents.find(e => e.id === eventId);
        if (!event) {
          reject(new Error('Event not found'));
          return;
        }
        
        if (event.tickets_available <= 0) {
          reject(new Error('No tickets available'));
          return;
        }
        
        // Simulate successful purchase
        resolve({
          tickets_available: event.tickets_available - 1
        });
      }, 500); // Simulate processing time
    });
  };

  // Fetch events from mock data instead of actual API
  useEffect(() => {
    setLoading(true);
    fetchMockEvents()
      .then((data) => setEvents(data))
      .catch((err) => {
        console.error(err);
        setPurchaseStatus('Failed to load events. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, []);

  const buyTicket = async (eventId, eventName) => {
    try {
      setPurchaseStatus(`Processing ticket purchase for ${eventName}...`);
      
      // Use mock purchase function instead of actual API call
      const result = await mockPurchaseTicket(eventId);
      
      // Update UI dynamically with new ticket count
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event,
                tickets_available: result.tickets_available
              }
            : event
        )
      );
      
      // Update status for screen readers
      setPurchaseStatus(`Ticket successfully purchased for: ${eventName}`);
      
      // Clear status after 5 seconds
      setTimeout(() => setPurchaseStatus(''), 5000);
    } catch (err) {
      console.error('Error purchasing ticket:', err);
      setPurchaseStatus(`Failed to purchase ticket for ${eventName}. ${err.message}`);
    }
  };

  const [purchaseStatus, setPurchaseStatus] = useState(''); 

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

  return (
    <div className="App" role="main">
      <header role="banner">
        <h1>Clemson Campus Events</h1>
      </header>
      
      {/* Status message for screen readers */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {purchaseStatus}
      </div>

      {/* Visual status display for sighted users */}
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
        <section aria-labelledby="events-heading">
          <h2 id="events-heading" className="sr-only">Available Events</h2>
          
          {events.length === 0 ? (
            <p>No events available at this time.</p>
          ) : (
            <ul role="list" aria-label="List of campus events">
              {events.map((event) => {
                const ticketsAvailable = event.tickets_available || event.ticketsAvailable || 0;
                const isSoldOut = ticketsAvailable === 0;
                
                return (
                  <li 
                    key={event.id} 
                    className="event-item"
                    role="listitem"
                    aria-label={`Event: ${event.name}`}
                  >
                    <div className="event-info">
                      <h3 className="event-name">{event.name}</h3>
                      <p className="event-date">
                        <strong>Date:</strong> {event.date}
                      </p>
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