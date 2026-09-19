import express from 'express';
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync } from 'fs';
import { join } from 'path';
import { hashPassword, verifyPassword, signToken, verifyToken } from './auth.js';

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
    { id: 'u-admin', username: 'charles', password: hashPassword('ChangeMe-Demo2026!'), roles: ['admin', 'engineer'], displayName: 'Charles Phifer' },
    { id: 'u-eng1', username: 'demo-engineer', password: hashPassword('engineer123'), roles: ['engineer'], displayName: 'Demo Engineer' },
    { id: 'u-view1', username: 'demo-viewer', password: hashPassword('viewer123'), roles: ['viewer'], displayName: 'Demo Viewer' },
  ];
  writeJsonAtomic(USERS_FILE, users);
  console.log('Seeded default users (charles / demo-engineer / demo-viewer)');
}
seedUsers();

// ---- Auth ----
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = signToken({ sub: user.id, username: user.username, roles: user.roles, displayName: user.displayName });
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
  if (req.path === '/auth/login' || req.path === '/health') return next();
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
  const { username, password, roles, displayName } = req.body || {};
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
  const { password, roles, displayName } = req.body || {};
  if (password) users[idx].password = hashPassword(String(password));
  if (Array.isArray(roles)) users[idx].roles = roles.filter((r) => ['admin', 'engineer', 'viewer'].includes(r));
  if (displayName !== undefined) users[idx].displayName = displayName;
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
    writeJsonAtomic(DATA_FILE, req.body);
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
