// REMOVE all cookie-related code and return token in response
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findByEmail, findById } = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const TOKEN_TTL_SECONDS = 30 * 60; // 30 minutes

// Register
async function register(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const existing = await findByEmail(email);
    if (existing) return res.status(409).json({ error: 'user already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser(email, hashed);
    
    // Generate token for immediate login after registration
    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS + 's' });
    
    res.status(201).json({ 
      id: user.id, 
      email: user.email,
      token: token,
      expiresIn: TOKEN_TTL_SECONDS
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
}

// Login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const user = await findByEmail(email);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS + 's' });

    // NO COOKIES - just return token in response
    res.json({ 
      id: user.id, 
      email: user.email, 
      token: token,  // Send token in response
      expiresIn: TOKEN_TTL_SECONDS
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
}

// Logout (frontend just removes token from localStorage)
function logout(req, res) {
  res.json({ ok: true });
}

// verifyToken middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '');
  
  if (!token) {
    return res.status(401).json({ error: 'no token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: 'invalid or expired token' });
    }
    req.user = payload;
    next();
  });
}

// get current user (protected)
async function getCurrentUser(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
    const user = await findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json(user);
  } catch (err) {
    console.error('getCurrentUser error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
}

// Remove debugCookies function since we're not using cookies

module.exports = {
  register,
  login,
  logout,
  verifyToken,
  getCurrentUser
};