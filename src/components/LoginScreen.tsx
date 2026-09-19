import { useState } from 'react';
import { login } from '../hooks/useAuth';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username, password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

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
          <label className="flex flex-col gap-1.5 text-xs font-bold text-charcoal-400 uppercase tracking-wide">
            Username
            <input
              autoFocus
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2.5 text-charcoal-100 text-sm focus:outline-none focus:border-sunset-500"
            />
          </label>
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

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || !username || !password}
            className={`mt-1 w-full py-2.5 rounded-lg text-sm font-black tracking-wider transition-all ${
              busy || !username || !password
                ? 'bg-charcoal-800 text-charcoal-500 cursor-not-allowed'
                : 'bg-sunset-500 hover:bg-sunset-600 text-charcoal-950 shadow-md'
            }`}
          >
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
