/**
 * React frontend for TigerTix event management system
 * Connects to client microservice for event data and purchases
 * Includes LLM chatbot for natural language ticket booking
 */

import React, { useEffect, useState } from 'react';
import './App.css';

/**
 * Main App component for TigerTix event ticketing system
 * Displays a list of events and allows users to purchase tickets
 * Implements accessibility features for screen readers and keyboard navigation
 */
function App() {
  // State management
  const [events, setEvents] = useState([]);                 // Stores array of event objects from database
  const [loading, setLoading] = useState(false);            // Tracks loading state for initial fetch
  const [purchaseStatus, setPurchaseStatus] = useState(''); // Stores status messages for user feedback
  
  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);          // Controls chat window visibility
  const [messages, setMessages] = useState([]);             // Stores all chat messages
  const [inputMessage, setInputMessage] = useState('');     // Current user input text
  const [isProcessing, setIsProcessing] = useState(false);  // Loading state for API calls

  // Voice & TTS state/refs
  const [isListening, setIsListening] = useState(false);
  const [ttsOn, setTtsOn] = useState(true); // allow users to mute TTS if needed
  const recognitionRef = React.useRef(null);
  const abortRef = React.useRef(null); // track abort for cleanup
  
  // short 200ms A4 tone using Web Audio API
  function beep() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 440;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    o.start();
    o.stop(ctx.currentTime + 0.2);
  } 

  /** 
   * Create or reuse a SpeechRecognition instance 
   */ 
  const getRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    if (!recognitionRef.current) {
      const r = new SR();
      r.lang = 'en-US';
      r.interimResults = true;
      r.continuous = false;
      r.maxAlternatives = 1;

      r.onstart = () => setIsListening(true);
      r.onend = () => setIsListening(false);
      r.onerror = (e) => {
        console.error('SpeechRecognition error:', e);
        setIsListening(false);
      };

      let interim = '';
      r.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const tr = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += tr;
          else interim += tr;
        }
        if (interim) {
          // Show interim only if user hasn't typed something else
          setInputMessage(prev => (prev && prev.trim().length ? prev : interim));
        }
        if (finalTranscript) {
          setInputMessage(finalTranscript.trim()); // put final text in the box
          interim = '';
        }
      };

      recognitionRef.current = r;
    }
    return recognitionRef.current;
  };

  // --- Start voice capture ---
  const startListening = () => {
    const rec = getRecognition();
    if (!rec) {
      // Graceful fallback
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: "Sorry, your browser doesn’t support speech input. You can still type your request.",
        timestamp: new Date()
      }]);
      return;
    }
    beep();
    rec.start();
    abortRef.current = () => rec.abort();
  };

  // --- Stop voice capture ---
  const stopListening = () => {
    const rec = recognitionRef.current;
    if (rec) rec.stop();
  };

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current();
    };
  }, []);

  // --- Speak assistant responses ---
  const speakText = (text) => {
    if (!ttsOn || !text) return;
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;   // clarity
    u.pitch = 1.0;
    u.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find(v => /en[-_]/i.test(v.lang)) || voices[0];
    if (en) u.voice = en;
    window.speechSynthesis.cancel(); // avoid overlapping speech
    window.speechSynthesis.speak(u);
  };


  /**
   * Fetch events from client microservice on component mount
   */
  useEffect(() => {
    setLoading(true);
    
    fetch('http://localhost:6001/api/events')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Events loaded:', data);
        setEvents(data);
      })
      .catch((err) => {
        console.error('Error loading events:', err);
        setPurchaseStatus('Failed to load events. Please make sure the server is running on port 6001.');
      })
      .finally(() => setLoading(false));
  }, []);
  
  /**
   * Handle ticket purchase for a specific event
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Purchase failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Purchase result:', result);
      
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event,
                ticket_count: result.tickets_available
              }
            : event
        )
      );
      
      setPurchaseStatus(`Ticket successfully purchased for: ${eventName}`);
      setTimeout(() => setPurchaseStatus(''), 5000);
    } catch (err) {
      console.error('Error purchasing ticket:', err);
      setPurchaseStatus(`Failed to purchase ticket for ${eventName}. ${err.message}`);
      setTimeout(() => setPurchaseStatus(''), 5000);
    }
  };

  /**
   * Switches chatbot on and off and greets user. 
   */
  const toggleChat = () => {
    setChatOpen(!chatOpen);
    if (!chatOpen && messages.length === 0) {
      // Add welcome message when opening chat
      setMessages([{
        id: 1,
        text: "Hello! I'm your TigerTix chatbot. I can help you book tickets or show available events. How can I help you today?",
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  };

  /**
   * Handles user sending a message to the chatbot, validating the message, adding the message to chat history, 
   * handles bot response, and handles confirmation prompts.
   */
  const sendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:7001/api/llm/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }

      const data = await response.json();
      
      const botMessageId = Date.now() + 1;
      
      let botResponse = {
        id: botMessageId,
        sender: 'bot',
        timestamp: new Date(),
        requiresConfirmation: data.requires_confirmation,
        eventData: data,
        confirmationDisabled: false
      };

      if (data.requires_confirmation && data.event_name) {
        botResponse.text = `${data.message} Click "Confirm Booking" to proceed.`;
        // Pass the message ID to confirmBooking function
        botResponse.confirmAction = () => confirmBooking(data.event_name, data.ticket_count, botMessageId);
      } else {
        botResponse.text = data.message || "I'm not sure how to help with that. I can book tickets or show available events.";
      }

      setMessages(prev => [...prev, botResponse]);
      if (botResponse?.text) speakText(botResponse.text);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      speakText(errorMessage.text);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Finalizes booking after user confirmation
   * @param eventName Name of event to book tickets for
   * @param ticketCount Number of tickets to book (default 1)
   */
  const confirmBooking = async (eventName, ticketCount = 1, messageId) => {
    // Disable the button immediately in the message
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, confirmationDisabled: true }
        : msg
    ));
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('http://localhost:7001/api/llm/confirm-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          event_name: eventName, 
          ticket_count: ticketCount 
        }),
      });

      if (!response.ok) {
        throw new Error('Booking confirmation failed');
      }

      const result = await response.json();
      
      // Add confirmation message
      const confirmationMessage = {
        id: Date.now(),
        text: `${result.message}`,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, confirmationMessage]);
      speakText(confirmationMessage.text);

      // Refresh events to update ticket counts
      const eventsResponse = await fetch('http://localhost:6001/api/events');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }
      
    } catch (error) {
      console.error('Error confirming booking:', error);
      
      // Re-enable the button on error
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, confirmationDisabled: false }
          : msg
      ));
      
      const errorMessage = {
        id: Date.now(),
        text: "Failed to complete booking. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles keyboard input in chat
   * @param e event
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Loading state UI
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
   */
  return (
    <div className="App" role="main">
      {/* Header with semantic HTML for accessibility */}
      <header role="banner">
        <h1>Clemson Campus Events</h1>
      </header>
      
      {/* Status messages for screen readers */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {purchaseStatus}
      </div>

      {/* Visual status display */}
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
        {/* Events section */}
        <section aria-labelledby="events-heading">
          <h2 id="events-heading" className="sr-only">Available Events</h2>
          
          {events.length === 0 ? (
            <p>No events available at this time.</p>
          ) : (
            <ul role="list" aria-label="List of campus events">
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
                    
                    {/* Purchase button */}
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
                    
                    {/* Hidden description for screen readers */}
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

      {/* Chatbot Interface */}
      <div className="chatbot-container">
        {/* Chat toggle button */}
        <button 
          className="chat-toggle-btn"
          onClick={toggleChat}
          aria-label={chatOpen ? "Close chat" : "Open chat assistant"}
          aria-expanded={chatOpen}
        >
          💬
        </button>

        {/* Chat window */}
        {chatOpen && (
          <div className="chat-window" role="dialog" aria-label="Ticket booking assistant">
            <div className="chat-header">
              <h3>TigerTix Chatbot</h3>
              <button 
                onClick={toggleChat}
                className="close-chat"
                aria-label="Close chat"
              >
                ×
              </button>
            </div>

            <div className="chat-messages" aria-live="polite">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message ${message.sender}`}
                  role={message.sender === 'bot' ? 'status' : 'none'}
                >
                  <div className="message-content">
                    <p>{message.text}</p>
                    {message.requiresConfirmation && message.confirmAction && (
                      <button 
                        onClick={message.confirmAction}
                        className="confirm-booking-btn"
                        disabled={isProcessing || message.confirmationDisabled}
                      >
                        {isProcessing ? 'Processing...' : 
                        message.confirmationDisabled ? 'Booking Confirmed' : 'Confirm Booking'}
                      </button>
                    )}
                  </div>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isProcessing && (
                <div className="message bot" role="status">
                  <div className="message-content">
                    <p className="typing-indicator">Chatbot is typing...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="chat-input">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (e.g., 'Book 2 tickets for Jazz Night')"
                disabled={isProcessing}
                aria-label="Type your message to the chatbot"
              />
              {/* Microphone button */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`mic-btn ${isListening ? 'listening' : ''}`}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                title={isListening ? "Stop voice input" : "Start voice input"}
                disabled={isProcessing}
              >
                {isListening ? '🎙️…' : '🎤'}
              </button>

              {/* TTS toggle */}
              <button
                type="button"
                onClick={() => setTtsOn(v => !v)}
                className="tts-toggle-btn"
                aria-pressed={ttsOn}
                aria-label={ttsOn ? "Turn off spoken responses" : "Turn on spoken responses"}
                title={ttsOn ? "TTS: On" : "TTS: Off"}
              >
                🔊
              </button>

              <button 
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isProcessing}
                className="send-btn"
                aria-label="Send message"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;