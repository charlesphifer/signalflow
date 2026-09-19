// Auth helpers — scrypt password hashing + HMAC-Signed JWT (Node stdlib only, no deps)
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [salt, hash] = stored.split(':');
    const candidate = scryptSync(password, salt, 64);
    return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// ---- Minimal HS256 JWT (no external deps) ----
const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function signToken(payload, expiresInSeconds = 7 * 24 * 3600) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }));
  const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expected = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
