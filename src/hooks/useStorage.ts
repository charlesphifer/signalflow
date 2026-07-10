import type { Project } from '../types';

const API = '/api/projects';

export async function loadProjects(): Promise<Project[]> {
  try {
    const res = await fetch(API);
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projects),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return true;
  } catch (err) {
    console.error('Failed to save projects:', err);
    return false;
  }
}