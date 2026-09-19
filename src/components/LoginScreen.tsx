import { useState } from 'react';
import { login } from '../hooks/useAuth';

const API = '/api';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Forgot-password states
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(username, password);
        onLogin();
      } else if (mode === 'forgot') {
        const res = await fetch(`${API}/auth/forgot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Request failed');
        setInfo(data.message || 'Reset code sent to the administrator.');
        setMode('reset');
      } else {
        if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
        const res = await fetch(`${API}/auth/reset`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, code: resetCode, newPassword }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Reset failed');
        setInfo('Password reset! Sign in with your new password.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'login' ? 'Sign In' : mode === 'forgot' ? 'Forgot Password' : 'Set New Password';

  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sunset-500 to-indigo-500 flex items-center justify-center shadow-lg mb-4">
            <span className="font-extrabold text-charcoal-950 text-2xl tracking-wider">SF</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            SIGNAL<span className="text-sunset-500">FLOW</span>
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">Nihon Kohden Wireless Deployment Assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 flex flex-col gap-4 shadow-xl">
          <h2 className="text-sm font-bold text-charcoal-300 uppercase tracking-wide">{title}</h2>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-charcoal-400 uppercase tracking-wide">
            Username
            <input
              autoFocus
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              disabled={mode === 'reset'}
              className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2.5 text-charcoal-100 text-sm focus:outline-none focus:border-sunset-500 disabled:opacity-50"
            />
          </label>

          {mode === 'login' && (
            <label className="flex flex-col gap-1.5 text-xs font-bold text-charcoal-400 uppercase tracking-wide">
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2.5 text-charcoal-100 text-sm focus:outline-none focus:border-sunset-500"
              />
            </label>
          )}

          {mode === 'reset' && (
            <>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-charcoal-400 uppercase tracking-wide">
                Reset code (from administrator)
                <input
                  autoFocus
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  inputMode="numeric"
                  className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2.5 text-charcoal-100 text-sm font-mono tracking-widest focus:outline-none focus:border-sunset-500"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-charcoal-400 uppercase tracking-wide">
                New password (min 8 chars)
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2.5 text-charcoal-100 text-sm focus:outline-none focus:border-sunset-500"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-charcoal-400 uppercase tracking-wide">
                Confirm new password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2.5 text-charcoal-100 text-sm focus:outline-none focus:border-sunset-500"
                />
              </label>
            </>
          )}

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-lg px-3 py-2">{error}</p>
          )}
          {info && (
            <p className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 rounded-lg px-3 py-2">{info}</p>
          )}

          <button
            type="submit"
            disabled={busy || (mode === 'login' && (!username || !password)) || (mode === 'forgot' && !username) || (mode === 'reset' && (!resetCode || !newPassword || !confirmPassword))}
            className={`mt-1 w-full py-2.5 rounded-lg text-sm font-black tracking-wider transition-all ${
              busy ? 'bg-charcoal-800 text-charcoal-500 cursor-not-allowed' : 'bg-sunset-500 hover:bg-sunset-600 text-charcoal-950 shadow-md'
            }`}
          >
            {busy ? 'Working…' : mode === 'login' ? 'Sign In' : mode === 'forgot' ? 'Request Reset Code' : 'Set New Password'}
          </button>

          <div className="text-center">
            {mode === 'login' ? (
              <button type="button" onClick={() => { setMode('forgot'); setError(null); setInfo(null); }} className="text-xs text-charcoal-500 hover:text-sunset-500 transition-all">
                Forgot password?
              </button>
            ) : (
              <button type="button" onClick={() => { setMode('login'); setError(null); setInfo(null); }} className="text-xs text-charcoal-500 hover:text-sunset-500 transition-all">
                ← Back to sign in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
