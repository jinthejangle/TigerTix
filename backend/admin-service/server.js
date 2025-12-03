/**
 * Admin microservice server for TigerTix
 * Handles event creation and management
 * Connects to shared SQLite database
 */

const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes/adminRoutes');

app.use(cors({
  origin: [
    "tiger-tix-git-debugging-jins-projects-5df56599.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());    // Parse JSON input
app.use('/api/admin', routes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
