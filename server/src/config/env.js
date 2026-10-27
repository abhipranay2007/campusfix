const crypto = require('node:crypto');
function loadConfig() {
  const production = process.env.NODE_ENV === 'production';
  const secret = process.env.JWT_SECRET || '';
  if (production && (secret.length < 32 || /^change-me|replace-/i.test(secret))) {
    throw new Error('Set JWT_SECRET to a unique random value of at least 32 characters before starting in production.');
  }
  if (!production && secret.length < 32) throw new Error('JWT_SECRET is missing. Run `npm run setup` from the project root.');
  return {
    port: Number(process.env.PORT || 4000),
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusfix',
    jwtSecret: secret,
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    production,
  };
}
module.exports = { loadConfig };
