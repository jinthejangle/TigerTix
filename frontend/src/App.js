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
  const [showConfirmation, setShowConfirmation] = useState(false);  // Controls confirmation modal visibility
  const [pendingBooking, setPendingBooking] = useState(null);   // Stores details of pending booking for confirmation
  
  // Authentication state (updated - single modal approach)
  const [user, setUser] = useState(null);                   // { id, email } when logged in
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");

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
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(ctx.destination);
    gain.gain.value = 0.1;
    osc.frequency.value = 440;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
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
      r.continuous = true;
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
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setInputMessage(finalTranscript.trim());
        } else if (interimTranscript) {
          setInputMessage(prev => prev.trim() ? prev : interimTranscript);
        }
      };

      recognitionRef.current = r;
    }
    return recognitionRef.current;
  };

  // Start voice capture
  const startListening = () => {
    const rec = getRecognition();
    if (!rec) {
      // Graceful fallback
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: "Sorry, your browser doesn't support speech input. You can still type your request.",
        timestamp: new Date()
      }]);
      return;
    }
    beep();
    rec.start();
    abortRef.current = () => rec.abort();
  };

  // Stop voice capture
  const stopListening = () => {
    const rec = recognitionRef.current;
    if (rec) rec.stop();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current();
    };
  }, []);

  /**
   * Handles text-to-speech for bot messages
   * @param text The text to be spoken
   */
  const speakText = (text) => {
    if (!ttsOn || !text || !window.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => /en[-_]/i.test(v.lang));
    
    if (englishVoice) utterance.voice = englishVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
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
   * Check current authenticated user on app load
   * Calls user-authentication /auth/me to determine session (cookie-based)
   */
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('http://localhost:4002/api/auth/me', {
          method: 'GET',
          credentials: 'include' // send HTTP-only cookie
        });
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = await res.json();
        setUser({ id: data.id, email: data.email });
      } catch (err) {
        console.error('fetchMe error', err);
        setUser(null);
      }
    };
    fetchMe();
  }, []);

  /**
   * Handle ticket purchase for a specific event
   */
  const buyTicket = (eventId, eventName) => {
    // If the user is not logged in, block purchase
    if (!user) {
      setPurchaseStatus("You must be logged in to buy tickets.");
      setShowAuthModal(true);     // Open auth modal
      setAuthMode("login");       // Default to login tab
      return;                     // Do NOT continue to confirmation
    }

    // If the user *is* logged in, allow confirmation modal
    setPendingBooking({ eventId, eventName });
    setShowConfirmation(true);
  };

  // New function to handle confirmed booking
  const confirmPurchase = async () => {
    if (!pendingBooking) return;
    
    const { eventId, eventName } = pendingBooking;
    
    try {
      setPurchaseStatus(`Processing ticket purchase for ${eventName}...`);
      setShowConfirmation(false);
      
      // Optimistically update the UI immediately
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event,
                // Decrease ticket count immediately
                ticket_count: Math.max(0, event.ticket_count - 1)
              }
            : event
        )
      );
      
      const response = await fetch(`http://localhost:6001/api/events/${eventId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // ensure HTTP-only cookie is sent so booking service can verify session
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Purchase failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Update with server data (no visual change since we already updated)
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
      
      // Revert the optimistic update on error
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event,
                // Restore original ticket count
                ticket_count: event.ticket_count + 1
              }
            : event
        )
      );
      
      setPurchaseStatus(`Failed to purchase ticket for ${eventName}. ${err.message}`);
      setTimeout(() => setPurchaseStatus(''), 5000);
    } finally {
      setPendingBooking(null);
    }
  };

  // Function to cancel purchase
  const cancelPurchase = () => {
    setShowConfirmation(false);
    setPendingBooking(null);
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
      
      const botResponse = {
        id: Date.now() + 1,
        sender: 'bot',
        timestamp: new Date(),
        text: data.requires_confirmation && data.event_name
          ? `${data.message} Click "Confirm Booking" to proceed.`
          : (data.message || "I'm not sure how to help with that. I can book tickets or show available events."),
        requiresConfirmation: data.requires_confirmation,
        eventData: data,
        confirmationDisabled: false
      };

      if (data.requires_confirmation && data.event_name) {
        botResponse.confirmAction = () => confirmBooking(data.event_name, data.ticket_count, botResponse.id);
      }

      setMessages(prev => [...prev, botResponse]);
      if (botResponse.text) speakText(botResponse.text);

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
   * Handles authentication form submission
   */
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    // Validate passwords match for registration
    if (authMode === "register" && authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    try {
      const endpoint = authMode === "login" ? "login" : "register";
      const body = authMode === "login" 
        ? { email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword, confirmPassword: authConfirmPassword };

      const res = await fetch(`http://localhost:4002/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || `${authMode === "login" ? "Login" : "Registration"} failed`);
        return;
      }

      // Success - set user and close modal
      setUser({ id: data.id, email: data.email });
      setShowAuthModal(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthConfirmPassword("");
      setAuthError("");
      
    } catch (err) {
      console.error(`${authMode} error:`, err);
      setAuthError(`${authMode === "login" ? "Login" : "Registration"} failed. Please try again.`);
    }
  };

  /**
   * Reset auth form when switching modes
   */
  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setAuthError("");
    setAuthPassword("");
    setAuthConfirmPassword("");
  };

  /**
   * Close auth modal and reset form
   */
  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthError("");
    setAuthEmail("");
    setAuthPassword("");
    setAuthConfirmPassword("");
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
      <header role="banner" style={{ position: 'relative' }}>
        <h1>Clemson Campus Events</h1>

        {/* AUTH BUTTONS (top-right) */}
        <div style={{
          position: 'absolute',
          right: 16,
          top: 12,
          display: 'flex',
          gap: 8,
          alignItems: 'center'
        }}>
          {!user ? (
            <>
              <button 
                onClick={() => {
                  setShowAuthModal(true);
                  setAuthMode("login");
                }} 
                className="auth-header-btn"
                aria-label="Open login"
              >
                Login
              </button>
              <button 
                onClick={() => {
                  setShowAuthModal(true);
                  setAuthMode("register");
                }} 
                className="auth-header-btn"
                aria-label="Open register"
              >
                Register
              </button>
            </>
          ) : (
            <>
              <span style={{ marginRight: 8, color: '#ffffff' }}>Logged in as {user.email}</span>
              <button 
                onClick={async () => {
                  // call logout endpoint to clear cookie
                  try {
                    await fetch('http://localhost:4002/api/auth/logout', {
                      method: 'POST',
                      credentials: 'include'
                    });
                  } catch (e) {
                    console.error('logout error', e);
                  }
                  setUser(null);
                }} 
                className="auth-header-btn"
                aria-label="Logout"
              >
                Logout
              </button>
            </>
          )}
        </div>
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
                const ticketsAvailable = event.ticket_count ?? 0;
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

      {/* Confirmation Modal */}
      {showConfirmation && pendingBooking && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal" role="dialog" aria-labelledby="confirmation-title">
            <h3 id="confirmation-title">Confirm Ticket Purchase</h3>
            <p>Are you sure you want to purchase a ticket for <strong>"{pendingBooking.eventName}"</strong>?</p>
            <div className="confirmation-buttons">
              <button 
                onClick={cancelPurchase}
                className="cancel-btn"
                aria-label="Cancel purchase"
              >
                Cancel
              </button>
              <button 
                onClick={confirmPurchase}
                className="confirm-purchase-btn"
                aria-label="Confirm ticket purchase"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Combined Authentication Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={closeAuthModal}>
          <div 
            className="auth-modal"
            role="dialog"
            aria-labelledby="auth-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="auth-modal-title">
              {authMode === "login" ? "Login to TigerTix" : "Create an Account"}
            </h2>
            
            {/* Tabs for switching between login/register */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${authMode === "login" ? "active" : ""}`}
                onClick={() => switchAuthMode("login")}
                aria-pressed={authMode === "login"}
                aria-label="Switch to login form"
              >
                Login
              </button>
              <button
                className={`auth-tab ${authMode === "register" ? "active" : ""}`}
                onClick={() => switchAuthMode("register")}
                aria-pressed={authMode === "register"}
                aria-label="Switch to registration form"
              >
                Register
              </button>
            </div>

            {/* Error message display */}
            {authError && (
              <div className="auth-error" role="alert">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              <div>
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  aria-required="true"
                />
              </div>

              {authMode === "register" && (
                <div>
                  <label htmlFor="auth-confirm-password">Confirm Password</label>
                  <input
                    id="auth-confirm-password"
                    type="password"
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    aria-required="true"
                  />
                </div>
              )}

              <button 
                type="submit" 
                className="auth-btn"
                disabled={isProcessing}
              >
                {authMode === "login" ? "Login" : "Create Account"}
              </button>
            </form>

            <button
              className="close-auth-btn"
              onClick={closeAuthModal}
              aria-label="Close authentication modal"
            >
              Close
            </button>
          </div>
        </div>
      )}

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