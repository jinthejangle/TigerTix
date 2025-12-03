/**
 * Client microservice server for TigerTix
 */

const express = require('express');
const cors = require('cors');
const routes = require('./routes/clientRoutes');

const app = express();

app.use(cors({
  origin: "https://tiger-tix-gilt.vercel.app",
  credentials: false // No cookies needed
}));

app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 6001;
app.listen(PORT, () => console.log(`client-service running on port ${PORT}`));