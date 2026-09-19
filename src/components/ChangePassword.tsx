import { useState } from 'react';
import { apiFetch } from '../hooks/useAuth';
import type { AuthUser } from '../types';

interface ChangePasswordProps {
  user: AuthUser;
  onToast: (msg: string) => void;
}

export default function ChangePassword({ user, onToast }: ChangePasswordProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (next !== confirm) { onToast('New passwords do not match'); return; }
    if (next.length < 8) { onToast('New password must be at least 8 characters'); return; }
    setBusy(true);
    try {
      await apiFetch('/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      onToast('Password changed successfully');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Change failed');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = current && next && confirm && !busy;

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 max-w-md">
      <h3 className="text-sm font-bold text-white mb-1">Change My Password</h3>
      <p className="text-xs text-charcoal-500 mb-3">Signed in as <span className="font-mono">{user.username}</span></p>
      <div className="flex flex-col gap-2.5">
        <input type="password" placeholder="Current password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password"
          className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500" />
        <input type="password" placeholder="New password (min 8 chars)" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password"
          className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500" />
        <input type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
          className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500" />
        <button onClick={submit} disabled={!canSubmit}
          className={`text-xs font-black py-2 rounded-lg transition-all ${canSubmit ? 'bg-sunset-500 hover:bg-sunset-600 text-charcoal-950' : 'bg-charcoal-800 text-charcoal-500 cursor-not-allowed'}`}>
          {busy ? 'Saving…' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
