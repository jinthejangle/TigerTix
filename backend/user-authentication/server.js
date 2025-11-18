const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 4002;

// parse JSON and cookies
app.use(express.json());
app.use(cookieParser());

// CORS: frontend must be allowed and credentials enabled
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use('/auth', authRoutes);

app.get('/', (req, res) => res.json({ msg: 'user-authentication service' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`user-authentication running on ${PORT}`));
}

module.exports = app;