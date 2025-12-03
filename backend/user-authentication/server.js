/**
 * User Authentication microservice for TigerTix
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: "https://tiger-tix-gilt.vercel.app",
  credentials: true,
  exposedHeaders: ['Set-Cookie']
}));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ msg: 'user-authentication service' });
});

app.listen(PORT, () =>
  console.log(`user-authentication running on port ${PORT}`)
);

module.exports = app;
