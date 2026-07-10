import { useState, useEffect, useCallback, useRef } from 'react';
import type { Project, SyncSettings, SyncStatus, RealtimeStatus } from '../types';
import { createClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  settings: 'signalflow_sync_settings',
  projectsUpdatedAt: 'signalflow_projects_updated_at',
  lastSyncedAt: 'signalflow_last_synced_at',
} as const;

function loadSyncSettings(): SyncSettings {
  const saved = localStorage.getItem(STORAGE_KEYS.settings);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fall through
    }
  }
  return {
    enabled: false,
    provider: 'demo',
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseTable: 'signalflow_sync',
    supabaseKey: 'SF-Cloud-Room-1',
    demoKey: '',
  };
}

export function useSync(projects: Project[], setProjects: (p: Project[]) => void) {
  const [syncSettings, setSyncSettings] = useState<SyncSettings>(loadSyncSettings);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disabled');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.lastSyncedAt),
  );
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('disconnected');

  const isSyncingRef = useRef(false);
  const supabaseClientRef = useRef<any>(null);
  const supabaseChannelRef = useRef<any>(null);

  const syncSettingsRef = useRef(syncSettings);
  useEffect(() => { syncSettingsRef.current = syncSettings; }, [syncSettings]);

  const projectsRef = useRef(projects);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  // Persist sync settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(syncSettings));
  }, [syncSettings]);

  const performSync = useCallback(async (forceDirection: 'push' | 'pull' | 'auto' = 'auto') => {
    const activeSettings = syncSettingsRef.current;
    const activeProjects = projectsRef.current;

    if (!activeSettings.enabled) {
      setSyncStatus('disabled');
      return;
    }

    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus('syncing');
    setIsSyncingNow(true);

    try {
      setSyncError(null);

      if (activeSettings.provider === 'demo') {
        let currentDemoKey = activeSettings.demoKey;

        // Initialize a new demo bin if no key exists
        if (!currentDemoKey) {
          const timestamp = new Date().toISOString();
          const response = await fetch('https://jsonblob.com/api/jsonBlob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projects: activeProjects, updatedAt: timestamp }),
          });

          if (!response.ok) throw new Error('Failed to initialize demo sync room');

          const locHeader = response.headers.get('Location') || '';
          const idFromLoc = locHeader.split('/').pop() || '';
          currentDemoKey = response.headers.get('x-jsonblob-id') || idFromLoc;

          if (!currentDemoKey) throw new Error('Server did not return a valid Sync Room ID');

          const updatedSettings = { ...activeSettings, demoKey: currentDemoKey };
          setSyncSettings(updatedSettings);
          localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updatedSettings));
          localStorage.setItem(STORAGE_KEYS.projectsUpdatedAt, timestamp);
          setLastSyncedAt(timestamp);
          localStorage.setItem(STORAGE_KEYS.lastSyncedAt, timestamp);
          setSyncStatus('synced');
          isSyncingRef.current = false;
          setIsSyncingNow(false);
          return;
        }

        // Fetch cloud state
        const response = await fetch(`https://jsonblob.com/api/jsonBlob/${currentDemoKey}`);
        if (!response.ok) {
          if (response.status === 404) {
            const updatedSettings = { ...activeSettings, demoKey: '' };
            setSyncSettings(updatedSettings);
            localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updatedSettings));
            throw new Error('Sync room not found on server. Resetting key.');
          }
          throw new Error('Failed to contact demo server');
        }

        const cloudObj = await response.json();
        const cloudProjects = cloudObj.projects || [];
        const cloudUpdatedAt = cloudObj.updatedAt || '';
        const localUpdatedAt = localStorage.getItem(STORAGE_KEYS.projectsUpdatedAt) || new Date(0).toISOString();

        let direction: 'push' | 'pull' = 'push';
        if (forceDirection === 'push') direction = 'push';
        else if (forceDirection === 'pull') direction = 'pull';
        else {
          if (!cloudUpdatedAt || new Date(localUpdatedAt) > new Date(cloudUpdatedAt)) direction = 'push';
          else if (new Date(cloudUpdatedAt) > new Date(localUpdatedAt)) direction = 'pull';
          else {
            setSyncStatus('synced');
            isSyncingRef.current = false;
            setIsSyncingNow(false);
            return;
          }
        }

        if (direction === 'push') {
          const timestamp = new Date().toISOString();
          const updateResponse = await fetch(`https://jsonblob.com/api/jsonBlob/${currentDemoKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projects: activeProjects, updatedAt: timestamp }),
          });
          if (!updateResponse.ok) throw new Error('Failed to push changes to demo server');
          localStorage.setItem(STORAGE_KEYS.projectsUpdatedAt, timestamp);
          setLastSyncedAt(timestamp);
          localStorage.setItem(STORAGE_KEYS.lastSyncedAt, timestamp);
          setSyncStatus('synced');
        } else {
          setProjects(cloudProjects);
          localStorage.setItem('signalflow_projects', JSON.stringify(cloudProjects));
          localStorage.setItem(STORAGE_KEYS.projectsUpdatedAt, cloudUpdatedAt);
          setLastSyncedAt(cloudUpdatedAt);
          localStorage.setItem(STORAGE_KEYS.lastSyncedAt, cloudUpdatedAt);
          setSyncStatus('synced');
        }
      } else if (activeSettings.provider === 'supabase') {
        const { supabaseUrl, supabaseAnonKey, supabaseTable, supabaseKey } = activeSettings;
        if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase URL and Anon Key are missing');

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: cloudData, error: fetchError } = await supabase
          .from(supabaseTable)
          .select('*')
          .eq('sync_key', supabaseKey)
          .maybeSingle();

        if (fetchError) throw new Error(`Supabase Query Error: ${fetchError.message}`);

        const cloudProjects = cloudData?.projects || null;
        const cloudUpdatedAt = cloudData?.updated_at || null;
        const localUpdatedAt = localStorage.getItem(STORAGE_KEYS.projectsUpdatedAt) || new Date(0).toISOString();

        let direction: 'push' | 'pull' = 'push';
        if (forceDirection === 'push') direction = 'push';
        else if (forceDirection === 'pull') direction = 'pull';
        else {
          if (!cloudUpdatedAt || new Date(localUpdatedAt) > new Date(cloudUpdatedAt)) direction = 'push';
          else if (new Date(cloudUpdatedAt) > new Date(localUpdatedAt)) direction = 'pull';
          else {
            setSyncStatus('synced');
            isSyncingRef.current = false;
            setIsSyncingNow(false);
            return;
          }
        }

        if (direction === 'push') {
          const timestamp = new Date().toISOString();
          const { error: upsertError } = await supabase
            .from(supabaseTable)
            .upsert({ sync_key: supabaseKey, projects: activeProjects, updated_at: timestamp });
          if (upsertError) throw new Error(`Supabase Push Error: ${upsertError.message}`);
          localStorage.setItem(STORAGE_KEYS.projectsUpdatedAt, timestamp);
          setLastSyncedAt(timestamp);
          localStorage.setItem(STORAGE_KEYS.lastSyncedAt, timestamp);
          setSyncStatus('synced');
        } else {
          setProjects(cloudProjects);
          localStorage.setItem('signalflow_projects', JSON.stringify(cloudProjects));
          localStorage.setItem(STORAGE_KEYS.projectsUpdatedAt, cloudUpdatedAt);
          setLastSyncedAt(cloudUpdatedAt);
          localStorage.setItem(STORAGE_KEYS.lastSyncedAt, cloudUpdatedAt);
          setSyncStatus('synced');
        }
      }
    } catch (e: any) {
      console.error(e);
      setSyncStatus('error');
      setSyncError(e.message || String(e));
    } finally {
      isSyncingRef.current = false;
      setIsSyncingNow(false);
    }
  }, [setProjects]);

  // Auto-sync on project changes
  useEffect(() => {
    if (!isSyncingRef.current && syncSettings.enabled) {
      const timestamp = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.projectsUpdatedAt, timestamp);
      performSync('push');
    }
  }, [projects, syncSettings.enabled, performSync]);

  // Periodic polling
  useEffect(() => {
    if (!syncSettings.enabled) {
      setSyncStatus('disabled');
      return;
    }

    performSync('auto');

    const pollInterval = syncSettings.provider === 'supabase' ? 30000 : 5000;
    const interval = setInterval(() => performSync('auto'), pollInterval);
    return () => clearInterval(interval);
  }, [syncSettings.enabled, syncSettings.demoKey, syncSettings.supabaseKey, syncSettings.provider, performSync]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (supabaseChannelRef.current) {
      try { supabaseClientRef.current?.removeChannel(supabaseChannelRef.current); } catch (_) { /* ignore */ }
      supabaseChannelRef.current = null;
    }

    if (!syncSettings.enabled || syncSettings.provider !== 'supabase' || !syncSettings.supabaseUrl || !syncSettings.supabaseAnonKey) {
      setRealtimeStatus('disconnected');
      return;
    }

    const supabase = createClient(syncSettings.supabaseUrl, syncSettings.supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
    supabaseClientRef.current = supabase;

    setRealtimeStatus('connecting');

    const channel = supabase
      .channel('signalflow-changes')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: syncSettings.supabaseTable }, () => {
        if (!isSyncingRef.current) performSync('auto');
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('error');
      });

    supabaseChannelRef.current = channel;
    return () => {
      try { supabase.removeChannel(channel); } catch (_) { /* ignore */ }
      supabaseChannelRef.current = null;
    };
  }, [syncSettings.enabled, syncSettings.provider, syncSettings.supabaseUrl, syncSettings.supabaseAnonKey, syncSettings.supabaseTable, performSync]);

  return {
    syncSettings,
    setSyncSettings,
    syncStatus,
    syncError,
    lastSyncedAt,
    isSyncingNow,
    realtimeStatus,
    performSync,
  };
}