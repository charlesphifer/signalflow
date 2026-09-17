import { useState, useEffect } from 'react';
import type { Person, PendingDraft, Project, ProjectType, DraftProjectType } from '../types';
import { DEFAULT_ASSESSMENT_CHECKLIST, DEFAULT_DESIGN_CHECKLIST } from '../data/defaultChecklists';
import { updateDraft, deleteDraft } from '../hooks/useIntake';

interface IntakeQueueProps {
  drafts: PendingDraft[];
  people: Person[];
  onRefresh: () => void;
  onConfirm: (draft: PendingDraft, overrides: DraftOverrides) => void;
  onToast: (msg: string) => void;
}

export interface DraftOverrides {
  projectType: DraftProjectType;
  projectNumber: string;
  pmName: string;
  amName: string;
}

function parseAddress(addr: string): { city: string; state: string; siteAddress: string } {
  // "DC NON-STOCK HARTWELL\n100 HARTWELL ST.\nWEST BOYLSTON MA  01583\nUSA"
  const lines = addr.trim().split(/\n+/).map(l => l.trim()).filter(Boolean);
  let city = '', state = '', siteAddress = addr.trim();
  const last = lines[lines.length - 1];
  const m = last && last.match(/^(.+?)\s+([A-Z]{2})\s+(\d{5})(-\d{4})?$/);
  if (m) {
    city = m[1].replace(/\s+/g, ' ').trim();
    state = m[2];
  }
  return { city, state, siteAddress };
}

