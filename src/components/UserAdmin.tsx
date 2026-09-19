import { useState } from 'react';
import type { AuthUser, UserRole } from '../types';
import { apiFetch } from '../hooks/useAuth';
import ChangePassword from './ChangePassword';

interface UserAdminProps {
  currentUser: AuthUser;
  onToast: (msg: string) => void;
}

interface ManagedUser {
  id: string;
  username: string;
  roles: UserRole[];
  displayName: string;
}

const ROLES: UserRole[] = ['admin', 'engineer', 'viewer'];

export default function UserAdmin({ currentUser, onToast }: UserAdminProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', displayName: '', roles: ['engineer'] as UserRole[] });
  const [pwTarget, setPwTarget] = useState<ManagedUser | null>(null);
  const [newPw, setNewPw] = useState('');

  const load = () => {
    apiFetch<ManagedUser[]>('/users').then(u => { setUsers(u); setLoaded(true); }).catch(() => onToast('Failed to load users'));
  };
  if (!loaded) load();

  const createUser = async () => {
    if (!newUser.username || !newUser.password) { onToast('Username and password required'); return; }
    try {
      await apiFetch('/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
      setNewUser({ username: '', password: '', displayName: '', roles: ['engineer'] });
      onToast('User created');
      load();
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Create failed');
    }
  };

  const toggleRole = async (user: ManagedUser, role: UserRole) => {
    const roles = user.roles.includes(role) ? user.roles.filter(r => r !== role) : [...user.roles, role];
    if (roles.length === 0) { onToast('User needs at least one role'); return; }
    try {
      await apiFetch(`/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roles }) });
      load();
    } catch { onToast('Update failed'); }
  };

  const resetPassword = async () => {
    if (!pwTarget || newPw.length < 8) { onToast('Password must be at least 8 characters'); return; }
    try {
      await apiFetch(`/users/${pwTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPw }) });
      setPwTarget(null); setNewPw('');
      onToast(`Password reset for ${pwTarget.username}`);
    } catch { onToast('Reset failed'); }
  };

  const deleteUser = async (user: ManagedUser) => {
    if (user.id === currentUser.id) { onToast("Cannot delete your own account"); return; }
    try {
      await apiFetch(`/users/${user.id}`, { method: 'DELETE' });
      onToast(`Deleted ${user.username}`);
      load();
    } catch (e) { onToast(e instanceof Error ? e.message : 'Delete failed'); }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4">
        <h2 className="text-lg font-black text-white tracking-tight">User Administration</h2>
        <p className="text-xs text-charcoal-400">Manage login accounts and roles. Admins manage users; engineers edit projects; viewers are read-only.</p>
      </div>

      {/* Create user */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
        <label className="text-[10px] font-bold text-charcoal-500 uppercase flex flex-col gap-1 md:col-span-1">Username
          <input value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })}
            className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500" />
        </label>
        <label className="text-[10px] font-bold text-charcoal-500 uppercase flex flex-col gap-1 md:col-span-1">Password
          <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500" />
        </label>
        <label className="text-[10px] font-bold text-charcoal-500 uppercase flex flex-col gap-1 md:col-span-1">Display name
          <input value={newUser.displayName} onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
            className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500" />
        </label>
        <div className="text-[10px] font-bold text-charcoal-500 uppercase flex flex-col gap-1 md:col-span-1">Roles
          <div className="flex gap-1">
            {ROLES.map(r => (
              <button key={r} onClick={() => setNewUser(u => ({
                ...u,
                roles: u.roles.includes(r) ? u.roles.filter(x => x !== r) : [...u.roles, r],
              }))}
                className={`px-2 py-2 rounded-lg text-[10px] font-black border transition-all ${
                  newUser.roles.includes(r) ? 'bg-indigo-900/60 border-indigo-600 text-sunset-500' : 'border-charcoal-700 text-charcoal-500'
                }`}>{r.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <button onClick={createUser} className="bg-sunset-500 hover:bg-sunset-600 text-charcoal-950 text-xs font-black py-2.5 rounded-lg md:col-span-1">+ Create User</button>
      </div>

      <ChangePassword user={currentUser} onToast={onToast} />

      {/* User list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
        {users.map(user => (
          <div key={user.id} className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-3 flex flex-wrap items-center gap-3">
            <div className="min-w-[180px]">
              <p className="text-sm font-bold text-white">{user.displayName}</p>
              <p className="text-xs text-charcoal-500 font-mono">{user.username}</p>
            </div>
            <div className="flex gap-1.5">
              {ROLES.map(r => (
                <button key={r} onClick={() => toggleRole(user, r)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                    user.roles.includes(r) ? 'bg-indigo-900/60 border-indigo-600 text-sunset-500' : 'border-charcoal-700 text-charcoal-500 hover:text-charcoal-300'
                  }`}>{r.toUpperCase()}</button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => { setPwTarget(user); setNewPw(''); }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-charcoal-700 text-charcoal-400 hover:text-charcoal-200">Reset password</button>
              {user.id !== currentUser.id && (
                <button onClick={() => deleteUser(user)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-charcoal-700 text-charcoal-500 hover:text-rose-400 hover:border-rose-700">Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reset password modal */}
      {pwTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPwTarget(null)}>
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-1">Reset password</h3>
            <p className="text-xs text-charcoal-400 mb-3">For <span className="font-mono">{pwTarget.username}</span></p>
            <input type="password" autoFocus value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-sm mb-3 focus:outline-none focus:border-sunset-500" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setPwTarget(null)} className="text-xs font-bold px-3 py-2 rounded-lg border border-charcoal-700 text-charcoal-300">Cancel</button>
              <button onClick={resetPassword} className="text-xs font-black px-3 py-2 rounded-lg bg-sunset-500 hover:bg-sunset-600 text-charcoal-950">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
