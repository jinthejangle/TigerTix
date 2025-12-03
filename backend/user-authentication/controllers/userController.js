const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findByEmail, findById } = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const COOKIE_NAME = 'tiger_token';
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
    res.status(201).json({ id: user.id, email: user.email });
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

    // Debug logging
    console.log('Login successful for:', email);
    console.log('Setting cookie with name:', COOKIE_NAME);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('secure setting:', process.env.NODE_ENV === 'production');
    console.log('sameSite setting:', process.env.NODE_ENV === 'production' ? 'none' : 'lax');

    // Set HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: TOKEN_TTL_SECONDS * 1000,
    };
    
    // Add domain if needed for cross-subdomain
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    
    res.cookie(COOKIE_NAME, token, cookieOptions);

    // return user info (no token in body; cookie holds it)
    res.json({ 
      id: user.id, 
      email: user.email, 
      expiresIn: TOKEN_TTL_SECONDS,
      debug: {
        cookieSet: true,
        options: cookieOptions
      }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
}

// Logout
function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ ok: true });
}

// verifyToken (acts as middleware; export so other services can require it)
function verifyToken(req, res, next) {
  const token = (req.cookies && req.cookies[COOKIE_NAME]) || (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) return res.status(401).json({ error: 'no token provided' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      // jwt expired or invalid
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

// Add to userController.js:
async function debugCookies(req, res) {
  console.log('=== DEBUG COOKIES ===');
  console.log('Cookies received:', req.cookies);
  console.log('Headers:', {
    origin: req.headers.origin,
    cookie: req.headers.cookie,
    'user-agent': req.headers['user-agent']
  });
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  res.json({
    cookies: req.cookies,
    headers: {
      origin: req.headers.origin,
      hasCookieHeader: !!req.headers.cookie
    },
    hasToken: !!req.cookies[COOKIE_NAME],
    COOKIE_NAME: COOKIE_NAME
  });
}

// Add to exports:
module.exports = {
  register,
  login,
  logout,
  verifyToken,
  getCurrentUser,
  debugCookies,  // Add this
  _internal: {
    COOKIE_NAME,
    JWT_SECRET,
    TOKEN_TTL_SECONDS
  }
};