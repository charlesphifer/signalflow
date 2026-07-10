import express from 'express';
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const app = express();
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = process.env.DATA_DIR || '/data';
const DATA_FILE = join(DATA_DIR, 'projects.json');
const TMP_FILE = DATA_FILE + '.tmp';

// Ensure data directory exists
mkdirSync(DATA_DIR, { recursive: true });

// CORS — allow the frontend container to call us
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// GET /api/projects — read the full projects array
app.get('/api/projects', (_req, res) => {
  try {
    if (!existsSync(DATA_FILE)) return res.json([]);
    const raw = readFileSync(DATA_FILE, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error('Read error:', err.message);
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// PUT /api/projects — atomic write (write tmp → rename)
app.put('/api/projects', (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Body must be a JSON array' });
    }
    writeFileSync(TMP_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    renameSync(TMP_FILE, DATA_FILE);
    console.log(`Saved ${req.body.length} projects at ${new Date().toISOString()}`);
    res.json({ ok: true, count: req.body.length, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Write error:', err.message);
    res.status(500).json({ error: 'Failed to save projects' });
  }
});

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SignalFlow API on :${PORT}, data → ${DATA_FILE}`));