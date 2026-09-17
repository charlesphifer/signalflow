import type { Person, PendingDraft } from '../types';

const PEOPLE_API = '/api/people';
const DRAFTS_API = '/api/drafts';

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Request failed (${url}):`, err);
    return null;
  }
}

export async function loadPeople(): Promise<Person[]> {
  const data = await jsonFetch<Person[]>(PEOPLE_API);
  return Array.isArray(data) ? data : [];
}

export async function savePeople(people: Person[]): Promise<boolean> {
  const res = await jsonFetch<{ ok: boolean }>(PEOPLE_API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(people),
  });
  return !!res?.ok;
}

export async function loadDrafts(): Promise<PendingDraft[]> {
  const data = await jsonFetch<PendingDraft[]>(DRAFTS_API);
  return Array.isArray(data) ? data : [];
}

export async function updateDraft(id: string, patch: Partial<PendingDraft>): Promise<boolean> {
  const res = await jsonFetch<{ ok: boolean }>(`${DRAFTS_API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return !!res?.ok;
}

export async function deleteDraft(id: string): Promise<boolean> {
  const res = await jsonFetch<{ ok: boolean }>(`${DRAFTS_API}/${id}`, { method: 'DELETE' });
  return !!res?.ok;
}
