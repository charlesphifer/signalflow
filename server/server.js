import express from 'express';
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { hashPassword, verifyPassword, signToken, verifyToken } from './auth.js';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';

const app = express();
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = process.env.DATA_DIR || '/data';
const DATA_FILE = join(DATA_DIR, 'projects.json');
const PEOPLE_FILE = join(DATA_DIR, 'people.json');
const DRAFTS_FILE = join(DATA_DIR, 'drafts.json');
const USERS_FILE = join(DATA_DIR, 'users.json');

mkdirSync(DATA_DIR, { recursive: true });

function readJson(file, fallback) {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch (err) {
    console.error(`Read error (${file}):`, err.message);
    return fallback;
  }
}

function writeJsonAtomic(file, data) {
  const tmp = file + '.tmp';
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  renameSync(tmp, file);
}

// ---- Seed users on first boot ----
function seedUsers() {
  let users = readJson(USERS_FILE, null);
  if (users && users.length > 0) return;
  users = [
    { id: 'u-admin', username: 'charles', password: hashPassword('ChangeMe-Demo2026!'), roles: ['admin', 'engineer'], displayName: 'Charles Phifer', email: 'cphifer3@gmail.com' },
    { id: 'u-eng1', username: 'demo-engineer', password: hashPassword('engineer123'), roles: ['engineer'], displayName: 'Demo Engineer' },
    { id: 'u-view1', username: 'demo-viewer', password: hashPassword('viewer123'), roles: ['viewer'], displayName: 'Demo Viewer' },
  ];
  writeJsonAtomic(USERS_FILE, users);
  console.log('Seeded default users (charles / demo-engineer / demo-viewer)');
}
seedUsers();

// ── Login audit + notification ──
const LOGIN_LOG = join(DATA_DIR, 'logins.json');
const FAILED_LOG = join(DATA_DIR, 'failed_logins.json');
const HASS_URL = process.env.HASS_URL || '';
const HASS_TOKEN = process.env.HASS_TOKEN || '';
const NOTIFY_SERVICE = process.env.HASS_NOTIFY_SERVICE || 'notify'; // app notification only
const SILENT_USERNAMES = (process.env.LOGIN_SILENT_USERS || 'charles').split(',').map(s => s.trim().toLowerCase());

function recordLogin(username, ip, notified) {
  try {
    const log = readJson(LOGIN_LOG, []);
    log.unshift({ at: new Date().toISOString(), username, ip, notified });
    writeJsonAtomic(LOGIN_LOG, log.slice(0, 500));
  } catch (err) { console.error('Login log error:', err.message); }
}

function recordFailedLogin(username, ip, reason) {
  try {
    const log = readJson(FAILED_LOG, []);
    log.unshift({ at: new Date().toISOString(), username, ip, reason });
    writeJsonAtomic(FAILED_LOG, log.slice(0, 500));
  } catch (err) { console.error('Failed login log error:', err.message); }
}

// Send email via AgentMail REST (no SDK dependency)
const AGENTMAIL_KEY = process.env.AGENTMAIL_API_KEY || '';
const AGENTMAIL_INBOX = process.env.AGENTMAIL_INBOX || 'jarvis0772@agentmail.to';
const APP_BASE_URL = process.env.APP_BASE_URL || '';

