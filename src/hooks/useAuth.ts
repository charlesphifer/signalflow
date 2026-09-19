import type { AuthSession, AuthUser } from '../types';

const SESSION_KEY = 'signalflow_session';
const API = '/api';

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    return session?.token && session?.user ? session : null;
  } catch {
    return null;
  }
}

export function storeSession(session: AuthSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export function authHeaders(session: AuthSession | null): Record<string, string> {
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Login failed (${res.status})`);
  }
  const session = (await res.json()) as AuthSession;
  storeSession(session);
  return session;
}

export function logout() {
  storeSession(null);
}

// Fetch wrapper that auto-injects the auth token
export async function apiFetch<T>(path: string, init: RequestInit = {}, session: AuthSession | null = getStoredSession()): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...authHeaders(session),
    },
  });
  if (res.status === 401) {
    storeSession(null);
    window.location.reload();
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export function hasRole(user: AuthUser | null, ...roles: string[]): boolean {
  return !!user && user.roles.some((r) => roles.includes(r));
}

export function canEdit(user: AuthUser | null): boolean {
  return hasRole(user, 'admin', 'engineer');
}