export default function IntakeQueue({ drafts, people, onRefresh, onConfirm, onToast }: IntakeQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissTarget, setDismissTarget] = useState<PendingDraft | null>(null);
  const pending = drafts.filter(d => d.status === 'pending');

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">NK Order Intake</h2>
          <p className="text-xs text-charcoal-400">
            {pending.length} pending announcement{pending.length === 1 ? '' : 's'} · review, adjust, then confirm to create projects
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs font-bold border border-charcoal-700 hover:border-charcoal-500 text-charcoal-300 hover:text-white px-3 py-2 rounded-lg transition-all"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3">
        {drafts.length === 0 && (
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-8 text-center text-charcoal-500 text-sm">
            No announcements yet. Forwarded order announcements parsed by Hermes will appear here as pending drafts.
          </div>
        )}

        {drafts.map(draft => (
          <DraftCard
            key={draft.id}
            draft={draft}
            people={people}
            expanded={expandedId === draft.id}
            onToggle={() => setExpandedId(expandedId === draft.id ? null : draft.id)}
            onConfirm={onConfirm}
            onDismiss={() => setDismissTarget(draft)}
            onToast={onToast}
          />
        ))}
      </div>

      {dismissTarget && (
        <DismissModal
          draft={dismissTarget}
          onCancel={() => setDismissTarget(null)}
          onConfirm={async (alsoDelete) => {
            await updateDraft(dismissTarget.id, { status: 'dismissed' });
            if (alsoDelete) await deleteDraft(dismissTarget.id);
            setDismissTarget(null);
            onToast('Draft dismissed');
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function DraftCard({ draft, people, expanded, onToggle, onConfirm, onDismiss, onToast }: {
  draft: PendingDraft;
  people: Person[];
  expanded: boolean;
  onToggle: () => void;
  onConfirm: IntakeQueueProps['onConfirm'];
  onDismiss: () => void;
  onToast: (msg: string) => void;
}) {
  const [type, setType] = useState<DraftProjectType>(draft.suggestedType);
  const [projectNumber, setProjectNumber] = useState(
    draft.nkProjectNumbers[0] || `SO-${draft.salesOrderNumbers[0] || 'NEW'}`
  );
  const [pmName, setPmName] = useState('');
  const [amName, setAmName] = useState(draft.opportunityOwner || '');

  const ams = people.filter(p => p.roles.includes('AM'));
  const pms = people.filter(p => p.roles.includes('PM'));

  useEffect(() => { setType(draft.suggestedType); }, [draft.suggestedType]);

  const flagged = draft.reviewFlags.length > 0;

  return (
    <div className={`bg-charcoal-900 border rounded-xl overflow-hidden ${flagged ? 'border-amber-600/60' : 'border-charcoal-800'}`}>
      <button onClick={onToggle} className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-charcoal-800/40 transition-all">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate">{draft.accountName || 'Unknown account'}</span>
            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
              draft.suggestedType === 'Wireless Design' ? 'bg-indigo-900/60 text-indigo-300' :
              draft.suggestedType === 'Wireless Assessment' ? 'bg-emerald-900/60 text-emerald-300' :
              'bg-charcoal-800 text-charcoal-400'}`}>
              {draft.suggestedType}
            </span>
            {flagged && (
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300">
                ⚠ {draft.reviewFlags.length} flag{draft.reviewFlags.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="text-xs text-charcoal-400 mt-1 flex flex-wrap gap-x-3">
            <span>SO: {draft.salesOrderNumbers.join(', ') || '—'}</span>
            <span>PO: {draft.customerPo || '—'}</span>
            {draft.nkProjectNumbers.length > 0 && <span>P#: {draft.nkProjectNumbers.join(', ')}</span>}
            <span>Owner: {draft.opportunityOwner || '—'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {draft.status !== 'pending' && (
            <span className="text-[10px] uppercase font-bold text-charcoal-500">{draft.status}</span>
          )}
          <span className="text-charcoal-500 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-charcoal-800 p-4 flex flex-col gap-4">
          {/* Review flags */}
          {flagged && (
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wide mb-1">Review flags</p>
              <ul className="text-xs text-amber-200/90 list-disc list-inside">
                {draft.reviewFlags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {/* Parsed fields */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <Field label="Quote #" value={draft.quoteNumber} />
            <Field label="Order date" value={draft.orderDate} />
            <Field label="Requested date" value={draft.requestedDate} />
            <Field label="Sales rep" value={draft.salesRep} />
            <Field label="Entered by" value={draft.enteredBy} />
            <Field label="Order total" value={draft.orderTotal != null ? `$${draft.orderTotal.toLocaleString()}` : ''} />
            <Field label="Bill to" value={draft.billTo} wide />
            <Field label="Ship to" value={draft.shipTo} wide />
          </div>

          {/* Qualifying line items */}
          {draft.qualifyingLineItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-charcoal-300 uppercase tracking-wide mb-1.5">Qualifying line items</p>
              <div className="bg-charcoal-950 border border-charcoal-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-charcoal-500 border-b border-charcoal-800">
                      <th className="text-left px-3 py-1.5">Code</th>
                      <th className="text-left px-3 py-1.5">Description</th>
                      <th className="text-right px-3 py-1.5">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.qualifyingLineItems.map((li, i) => (
                      <tr key={i} className="border-b border-charcoal-800/50 last:border-0">
                        <td className="px-3 py-1.5 font-mono text-sunset-500">{li.code}</td>
                        <td className="px-3 py-1.5 text-charcoal-300">{li.description}</td>
                        <td className="px-3 py-1.5 text-right text-charcoal-200">{li.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {draft.notes.length > 0 && (
            <div>
              <p className="text-xs font-bold text-charcoal-300 uppercase tracking-wide mb-1.5">Notes from documents</p>
              <ul className="text-xs text-charcoal-400 list-disc list-inside space-y-0.5">
                {draft.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          )}

          {/* Confirm form */}
          <div className="border-t border-charcoal-800 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs text-charcoal-400 flex flex-col gap-1">
              Project type
              <select
                value={type}
                onChange={e => setType(e.target.value as DraftProjectType)}
                className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500"
              >
                <option value="Unknown">— select —</option>
                <option value="Wireless Assessment">Wireless Assessment</option>
                <option value="Wireless Design">Wireless Design</option>
              </select>
            </label>
            <label className="text-xs text-charcoal-400 flex flex-col gap-1">
              Project number
              <input
                value={projectNumber}
                onChange={e => setProjectNumber(e.target.value)}
                className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500"
              />
            </label>
            <label className="text-xs text-charcoal-400 flex flex-col gap-1">
              Account manager (AM)
              <input
                list="intake-ams"
                value={amName}
                onChange={e => setAmName(e.target.value)}
                placeholder={draft.opportunityOwner || 'Select or type…'}
                className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500"
              />
              <datalist id="intake-ams">
                {ams.map(p => <option key={p.id} value={p.name} />)}
              </datalist>
            </label>
            <label className="text-xs text-charcoal-400 flex flex-col gap-1">
              Project manager (PM)
              <input
                list="intake-pms"
                value={pmName}
                onChange={e => setPmName(e.target.value)}
                placeholder="Select or type…"
                className="bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-charcoal-100 text-xs focus:outline-none focus:border-sunset-500"
              />
              <datalist id="intake-pms">
                {pms.map(p => <option key={p.id} value={p.name} />)}
              </datalist>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onDismiss}
              className="text-xs font-bold px-3 py-2 rounded-lg border border-charcoal-700 text-charcoal-400 hover:text-rose-400 hover:border-rose-700 transition-all"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                if (type === 'Unknown') {
                  onToast('Select a project type first');
                  return;
                }
                onConfirm(draft, { projectType: type, projectNumber, pmName, amName });
              }}
              className="text-xs font-black px-4 py-2 rounded-lg bg-sunset-500 hover:bg-sunset-600 text-charcoal-950 transition-all"
            >
              Confirm → Create Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2 md:col-span-3' : ''}>
      <p className="text-charcoal-500 uppercase tracking-wide text-[10px] font-bold">{label}</p>
      <p className="text-charcoal-200 whitespace-pre-line break-words">{value || '—'}</p>
    </div>
  );
}

function DismissModal({ draft, onCancel, onConfirm }: {
  draft: PendingDraft;
  onCancel: () => void;
  onConfirm: (alsoDelete: boolean) => void;
}) {
  const [alsoDelete, setAlsoDelete] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-white mb-2">Dismiss draft?</h3>
        <p className="text-xs text-charcoal-400 mb-4">
          "{draft.accountName || draft.emailSubject}" will be marked dismissed and removed from the queue.
        </p>
        <label className="text-xs text-charcoal-400 flex items-center gap-2 mb-4">
          <input type="checkbox" checked={alsoDelete} onChange={e => setAlsoDelete(e.target.checked)} />
          Delete permanently (otherwise kept in the log)
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="text-xs font-bold px-3 py-2 rounded-lg border border-charcoal-700 text-charcoal-300">Cancel</button>
          <button onClick={() => onConfirm(alsoDelete)} className="text-xs font-black px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white">Dismiss</button>
        </div>
      </div>
    </div>
  );
}

// Re-export for App to build a Project from a draft
export function draftToProject(draft: PendingDraft, overrides: DraftOverrides): Project {
  const { city, state, siteAddress } = parseAddress(draft.shipTo || draft.billTo || '');
  const type: ProjectType = overrides.projectType === 'Wireless Design' ? 'Wireless Design' : 'Wireless Assessment';
  return {
    id: Date.now().toString(),
    number: overrides.projectNumber || `SO-${draft.salesOrderNumbers[0] || 'NEW'}`,
    name: draft.accountName || 'Unnamed account',
    city: city || 'TBD',
    state: state || '',
    credentials: '',
    type,
    stage: 'Kickoff',
    travelStart: '',
    travelEnd: '',
    siteStart: '',
    siteEnd: '',
    goLiveDate: draft.requestedDate || '',
    pm: { name: overrides.pmName || draft.opportunityOwner || 'TBD' },
    ae: { name: overrides.amName || draft.opportunityOwner || 'TBD' },
    itContact: { name: 'TBD', email: 'TBD', phone: 'TBD' },
    soNumber: draft.salesOrderNumbers.join(', '),
    customerPo: draft.customerPo,
    quoteNumber: draft.quoteNumber,
    nkProjectNumber: draft.nkProjectNumbers[0] || '',
    salesforceUrl: draft.salesforceUrl,
    source: 'email',
    siteAddress,
    notes: [
      `Created from order announcement (${draft.emailSubject})`,
      draft.salesRep && `Sales rep: ${draft.salesRep}`,
      draft.orderTotal != null && `Order total: $${draft.orderTotal.toLocaleString()}`,
      ...draft.notes,
    ].filter(Boolean).join('\n'),
    checklist: (type === 'Wireless Assessment' ? DEFAULT_ASSESSMENT_CHECKLIST : DEFAULT_DESIGN_CHECKLIST).map(item => ({ ...item })),
    calendarSynced: false,
    isArchived: false,
  };
}