async function sendResetEmail(to, displayName, resetToken, username) {
  if (!AGENTMAIL_KEY) return false;
  const link = `${APP_BASE_URL.replace(/\/$/, '')}/signalflow/?reset=${encodeURIComponent(resetToken)}&user=${encodeURIComponent(username)}`;
  const body = [
    `Hi ${displayName || 'there'},`,
    ``,
    `A password reset was requested for your SignalFlow account.`,
    `Open the link below within 15 minutes to set a new password:`,
    ``,
    link,
    ``,
    `If you did not request this, you can ignore this email — the link expires on its own.`,
    ``,
    `— SignalFlow`,
  ].join('\n');
  try {
    const res = await fetch(`https://api.agentmail.to/v0/inboxes/${encodeURIComponent(AGENTMAIL_INBOX)}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AGENTMAIL_KEY}` },
      body: JSON.stringify({ to: [to], subject: 'SignalFlow — Password Reset', text: body }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch { return false; }
}

function notifyHomeAssistant(text) {
  if (!HASS_URL || !HASS_TOKEN) return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      const url = new URL(`${HASS_URL.replace(/\/$/, '')}/api/services/${NOTIFY_SERVICE}/notify`);
      const mod = url.protocol === 'https:' ? httpsRequest : httpRequest;
      const req = mod(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HASS_TOKEN}`,
        },
        timeout: 5000,
      }, (res) => { res.resume(); res.on('end', () => resolve(res.statusCode === 200 || res.statusCode === 201)); });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end(JSON.stringify({ title: 'SignalFlow Login', message: text }));
    } catch { resolve(false); }
  });
}

// ---- Auth ----
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  const ip = (req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString().split(',')[0].trim();
  if (!user) {
    recordFailedLogin(String(username), ip, 'unknown user');
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  if (!verifyPassword(password, user.password)) {
    recordFailedLogin(user.username, ip, 'wrong password');
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = signToken({ sub: user.id, username: user.username, roles: user.roles, displayName: user.displayName });
  const silent = SILENT_USERNAMES.includes(String(username).toLowerCase());
  recordLogin(user.username, ip, !silent);
  if (!silent) {
    const when = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    notifyHomeAssistant(`${user.displayName || user.username} signed in at ${when} (IP ${ip})`);
  }
  res.json({ token, user: { id: user.id, username: user.username, roles: user.roles, displayName: user.displayName } });
});

// Auth middleware — everything below requires a valid token
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  req.user = payload;
  next();
}
app.use('/api', (req, res, next) => {
  if (req.path === '/auth/login' || req.path === '/health' || req.path === '/auth/forgot' || req.path === '/auth/reset') return next();
  // Parser token passthrough — POST /api/drafts with the shared parser secret skips JWT auth
  const header0 = req.headers.authorization || '';
  const parserToken = process.env.PARSER_TOKEN;
  if (req.path === '/drafts' && req.method === 'POST' && parserToken && header0 === `Bearer ${parserToken}`) return next();
  return requireAuth(req, res, next);
});

function requireRole(...allowed) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (!roles.some((r) => allowed.includes(r))) {
      return res.status(403).json({ error: 'Forbidden — insufficient role' });
    }
    next();
  };
}
const canEdit = requireRole('admin', 'engineer');
const isAdmin = requireRole('admin');

// ---- Users management (admin only) ----
app.get('/api/users', isAdmin, (req, res) => {
  res.json(readJson(USERS_FILE, []).map(({ password, ...u }) => u));
});

app.post('/api/users', isAdmin, (req, res) => {
  const { username, password, roles, displayName, email } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const users = readJson(USERS_FILE, []);
  if (users.some((u) => u.username.toLowerCase() === String(username).toLowerCase())) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  const cleanRoles = Array.isArray(roles) && roles.length ? roles.filter((r) => ['admin', 'engineer', 'viewer'].includes(r)) : ['viewer'];
  const user = {
    id: `u-${Date.now().toString(36)}`,
    username: String(username).trim(),
    password: hashPassword(String(password)),
    roles: cleanRoles,
    displayName: displayName || username,
    email: email || '',
  };
  users.push(user);
  writeJsonAtomic(USERS_FILE, users);
  const { password: _p, ...safe } = user;
  res.json({ ok: true, user: safe });
});

app.put('/api/users/:id', isAdmin, (req, res) => {
  const users = readJson(USERS_FILE, []);
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'User not found' });
  const { password, roles, displayName, email } = req.body || {};
  if (password) users[idx].password = hashPassword(String(password));
  if (Array.isArray(roles)) users[idx].roles = roles.filter((r) => ['admin', 'engineer', 'viewer'].includes(r));
  if (displayName !== undefined) users[idx].displayName = displayName;
  if (email !== undefined) users[idx].email = String(email).trim();
  writeJsonAtomic(USERS_FILE, users);
  const { password: _p, ...safe } = users[idx];
  res.json({ ok: true, user: safe });
});

app.delete('/api/users/:id', isAdmin, (req, res) => {
  if (req.user.sub === req.params.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  const users = readJson(USERS_FILE, []);
  const next = users.filter((u) => u.id !== req.params.id);
  writeJsonAtomic(USERS_FILE, next);
  res.json({ ok: true, removed: users.length - next.length });
});

// ---- Forgot password flow ----
// POST /api/auth/forgot { username } -> generates one-time code (15 min), notifies admin via HA
// PUT  /api/auth/reset { username, code, newPassword } -> consumes code, sets password
const RESETS_FILE = join(DATA_DIR, 'password_resets.json');

app.post('/api/auth/forgot', async (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Username required' });
  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  // Always answer ok (no user enumeration), but only actually create a code for real users
  if (!user) {
    recordFailedLogin(String(username), req.socket?.remoteAddress || 'unknown', 'forgot-password: unknown user');
    return res.json({ ok: true });
  }
  const resetToken = randomBytes(24).toString('base64url');
  const resets = readJson(RESETS_FILE, []);
  // Invalidate previous tokens for this user
  const next = resets.filter((r) => r.username !== user.username);
  next.push({ username: user.username, tokenHash: hashPassword(resetToken), expiresAt: Date.now() + 15 * 60 * 1000, used: false, requestedAt: new Date().toISOString() });
  writeJsonAtomic(RESETS_FILE, next);
  recordLogin(user.username, req.socket?.remoteAddress || 'unknown', true); // audit as event
  const when = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (user.email) {
    const sent = await sendResetEmail(user.email, user.displayName, resetToken, user.username);
    if (sent) {
      return res.json({ ok: true, message: 'A password reset link has been emailed to the address on file. It expires in 15 minutes.' });
    }
    // Email failed — fall through to admin notification with code
  }
  // No email on file (or send failed): 6-digit code via HA app notification
  const code = String(Math.floor(100000 + Math.random() * 900000));
  next.pop();
  next.push({ username: user.username, tokenHash: hashPassword(code), expiresAt: Date.now() + 15 * 60 * 1000, used: false, requestedAt: new Date().toISOString(), codeFallback: true });
  writeJsonAtomic(RESETS_FILE, next);
  await notifyHomeAssistant(`PASSWORD RESET requested by ${user.displayName || user.username} at ${when}. No email on file — relay this code: ${code} (valid 15 min)`);
  res.json({ ok: true, message: 'A reset code was sent to the administrator. Ask them for the code, then set your new password.' });
});

app.put('/api/auth/reset', (req, res) => {
  const { username, code, newPassword } = req.body || {};
  if (!username || !code || !newPassword) return res.status(400).json({ error: 'Reset token and new password required' });
  if (String(newPassword).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  const resets = readJson(RESETS_FILE, []);
  const entry = resets.find((r) => r.username.toLowerCase() === String(username).toLowerCase());
  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user || !entry || entry.used) {
    recordFailedLogin(String(username), req.socket?.remoteAddress || 'unknown', 'password reset: no valid token');
    return res.status(400).json({ error: 'Invalid or expired reset link' });
  }
  if (Date.now() > entry.expiresAt) {
    entry.used = true;
    writeJsonAtomic(RESETS_FILE, resets);
    return res.status(400).json({ error: 'Reset link expired — request a new one' });
  }
  if (!verifyPassword(String(code), entry.tokenHash)) {
    recordFailedLogin(user.username, req.socket?.remoteAddress || 'unknown', 'password reset: wrong token');
    return res.status(400).json({ error: 'Invalid reset link' });
  }
  entry.used = true;
  user.password = hashPassword(String(newPassword));
  writeJsonAtomic(RESETS_FILE, resets);
  writeJsonAtomic(USERS_FILE, users);
  recordLogin(user.username, req.socket?.remoteAddress || 'unknown', true); // audit as event
  notifyHomeAssistant(`PASSWORD RESET COMPLETED for ${user.displayName || user.username}`);
  res.json({ ok: true });
});

// Change own password (any authenticated user)
app.put('/api/auth/password', (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => u.id === req.user.sub);
  if (!user || !currentPassword || !verifyPassword(currentPassword, user.password)) {
    return res.status(401).json({ error: 'Current password incorrect' });
  }
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  user.password = hashPassword(newPassword);
  writeJsonAtomic(USERS_FILE, users);
  res.json({ ok: true });
});

// ---- CORS ----
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  if (_req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ---- Projects ----
app.get('/api/projects', (_req, res) => {
  res.json(readJson(DATA_FILE, []));
});

app.put('/api/projects', canEdit, (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Body must be a JSON array' });
    }
    const before = readJson(DATA_FILE, []);
    const beforeIds = new Set(before.map((p) => String(p.id)));
    writeJsonAtomic(DATA_FILE, req.body);
    const added = req.body.filter((p) => !beforeIds.has(String(p.id)));
    // Fire notifications for genuinely new projects (email-ingested or manual)
    for (const p of added) {
      const who = req.user?.displayName || req.user?.username || 'someone';
      const source = p.source === 'email' ? 'email ingestion' : 'manual creation';
      console.log(`New project detected: ${p.id} (${p.name}) — firing HA notification`);
      notifyHomeAssistant(`New project created via ${source}: ${p.name || 'Unnamed'} — ${p.type || 'untyped'} (${who})`)
        .then((ok) => console.log(`HA notify result for ${p.id}: ${ok}`));
    }
    console.log(`Saved ${req.body.length} projects at ${new Date().toISOString()}`);
    res.json({ ok: true, count: req.body.length, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Write error:', err.message);
    res.status(500).json({ error: 'Failed to save projects' });
  }
});

// ---- People roster ----
app.get('/api/people', (_req, res) => {
  res.json(readJson(PEOPLE_FILE, []));
});

app.put('/api/people', canEdit, (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Body must be a JSON array' });
    }
    writeJsonAtomic(PEOPLE_FILE, req.body);
    res.json({ ok: true, count: req.body.length });
  } catch (err) {
    console.error('Write error:', err.message);
    res.status(500).json({ error: 'Failed to save people' });
  }
});

// ---- Pending drafts ----
app.get('/api/drafts', (_req, res) => {
  res.json(readJson(DRAFTS_FILE, []));
});

// Draft injection accepts a service token (parser) OR admin session.
// PARSER_TOKEN env: shared secret so the Hermes parser can POST without a user login.
app.post('/api/drafts', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const parserToken = process.env.PARSER_TOKEN;
  const isParser = parserToken && token === parserToken;

  if (!isParser) {
    // fall back to normal auth
    const payload = token && verifyToken(token);
    if (!payload || !payload.roles?.some((r) => ['admin', 'engineer'].includes(r))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  const draft = req.body;
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
    return res.status(400).json({ error: 'Body must be a draft object' });
  }
  if (!draft.id) draft.id = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (!draft.status) draft.status = 'pending';
  if (!draft.receivedAt) draft.receivedAt = new Date().toISOString();

  const drafts = readJson(DRAFTS_FILE, []);
  const idx = drafts.findIndex((d) => d.id === draft.id);
  if (idx >= 0) {
    if (drafts[idx].status !== 'pending') {
      return res.json({ ok: true, id: drafts[idx].id, skipped: 'already reviewed' });
    }
    drafts[idx] = { ...draft, status: drafts[idx].status };
  } else {
    drafts.unshift(draft);
  }
  writeJsonAtomic(DRAFTS_FILE, drafts);
  res.json({ ok: true, id: draft.id });
});

app.put('/api/drafts/:id', canEdit, (req, res) => {
  const drafts = readJson(DRAFTS_FILE, []);
  const idx = drafts.findIndex((d) => d.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Draft not found' });
  drafts[idx] = { ...drafts[idx], ...req.body, id: req.params.id };
  writeJsonAtomic(DRAFTS_FILE, drafts);
  res.json({ ok: true });
});

app.delete('/api/drafts/:id', canEdit, (req, res) => {
  const drafts = readJson(DRAFTS_FILE, []);
  const next = drafts.filter((d) => d.id !== req.params.id);
  writeJsonAtomic(DRAFTS_FILE, next);
  res.json({ ok: true, removed: drafts.length - next.length });
});

// Health check (unauthenticated)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SignalFlow API on :${PORT}, data → ${DATA_DIR}`));
