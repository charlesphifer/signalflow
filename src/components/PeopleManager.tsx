import { useState } from 'react';
import type { Person } from '../types';

interface PeopleManagerProps {
  people: Person[];
  onSave: (people: Person[]) => Promise<boolean>;
  onToast: (msg: string) => void;
}

const blank = (): Person => ({
  id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  roles: [],
  email: '',
  phone: '',
  company: '',
});

export default function PeopleManager({ people, onSave, onToast }: PeopleManagerProps) {
  const [draft, setDraft] = useState<Person[]>(people);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync from server when parent reloads (only when local has no unsaved edits)
  if (!dirty && draft !== people && people.length !== draft.length) {
    setDraft(people);
  }

  const update = (id: string, patch: Partial<Person>) => {
    setDraft(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
    setDirty(true);
  };

  const toggleRole = (id: string, role: 'AM' | 'PM') => {
    setDraft(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, roles: p.roles.includes(role) ? p.roles.filter(r => r !== role) : [...p.roles, role] }
          : p,
      ),
    );
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const cleaned = draft.filter(p => p.name.trim());
    const ok = await onSave(cleaned);
    setSaving(false);
    if (ok) {
      setDraft(cleaned);
      setDirty(false);
      onToast('People roster saved');
    } else {
      onToast('Save failed — check server');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">People Roster</h2>
          <p className="text-xs text-charcoal-400">
            Account managers (AM) and project managers (PM) — auto-fills contact details across projects and intake drafts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setDraft(prev => [...prev, blank()]); setDirty(true); }}
            className="text-xs font-bold border border-charcoal-700 hover:border-charcoal-500 text-charcoal-300 hover:text-white px-3 py-2 rounded-lg transition-all"
          >
            + Add Person
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`text-xs font-black px-4 py-2 rounded-lg transition-all ${
              dirty && !saving
                ? 'bg-sunset-500 hover:bg-sunset-600 text-charcoal-950'
                : 'bg-charcoal-800 text-charcoal-500 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving…' : dirty ? 'Save Roster' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {draft.length === 0 ? (
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-8 text-center text-charcoal-500 text-sm">
            No people yet. Add your AMs and PMs — they'll become dropdown options when creating projects.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {draft.map(person => (
              <div key={person.id} className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                <label className="md:col-span-3 text-[10px] font-bold text-charcoal-500 uppercase tracking-wide flex flex-col gap-1">
                  Name
                  <input
                    value={person.name}
                    onChange={e => update(person.id, { name: e.target.value })}
                    className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500"
                  />
                </label>
                <div className="md:col-span-2 text-[10px] font-bold text-charcoal-500 uppercase tracking-wide flex flex-col gap-1">
                  Roles
                  <div className="flex gap-1.5">
                    {(['AM', 'PM'] as const).map(role => (
                      <button
                        key={role}
                        onClick={() => toggleRole(person.id, role)}
                        className={`px-3 py-2 rounded-lg text-xs font-black border transition-all ${
                          person.roles.includes(role)
                            ? 'bg-indigo-900/60 border-indigo-600 text-sunset-500'
                            : 'border-charcoal-700 text-charcoal-500 hover:text-charcoal-300'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="md:col-span-3 text-[10px] font-bold text-charcoal-500 uppercase tracking-wide flex flex-col gap-1">
                  Email
                  <input
                    value={person.email}
                    onChange={e => update(person.id, { email: e.target.value })}
                    className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500"
                  />
                </label>
                <label className="md:col-span-2 text-[10px] font-bold text-charcoal-500 uppercase tracking-wide flex flex-col gap-1">
                  Phone
                  <input
                    value={person.phone}
                    onChange={e => update(person.id, { phone: e.target.value })}
                    className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500"
                  />
                </label>
                <label className="md:col-span-1 text-[10px] font-bold text-charcoal-500 uppercase tracking-wide flex flex-col gap-1">
                  Company
                  <input
                    value={person.company}
                    onChange={e => update(person.id, { company: e.target.value })}
                    className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500"
                  />
                </label>
                <button
                  onClick={() => { setDraft(prev => prev.filter(p => p.id !== person.id)); setDirty(true); }}
                  className="md:col-span-1 text-xs text-charcoal-500 hover:text-rose-400 py-2 transition-all"
                  title="Remove person"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
