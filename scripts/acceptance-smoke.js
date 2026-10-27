require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const path = require('node:path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../server/src/models/User');

const serverDir = path.join(__dirname, '..', 'server');
const baseMongoUri = process.env.CAMPUSFIX_TEST_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusfix';
const testDb = `campusfix_acceptance_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const mongoUrl = new URL(baseMongoUri);
mongoUrl.pathname = `/${testDb}`;
const mongoUri = mongoUrl.toString();
const port = 4200 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}/api/v1`;
const env = { ...process.env, MONGODB_URI: mongoUri, PORT: String(port), NODE_ENV: 'development', JWT_SECRET: crypto.randomBytes(48).toString('base64url'), CLIENT_ORIGIN: 'http://127.0.0.1:5173' };
let apiProcess;

function check(condition, message) { if (!condition) throw new Error(`Acceptance check failed: ${message}`); console.log(`PASS ${message}`); }
async function waitForApi() {
  for (let i = 0; i < 60; i++) {
    if (apiProcess.exitCode !== null) throw new Error('API process exited before becoming ready. Is MongoDB reachable?');
    try { const response = await fetch(`${base}/health`); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Timed out waiting for the API. Check the MongoDB service and connection URL.');
}
async function startApi() {
  apiProcess = spawn(process.execPath, ['src/server.js'], { cwd: serverDir, env, stdio: 'inherit' });
  await waitForApi();
}
async function stopApi() {
  if (!apiProcess || apiProcess.exitCode !== null) return;
  apiProcess.kill('SIGTERM');
  await new Promise(resolve => { apiProcess.once('exit', resolve); setTimeout(resolve, 3000); });
}
async function request(route, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`${base}${route}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let data = {}; try { data = await response.json(); } catch {}
  return { response, data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
async function register(name, email, password, extra = {}) {
  const result = await request('/auth/register', { method: 'POST', body: { name, email, password, ...extra } });
  check(result.response.status === 201, `registration succeeds for ${email}`);
  return { ...result.data.user, cookie: result.cookie };
}

(async () => {
  let failure;
  try {
    await startApi();
    const tag = crypto.randomBytes(4).toString('hex');
    const studentEmail = `student-${tag}@example.test`;
    const studentPassword = 'CampusFix!Test1';
    const student = await register('Campus Student', studentEmail, studentPassword, { role: 'STAFF' });
    check(student.role === 'STUDENT', 'public registration cannot choose staff role');
    const studentLogin = await request('/auth/login', { method: 'POST', body: { email: studentEmail, password: studentPassword } });
    check(studentLogin.response.status === 200 && studentLogin.data.user.role === 'STUDENT', 'student can log in with valid credentials');
    const invalidLogin = await request('/auth/login', { method: 'POST', body: { email: student.email, password: 'not-the-password' } });
    check(invalidLogin.response.status === 401, 'invalid login is rejected');
    const invalidReport = await request('/issues', { method: 'POST', cookie: student.cookie, body: { title: 'x' } });
    check(invalidReport.response.status === 400, 'incomplete issue is rejected');
    const issueResult = await request('/issues', { method: 'POST', cookie: student.cookie, body: { title: 'Library sink is leaking', description: 'The sink near the second-floor study rooms has been leaking since yesterday.', category: 'PLUMBING', location: 'Central Library, floor 2', severity: 'HIGH' } });
    check(issueResult.response.status === 201, 'student can submit an issue');
    const issueId = issueResult.data.issue._id;
    const ownSupport = await request(`/issues/${issueId}/support`, { method: 'POST', cookie: student.cookie });
    check(ownSupport.response.status === 400, 'report creator cannot support their own issue');
    const forbiddenDashboard = await request('/dashboard', { cookie: student.cookie });
    check(forbiddenDashboard.response.status === 403, 'student is blocked from staff analytics');
    const second = await register('Second Student', `second-${tag}@example.test`, 'CampusFix!Test2');
    const support = await request(`/issues/${issueId}/support`, { method: 'POST', cookie: second.cookie });
    check(support.response.status === 200, 'another student can support an issue');
    const duplicateSupport = await request(`/issues/${issueId}/support`, { method: 'POST', cookie: second.cookie });
    check(duplicateSupport.response.status === 409, 'duplicate support is rejected without increasing the count');
    const removeSupport = await request(`/issues/${issueId}/support`, { method: 'DELETE', cookie: second.cookie });
    check(removeSupport.response.status === 200, 'student can remove their support');
    const addSupportAgain = await request(`/issues/${issueId}/support`, { method: 'POST', cookie: second.cookie });
    check(addSupportAgain.response.status === 200, 'student can add support again after removing it');
    const staffEmail = `staff-${tag}@example.test`;
    const staffPassword = `Staff-${crypto.randomBytes(14).toString('hex')}!`;
    await mongoose.connect(mongoUri);
    await User.create({ name: 'Campus Staff', email: staffEmail, passwordHash: await bcrypt.hash(staffPassword, 12), role: 'STAFF' });
    await mongoose.disconnect();
    check(true, 'staff account fixture is stored with a password hash');
    const staffLogin = await request('/auth/login', { method: 'POST', body: { email: staffEmail, password: staffPassword } });
    check(staffLogin.response.status === 200 && staffLogin.data.user.role === 'STAFF', `staff account can sign in (HTTP ${staffLogin.response.status}, ${staffLogin.data.error?.code || 'no API error code'})`);
    const staffCookie = staffLogin.cookie;
    const studentStatus = await request(`/issues/${issueId}/status`, { method: 'PATCH', cookie: student.cookie, body: { status: 'UNDER_REVIEW' } });
    check(studentStatus.response.status === 403, 'student cannot change issue status');
    const skipped = await request(`/issues/${issueId}/status`, { method: 'PATCH', cookie: staffCookie, body: { status: 'IN_PROGRESS' } });
    check(skipped.response.status === 409, 'invalid status transition is rejected');
    for (const [status, comment] of [['UNDER_REVIEW', 'The team is reviewing the report.'], ['IN_PROGRESS', 'Maintenance has started work.'], ['RESOLVED', 'The leaking sink was repaired.']]) {
      const update = await request(`/issues/${issueId}/status`, { method: 'PATCH', cookie: staffCookie, body: { status, comment } });
      check(update.response.status === 200 && update.data.issue.status === status, `staff can move issue to ${status}`);
    }
    const staffComment = await request(`/issues/${issueId}/comments`, { method: 'POST', cookie: staffCookie, body: { comment: 'Resolution details are available to the reporter.' } });
    check(staffComment.response.status === 200 && staffComment.data.issue.activity.some(event => event.message === 'Resolution details are available to the reporter.'), 'staff can add a separate activity comment');
    const detail = await request(`/issues/${issueId}`, { cookie: student.cookie });
    check(detail.response.status === 200 && detail.data.issue.activity.length >= 5, 'student sees status and recorded activity history');
    const dashboard = await request('/dashboard', { cookie: staffCookie });
    check(dashboard.response.status === 200 && dashboard.data.metrics.total === 1 && dashboard.data.metrics.resolved === 1, 'staff analytics reflect stored issue data');
    check(dashboard.data.byCategory.PLUMBING === 1 && dashboard.data.recentActivity.length >= 4, 'category and recent activity data match issue history');
    const filtered = await request('/issues?category=PLUMBING&location=Central%20Library&severity=HIGH&status=RESOLVED', { cookie: staffCookie });
    check(filtered.response.status === 200 && filtered.data.issues.length === 1, 'staff filters work across category, location, severity, and status');
    const badId = await request('/issues/not-an-id', { cookie: student.cookie });
    check(badId.response.status === 400, 'invalid issue identifier returns a client error');
    const missingAuth = await request('/dashboard');
    check(missingAuth.response.status === 401, 'protected endpoint rejects unauthenticated requests');
    await stopApi();
    await startApi();
    const restored = await request(`/issues/${issueId}`, { cookie: student.cookie });
    check(restored.response.status === 200 && restored.data.issue.status === 'RESOLVED', 'issue data persists across an API restart');
    const restoredSession = await request('/auth/me', { cookie: student.cookie });
    check(restoredSession.response.status === 200 && restoredSession.data.user.role === 'STUDENT', 'authenticated session restores after an API restart');
    console.log('CampusFix acceptance checks passed.');
  } catch (err) {
    failure = err;
    console.error(err.message);
  } finally {
    await stopApi();
    try { await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 }); await mongoose.connection.dropDatabase(); await mongoose.disconnect(); } catch { try { await mongoose.disconnect(); } catch {} }
  }
  if (failure) process.exitCode = 1;
})().catch(err => { console.error(err.message); process.exitCode = 1; });
