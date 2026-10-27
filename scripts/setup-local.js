const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('.env already exists; leaving it unchanged.');
  process.exit(0);
}
const template = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
const secret = crypto.randomBytes(48).toString('base64url');
fs.writeFileSync(envPath, template.replace('replace-with-a-random-secret-of-at-least-32-characters', secret), { mode: 0o600, flag: 'wx' });
console.log('Created private .env with a random local JWT secret.');
