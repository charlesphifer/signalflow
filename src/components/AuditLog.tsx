import { useState } from 'react';
import { apiFetch } from '../hooks/useAuth';

interface AuditEntry {
  id: string;
  at: string;
  user: string;
  username: string;
  ip: string;
  action: string;
  target: string;
  [k: string]: unknown;
}

interface AuditLogProps {
  onToast: (msg: string) => void;
}

const ACTION_COLORS: Record<string, string> = {
  'auth.login': 'bg-emerald-900/50 text-emerald-300',
  'auth.failedLogin': 'bg-rose-900/50 text-rose-300',
  'auth.passwordReset': 'bg-amber-900/50 text-amber-300',
  'auth.passwordChanged': 'bg-amber-900/50 text-amber-300',
  'project.create': 'bg-indigo-900/50 text-indigo-300',
  'project.delete': 'bg-rose-900/50 text-rose-300',
  'project.fieldChanged': 'bg-charcoal-800 text-charcoal-300',
  'project.notesChanged': 'bg-charcoal-800 text-charcoal-300',
  'project.archived': 'bg-charcoal-800 text-charcoal-300',
  'project.unarchived': 'bg-charcoal-800 text-charcoal-300',
  'checklist.completed': 'bg-sunset-500/20 text-sunset-500',
  'checklist.uncompleted': 'bg-charcoal-800 text-charcoal-300',
  'checklist.assigned': 'bg-indigo-900/50 text-indigo-300',
  'checklist.itemAdded': 'bg-charcoal-800 text-charcoal-300',
  'user.created': 'bg-indigo-900/50 text-indigo-300',
  'user.updated': 'bg-charcoal-800 text-charcoal-300',
  'user.deleted': 'bg-rose-900/50 text-rose-300',
  'draft.confirmed': 'bg-emerald-900/50 text-emerald-300',
  'draft.dismissed': 'bg-charcoal-800 text-charcoal-300',
  'draft.deleted': 'bg-rose-900/50 text-rose-300',
  'people.rosterSaved': 'bg-charcoal-800 text-charcoal-300',
};

function describe(e: AuditEntry): string {
  const d = e as Record<string, any>;
  switch (e.action) {
    case 'checklist.completed':
    case 'checklist.uncompleted':
      return `"${d.item}" ${e.action === 'checklist.completed' ? 'marked complete' : 'un-marked'}`;
    case 'checklist.assigned':
      return `"${d.item}" reassigned: ${d.from} → ${d.to}`;
    case 'checklist.itemAdded':
      return `task added: "${d.item}"`;
    case 'project.fieldChanged':
      return `${d.field}: ${String(d.from).slice(0, 30)} → ${String(d.to).slice(0, 30)}`;
    case 'auth.failedLogin':
      return `failed login (${d.reason})`;
    case 'user.updated':
      return `changed: ${(d.changed || []).join(', ') || 'details'}`;
    case 'draft.confirmed':
    case 'draft.dismissed':
      return `status ${d.from} → ${d.to}`;
    default:
      return '';
  }
}

export default function AuditLog({ onToast }: AuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterText, setFilterText] = useState('');

  const load = () => {
    apiFetch<AuditEntry[]>('/audit')
      .then((a) => { setEntries(a); setLoaded(true); })
      .catch(() => onToast('Failed to load audit log'));
  };
  if (!loaded) load();

  const users = Array.from(new Set(entries.map((e) => e.username).filter(Boolean))).sort();
  const actions = Array.from(new Set(entries.map((e) => e.action))).sort();

  const filtered = entries.filter((e) => {
    if (filterUser && e.username !== filterUser) return false;
    if (filterAction && e.action !== filterAction) return false;
    if (filterText) {
      const hay = `${e.target} ${e.user} ${describe(e)}`.toLowerCase();
      if (!hay.includes(filterText.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Audit Log</h2>
          <p className="text-xs text-charcoal-400">
            Append-only record of every action. {entries.length} entries. View-only — no edits, no deletes.
          </p>
        </div>
        <button onClick={load} className="text-xs font-bold border border-charcoal-700 hover:border-charcoal-500 text-charcoal-300 hover:text-white px-3 py-2 rounded-lg transition-all">
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}
          className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500">
          <option value="">All users</option>
          {users.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
          className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500">
          <option value="">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Search projects, tasks, details…"
          className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500"
        />
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-8 text-center text-charcoal-500 text-sm">
            {loaded ? 'No entries match the filters.' : 'Loading…'}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((e) => (
              <div key={e.id} className="bg-charcoal-900 border border-charcoal-800/70 rounded-lg px-3 py-2 flex items-start gap-3 text-xs">
                <span className="text-charcoal-500 font-mono shrink-0 w-32">
                  {new Date(e.at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`shrink-0 text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${ACTION_COLORS[e.action] || 'bg-charcoal-800 text-charcoal-400'}`}>
                  {e.action}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-charcoal-200 font-bold">{e.user}</span>
                  {e.target && <span className="text-charcoal-400"> → {e.target}</span>}
                  {describe(e) && <span className="text-charcoal-400"> — {describe(e)}</span>}
                </div>
                <span className="text-charcoal-600 font-mono shrink-0">{e.ip}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
