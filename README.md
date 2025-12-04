# **TigerTix — Clemson Campus Event Ticketing System**
### https://github.com/jinthejangle/TigerTix.git
### Demo Video: https://drive.google.com/file/d/1zu9YjYZTCiooz_qsrlQYWWQ077dvGIXT/view?usp=sharing
### Url: https://tiger-tix-gilt.vercel.app/


TigerTix is a full-stack microservices-based ticketing system built for Clemson University’s campus events.  
Users can browse events, purchase tickets, interact with an AI-powered assistant, and use voice input & text-to-speech accessibility features.

This system was developed across multiple sprints, focusing on microservices, authentication, accessibility, automated testing, and production deployment.

---

# **Project Overview**

TigerTix consists of a **React frontend** deployed on Vercel and four backend microservices deployed independently:

- **Authentication Service** – Handles registration, login, JWT issuance, cookie security  
- **Client Service** – Fetches events, processes ticket purchases  
- **Admin Service** – Creates and manages events  
- **LLM Service** – Parses natural language commands to extract intent & event info  
- **SQLite Databases** – One for each service, separated for microservice independence

Key features:

Secure token-based login  
Hashed password storage  
HTTP-only cookie sessions  
Natural-language event booking  
Accessible UI with voice input + TTS  
Automated test suite for regression testing  
Fully deployed distributed system

---

# **Tech Stack**

### **Frontend**
- React (Vercel)
- Web Speech API (Voice Input)
- Web Speech Synthesis (Text-to-Speech)
- ARIA accessibility enhancements

### **Backend Microservices**
| Service | Stack | Purpose |
|--------|-------|---------|
| **Auth Service** | Node.js, Express, SQLite, bcrypt, JWT | Login & registration |
| **Client Service** | Node.js, Express, SQLite | Event retrieval, ticket purchases |
| **Admin Service** | Node.js, Express, SQLite | Event creation & editing |
| **LLM Service** | Node.js, Express, SQLite | NL command parsing & booking intent |

### **Database**
- SQLite (per-service)

---

# **Architecture Summary**

TigerTix follows a microservice architecture with isolated responsibilities. Each backend service runs independently and communicates over HTTP.


## How the Services Communicate

### **1. Frontend → Auth Service**
- User registers or logs in
- Auth service returns:
  - HTTP-only cookie (`tigerTixToken`)
  - JSON response including `id`, `email`, and `token` for client-side Authorization headers

### **2. Frontend → Client Service**
- For ticket purchases and event retrieval
- Sends:
  - `Authorization: Bearer <token>` header  
  - `credentials: include` for cookie support
- Client service validates JWT using a shared secret

### **3. Frontend → LLM Service**
- User types or speaks natural-language queries (e.g., “Book 2 tickets for Jazz Night”)
- LLM service extracts:
  - Intent (purchase, lookup)
  - Event name
  - Ticket quantity
- LLM returns structured JSON used to trigger purchases

### **4. Frontend → Admin Service**
- (Optional for admins) Create or edit events
- Admin panel interacts with event database through this microservice

## Data Flow Summary

### **Login Flow**
1. User logs in  
2. Auth service:
   - Validates password (bcrypt)
   - Issues JWT
   - Sets HTTP-only cookie
   - Returns token in JSON
3. Frontend stores user token for cross-domain requests

### **Ticket Purchase Flow**
1. Frontend sends POST to Client Service  
2. Sends JWT via Authorization header  
3. Client service verifies token  
4. Deducts ticket in SQLite  
5. Returns updated event info to UI

### **LLM Booking Flow**
1. User speaks or types a natural-language request  
2. LLM service extracts parameters  
3. Frontend triggers purchase using the parsed intent  
4. Client service confirms ticket purchase  
5. Chatbot + TTS respond back to the user

---

# Installation & Setup
After cloning the repository:
1. Run all microservices:
  - Enter a backend microservice in the terminal (for instance, cd backend/client-service)
  - Run "node server.js"
  - Keep this terminal running, and create a new terminal
  - Repeat steps for each microservice
2. Run the frontend:
  - Go into the frontend directory
  - You might have to run "npm install" first
  - Run "npm start"

---

# Environment Variables Setup
After cloning the repository, nothing needs to be done to the Environmental Variables. 
All secrets and variables are already made. The microservices and the frontend should run without hindrance.

---

#  How to use regression tests
1. Open a terminal through either VSCode or Ming
2. Navigate into the backend directory
3. Run 'npm test' using whichever browser to test

---

# Roles

# 👥 Team Members & Roles

### **Project Team**
| Name | Role |
|------|------|
| **James Kluttz** | Developer, Accessibility Engineer |
| **Jin Ni** | Developer, LLM Intergration, Microservices Engineer |
| **Ethan Schaeffer** | Developer, Testing & Database Engineer |

### **Instructor**
- **Julian Langston Brinkley**

### **Teaching Assistants**
- **Colt Doster**  
- **Atik Enam**

---

# License

This project is licensed under the **MIT License**.

MIT License

Copyright (c) 2025 James Kluttz, Jin Ni, Ethan Schaeffer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


