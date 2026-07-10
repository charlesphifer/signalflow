import { useState, useCallback, useMemo } from 'react';
import type { Project, SortField, SortOrder, ViewMode } from '../types';
import { SEED_PROJECTS } from '../data/seedProjects';
import { DEFAULT_ASSESSMENT_CHECKLIST, DEFAULT_DESIGN_CHECKLIST } from '../data/defaultChecklists';
import { computeStageFromChecklist, STAGE_ORDER } from '../utils/helpers';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('signalflow_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((p: any) => {
          const migratedType =
            p.type === 'Type 1' ? 'Wireless Assessment' :
            p.type === 'Type 2' ? 'Wireless Design' : p.type;

          const migratedChecklist = (p.checklist || []).map((item: any) => {
            let migratedId = item.id;
            if (item.id.startsWith('t1_')) migratedId = item.id.replace('t1_', 'wa_');
            else if (item.id.startsWith('t2_')) migratedId = item.id.replace('t2_', 'wd_');
            return { ...item, id: migratedId };
          });

          return { ...p, type: migratedType, checklist: migratedChecklist };
        });
      } catch {
        return SEED_PROJECTS;
      }
    }
    return SEED_PROJECTS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('active');

  // Persist to localStorage on every change
  const persistProjects = useCallback((updated: Project[]) => {
    localStorage.setItem('signalflow_projects', JSON.stringify(updated));
  }, []);

  const updateProjects = useCallback((updater: (prev: Project[]) => Project[]) => {
    setProjects(prev => {
      const next = updater(prev);
      persistProjects(next);
      return next;
    });
  }, [persistProjects]);

  const handleToggleChecklist = useCallback((projectId: string, itemId: string) => {
    updateProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const updatedChecklist = p.checklist.map(item =>
          item.id === itemId ? { ...item, completed: !item.completed } : item,
        );
        const completed = updatedChecklist.filter(c => c.completed).length;
        const total = updatedChecklist.length;
        const newStage = computeStageFromChecklist(completed, total, p.type);
        return { ...p, checklist: updatedChecklist, stage: newStage };
      }),
    );
  }, [updateProjects]);

  const handleSaveNotes = useCallback((projectId: string, text: string) => {
    updateProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, notes: text } : p)),
    );
  }, [updateProjects]);

  const handleToggleArchive = useCallback((projectId: string) => {
    updateProjects(prev =>
      prev.map(p =>
        p.id === projectId ? { ...p, isArchived: !p.isArchived } : p,
      ),
    );
  }, [updateProjects]);

  const handleDeleteProject = useCallback((projectId: string) => {
    updateProjects(prev => prev.filter(p => p.id !== projectId));
  }, [updateProjects]);

  const handleSaveProject = useCallback(
    (projectId: string, changes: Partial<Project>) => {
      updateProjects(prev =>
        prev.map(p => {
          if (p.id !== projectId) return p;
          const mergedType = changes.type ?? p.type;
          let updatedChecklist = p.checklist;
          if (changes.type && p.type !== changes.type) {
            updatedChecklist =
              changes.type === 'Wireless Assessment'
                ? DEFAULT_ASSESSMENT_CHECKLIST.map(item => ({ ...item }))
                : DEFAULT_DESIGN_CHECKLIST.map(item => ({ ...item }));
          }
          return {
            ...p,
            ...changes,
            type: mergedType as Project['type'],
            checklist: updatedChecklist,
          };
        }),
      );
    },
    [updateProjects],
  );

  const handleCreateProject = useCallback(
    (newProject: Project) => {
      updateProjects(prev => [newProject, ...prev]);
    },
    [updateProjects],
  );

  // Derived data
  const filteredProjects = useMemo(
    () =>
      projects.filter(p => {
        const isArchived = !!p.isArchived;
        const matchesView = viewMode === 'archived' ? isArchived : !isArchived;
        if (!matchesView) return false;

        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.number.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q)
        );
      }),
    [projects, searchTerm, viewMode],
  );

  const sortedProjects = useMemo(
    () =>
      [...filteredProjects].sort((a, b) => {
        let comp = 0;
        switch (sortBy) {
          case 'name':
            comp = a.name.localeCompare(b.name);
            break;
          case 'number':
            comp = a.number.localeCompare(b.number);
            break;
          case 'goLive':
            comp = new Date(a.goLiveDate).getTime() - new Date(b.goLiveDate).getTime();
            break;
          case 'stage':
            comp = STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
            break;
        }
        return sortOrder === 'asc' ? comp : -comp;
      }),
    [filteredProjects, sortBy, sortOrder],
  );

  return {
    projects,
    setProjects,
    updateProjects,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    filteredProjects,
    sortedProjects,
    handleToggleChecklist,
    handleSaveNotes,
    handleToggleArchive,
    handleDeleteProject,
    handleSaveProject,
    handleCreateProject,
  };
}