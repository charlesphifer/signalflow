import express from 'express';
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const app = express();
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = process.env.DATA_DIR || '/data';
const DATA_FILE = join(DATA_DIR, 'projects.json');
const TMP_FILE = DATA_FILE + '.tmp';
const PEOPLE_FILE = join(DATA_DIR, 'people.json');
const DRAFTS_FILE = join(DATA_DIR, 'drafts.json');

// Ensure data directory exists
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

// CORS — allow the frontend container to call us
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// GET /api/projects — read the full projects array
app.get('/api/projects', (_req, res) => {
  res.json(readJson(DATA_FILE, []));
});

// PUT /api/projects — atomic write (write tmp → rename)
app.put('/api/projects', (req, res) => {
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

app.put('/api/people', (req, res) => {
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

// ---- Pending drafts (NK intake pipeline) ----
// Parser (Hermes side) POSTs drafts here; UI reads/lists/updates them.
app.get('/api/drafts', (_req, res) => {
  res.json(readJson(DRAFTS_FILE, []));
});

app.post('/api/drafts', (req, res) => {
  try {
    const draft = req.body;
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
      return res.status(400).json({ error: 'Body must be a draft object' });
    }
    if (!draft.id) draft.id = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (!draft.status) draft.status = 'pending';
    if (!draft.receivedAt) draft.receivedAt = new Date().toISOString();

    const drafts = readJson(DRAFTS_FILE, []);
    // Idempotent by id: replace existing draft with same id (re-parse of same email)
    const idx = drafts.findIndex((d) => d.id === draft.id);
    if (idx >= 0) {
      // Never clobber a human decision on re-ingest
      if (drafts[idx].status !== 'pending') {
        return res.json({ ok: true, id: drafts[idx].id, skipped: 'already reviewed' });
      }
      drafts[idx] = { ...draft, status: drafts[idx].status };
    } else {
      drafts.unshift(draft);
    }
    writeJsonAtomic(DRAFTS_FILE, drafts);
    res.json({ ok: true, id: draft.id });
  } catch (err) {
    console.error('Draft error:', err.message);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

app.put('/api/drafts/:id', (req, res) => {
  try {
    const drafts = readJson(DRAFTS_FILE, []);
    const idx = drafts.findIndex((d) => d.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Draft not found' });
    drafts[idx] = { ...drafts[idx], ...req.body, id: req.params.id };
    writeJsonAtomic(DRAFTS_FILE, drafts);
    res.json({ ok: true });
  } catch (err) {
    console.error('Draft error:', err.message);
    res.status(500).json({ error: 'Failed to update draft' });
  }
});

app.delete('/api/drafts/:id', (req, res) => {
  try {
    const drafts = readJson(DRAFTS_FILE, []);
    const next = drafts.filter((d) => d.id !== req.params.id);
    writeJsonAtomic(DRAFTS_FILE, next);
    res.json({ ok: true, removed: drafts.length - next.length });
  } catch (err) {
    console.error('Draft error:', err.message);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SignalFlow API on :${PORT}, data → ${DATA_DIR}`));
