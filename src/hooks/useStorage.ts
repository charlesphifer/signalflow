import type { Project } from '../types';
import { authHeaders, getStoredSession } from './useAuth';

const API = '/api/projects';

export async function loadProjects(): Promise<Project[]> {
  try {
    const res = await fetch(API, { headers: authHeaders(getStoredSession()) });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to load projects:', err);
    return [];
  }
}

export async function saveProjects(projects: Project[]): Promise<boolean> {
  try {
    const res = await fetch(API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(getStoredSession()) },
      body: JSON.stringify(projects),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return true;
  } catch (err) {
    console.error('Failed to save projects:', err);
    return false;
  }
}