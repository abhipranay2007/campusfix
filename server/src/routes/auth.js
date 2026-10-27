const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
function authRoutes({ config, auth }) {
  const router = express.Router();
  const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } } });
  router.post('/register', loginLimit, async (req, res, next) => {
    try {
      const { name, email, password } = req.body || {};
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name must be between 2 and 80 characters.' } });
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Enter a valid email address.' } });
      if (typeof password !== 'string' || password.length < 8 || password.length > 128) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Password must contain 8 to 128 characters.' } });
      const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash: await bcrypt.hash(password, 12), role: 'STUDENT' });
      auth.setSession(res, user); res.status(201).json({ user: user.toJSON() });
    } catch (err) { next(err); }
  });
  router.post('/login', loginLimit, async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      const user = typeof email === 'string' && typeof password === 'string' ? await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash') : null;
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
      auth.setSession(res, user); res.json({ user: user.toJSON() });
    } catch (err) { next(err); }
  });
  router.post('/logout', (_req, res) => { res.clearCookie('campusfix_session', { ...auth.cookieOptions, maxAge: undefined }); res.json({ message: 'Logged out.' }); });
  router.get('/me', auth.authenticate, (req, res) => res.json({ user: req.user.toJSON() }));
  return router;
}
module.exports = authRoutes;
