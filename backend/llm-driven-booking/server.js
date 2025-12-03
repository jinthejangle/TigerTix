/**
 * LLM microservice server for TigerTix
 * Handles natural language booking requests
 */

const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes/llmRoutes');

app.use(cors());
app.use(express.json());
app.use('/api/llm', routes);

const PORT = process.env.PORT || 7001;
app.listen(PORT, () => {
  console.log(`LLM Service running on ${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/llm/parse - Parse natural language requests');
  console.log('  POST /api/llm/confirm-booking - Confirm and process bookings');
});