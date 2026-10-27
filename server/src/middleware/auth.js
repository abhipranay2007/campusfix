const jwt = require('jsonwebtoken');
const User = require('../models/User');
function cookieOptions(production) { return { httpOnly: true, secure: production, sameSite: 'lax', path: '/', maxAge: 7 * 86400000 }; }
function createAuth(config) {
  async function authenticate(req, res, next) {
    try {
      const token = req.cookies?.campusfix_session;
      if (!token) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please log in to continue.' } });
      const payload = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(payload.sub);
      if (!user) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Your session is no longer valid. Please log in again.' } });
      req.user = user; next();
    } catch { res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Your session has expired. Please log in again.' } }); }
  }
  function staffOnly(req, res, next) {
    if (req.user?.role !== 'STAFF') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'This action is for campus staff.' } });
    next();
  }
  function setSession(res, user) {
    const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d', issuer: 'campusfix' });
    res.cookie('campusfix_session', token, cookieOptions(config.production));
  }
  return { authenticate, staffOnly, setSession, cookieOptions: cookieOptions(config.production) };
}
module.exports = { createAuth };
