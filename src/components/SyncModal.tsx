import type { SyncSettings, SyncStatus, RealtimeStatus } from '../types';

interface SyncModalProps {
  showSyncModal: boolean;
  syncSettings: SyncSettings;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: string | null;
  isSyncingNow: boolean;
  realtimeStatus: RealtimeStatus;
  onClose: () => void;
  onToggle: (enabled: boolean) => void;
  onSetProvider: (provider: 'demo' | 'supabase') => void;
  onUpdateSettings: (settings: SyncSettings) => void;
  onCreateRoom: () => void;
  onJoinRoom: (key: string) => void;
  onCopyKey: (key: string) => void;
  onCopySql: (sql: string) => void;
  onPush: () => void;
  onPull: () => void;
  onToast: (msg: string) => void;
}

const buildSql = (table: string) => `create table ${table || 'signalflow_sync'} (
  sync_key text primary key,
  projects jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DISABLE Row-Level Security (RLS) to allow public access:
alter table ${table || 'signalflow_sync'} disable row level security;

-- Enable Realtime (optional):
alter publication supabase_realtime add table ${table || 'signalflow_sync'};`;

export default function SyncModal({
  showSyncModal,
  syncSettings,
  syncStatus,
  syncError,
  lastSyncedAt,
  isSyncingNow,
  realtimeStatus,
  onClose,
  onToggle,
  onSetProvider,
  onUpdateSettings,
  onCreateRoom,
  onJoinRoom,
  onCopyKey,
  onCopySql,
  onPush,
  onPull,
}: SyncModalProps) {
  if (!showSyncModal) return null;

  return (
    <div className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal-900 border border-indigo-900 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-charcoal-950 border-b border-charcoal-800 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sunset-500">
                <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
              <span>Cloud Synchronization Settings</span>
            </h3>
            <p className="text-[10px] text-charcoal-400">Enable real-time automatic backup and cross-device sync</p>
          </div>
          <button onClick={onClose} className="text-charcoal-500 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-charcoal-950/50 rounded-xl border border-charcoal-800">
            <div>
              <span className="block text-xs font-extrabold text-white uppercase tracking-wider">Enable Cloud Synchronization</span>
              <span className="block text-[10px] text-charcoal-400 mt-0.5">Connect local sandbox state to a persistent cloud repository.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={syncSettings.enabled} onChange={e => onToggle(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-charcoal-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-charcoal-400 after:border-charcoal-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sunset-500 peer-checked:after:bg-charcoal-950" />
            </label>
          </div>

          {syncSettings.enabled && (
            <div className="space-y-4">
              {/* Provider selector */}
              <div className="grid grid-cols-2 gap-2 bg-charcoal-950 p-1 rounded-xl border border-charcoal-800">
                <button
                  onClick={() => onSetProvider('demo')}
                  className={`py-2 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                    syncSettings.provider === 'demo' ? 'bg-indigo-950/80 border border-indigo-700 text-sunset-500' : 'text-charcoal-400 hover:text-charcoal-200'
                  }`}
                >
                  Instant Demo Room
                </button>
                <button
                  onClick={() => onSetProvider('supabase')}
                  className={`py-2 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                    syncSettings.provider === 'supabase' ? 'bg-indigo-950/80 border border-indigo-700 text-sunset-500' : 'text-charcoal-400 hover:text-charcoal-200'
                  }`}
                >
                  Supabase Cloud DB
                </button>
              </div>

              {/* Demo Room */}
              {syncSettings.provider === 'demo' && (
                <div className="bg-charcoal-950 p-4 rounded-xl border border-charcoal-800 space-y-4">
                  <div className="text-[10px] text-charcoal-400 leading-relaxed space-y-1">
                    <p className="font-extrabold text-sunset-500 uppercase tracking-widest">⚡ Free Instant Sync Lobby</p>
                    <p>Perfect for real-time testing across devices (iPhone, Mac, Android) without signing up for databases or accounts.</p>
                  </div>
                  {syncSettings.demoKey ? (
                    <div className="space-y-2">
                      <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400">Your Unique Sync Key</label>
                      <div className="flex space-x-2">
                        <input type="text" readOnly value={syncSettings.demoKey} className="flex-1 bg-charcoal-900 border border-charcoal-800 text-white font-mono text-xs px-3 py-2 rounded-lg select-all" />
                        <button onClick={() => onCopyKey(syncSettings.demoKey)} className="px-3 bg-charcoal-800 hover:bg-charcoal-700 text-sunset-500 text-xs font-bold rounded-lg transition-colors">Copy</button>
                      </div>
                      <p className="text-[9px] text-charcoal-500">Paste this key in the "Join Sync Room" input on your other devices to sync instantly.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed border-charcoal-800 rounded-lg">
                      <p className="text-xs text-charcoal-400 mb-3 text-center">You don't have an active Sync Room yet. Click below to initialize one!</p>
                      <button onClick={onCreateRoom} disabled={isSyncingNow} className="bg-sunset-500 hover:bg-sunset-600 text-charcoal-950 text-xs font-extrabold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-sunset-500/20">
                        {isSyncingNow ? 'Generating...' : 'Create Sync Room'}
                      </button>
                    </div>
                  )}
                  <div className="pt-2 border-t border-charcoal-900 space-y-2">
                    <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400">Join Existing Sync Room</label>
                    <div className="flex space-x-2">
                      <input type="text" placeholder="Paste Sync Key here..." id="joinDemoKeyInput" className="flex-1 bg-charcoal-900 border border-charcoal-800 text-white font-mono text-xs px-3 py-2 rounded-lg" />
                      <button
                        onClick={() => {
                          const input = document.getElementById('joinDemoKeyInput') as HTMLInputElement;
                          const value = input?.value?.trim();
                          if (value) onJoinRoom(value);
                        }}
                        className="px-4 bg-indigo-950 border border-indigo-800 text-sunset-500 hover:bg-indigo-900 text-xs font-bold rounded-lg transition-all"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Supabase */}
              {syncSettings.provider === 'supabase' && (
                <div className="bg-charcoal-950 p-4 rounded-xl border border-charcoal-800 space-y-3.5">
                  <div className="text-[10px] text-charcoal-400 leading-relaxed space-y-1">
                    <p className="font-extrabold text-sunset-500 uppercase tracking-widest">🛡️ Private Enterprise Sync (Supabase)</p>
                    <p>Connect directly to your private Postgres database.</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400 mb-1">Supabase URL</label>
                      <input type="text" placeholder="https://your-project.supabase.co"
                        value={syncSettings.supabaseUrl}
                        onChange={e => onUpdateSettings({ ...syncSettings, supabaseUrl: e.target.value.trim() })}
                        className="w-full bg-charcoal-900 border border-charcoal-800 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-700" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400 mb-1">Supabase Anon Key</label>
                      <input type="password" placeholder="eyJhbGciOi..."
                        value={syncSettings.supabaseAnonKey}
                        onChange={e => onUpdateSettings({ ...syncSettings, supabaseAnonKey: e.target.value.trim() })}
                        className="w-full bg-charcoal-900 border border-charcoal-800 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-700" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400 mb-1">Table Name</label>
                        <input type="text" value={syncSettings.supabaseTable}
                          onChange={e => onUpdateSettings({ ...syncSettings, supabaseTable: e.target.value.trim() })}
                          className="w-full bg-charcoal-900 border border-charcoal-800 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-700" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-widest text-charcoal-400 mb-1">Custom Sync Key</label>
                        <input type="text" value={syncSettings.supabaseKey}
                          onChange={e => onUpdateSettings({ ...syncSettings, supabaseKey: e.target.value.trim() })}
                          className="w-full bg-charcoal-900 border border-charcoal-800 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-700" />
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-charcoal-900">
                    <label className="block text-[9px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">Database Setup Query (Run in Supabase SQL Editor)</label>
                    <div className="relative">
                      <pre className="bg-charcoal-900 p-2.5 rounded-lg text-[9px] text-emerald-400 font-mono overflow-x-auto max-h-[100px] border border-charcoal-800 leading-normal whitespace-pre-wrap">
                        {buildSql(syncSettings.supabaseTable)}
                      </pre>
                      <button onClick={() => onCopySql(buildSql(syncSettings.supabaseTable))}
                        className="absolute top-1 right-1 px-1.5 py-0.5 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 hover:text-white rounded text-[8px] transition-colors">
                        Copy SQL
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-charcoal-950 border-t border-charcoal-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                !syncSettings.enabled ? 'bg-charcoal-600' :
                syncStatus === 'synced' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                syncStatus === 'syncing' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse' :
                'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
              }`} />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">
                {!syncSettings.enabled ? 'Sync Disabled' :
                 syncStatus === 'synced' ? 'Fully Synced' :
                 syncStatus === 'syncing' ? 'Synchronizing...' : 'Sync Error'}
              </span>
              {lastSyncedAt && syncSettings.enabled && (
                <span className="text-[9px] text-charcoal-400">(Last: {new Date(lastSyncedAt).toLocaleTimeString()})</span>
              )}
            </div>
            {syncError && syncSettings.enabled && (
              <span className="text-[9px] text-rose-400 mt-1 max-w-[250px] break-words leading-tight">{syncError}</span>
            )}
            {syncSettings.enabled && syncSettings.provider === 'supabase' && (
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  realtimeStatus === 'connected' ? 'bg-emerald-400' :
                  realtimeStatus === 'connecting' ? 'bg-amber-400 animate-pulse' :
                  realtimeStatus === 'error' ? 'bg-rose-400' : 'bg-charcoal-600'
                }`} />
                <span className="text-[8px] text-charcoal-500 font-medium">
                  {realtimeStatus === 'connected' ? '🔌 Realtime WebSocket Live' :
                   realtimeStatus === 'connecting' ? '⏳ Connecting Realtime...' :
                   realtimeStatus === 'error' ? '⚠️ Realtime offline (polling fallback 30s)' : '🔌 Realtime idle'}
                </span>
              </div>
            )}
            {syncSettings.enabled && syncSettings.provider === 'demo' && (
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[8px] text-charcoal-500 font-medium">⏱️ Polling every 5s</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2 justify-end">
            {syncSettings.enabled && (
              <>
                <button onClick={onPush} disabled={isSyncingNow} className="px-2.5 py-1.5 border border-charcoal-800 hover:border-charcoal-700 text-charcoal-300 hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1">
                  <span>Upload (Local ➔ Cloud)</span>
                </button>
                <button onClick={onPull} disabled={isSyncingNow} className="px-2.5 py-1.5 border border-charcoal-800 hover:border-charcoal-700 text-charcoal-300 hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1">
                  <span>Download (Cloud ➔ Local)</span>
                </button>
              </>
            )}
            <button onClick={onClose} className="px-4 py-1.5 bg-sunset-500 hover:bg-sunset-600 text-charcoal-950 text-xs font-extrabold rounded-lg transition-colors">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}