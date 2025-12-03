/**
 * Client microservice server for TigerTix
 * Handles event browsing and ticket purchases
 * Connects to app frontend and shared SQLite database
 */

const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes/clientRoutes');

app.use(cors({
  origin: ["http://localhost:3000", "tiger-tix-gilt.vercel.app"],
  credentials: true
}));
app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 6001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));