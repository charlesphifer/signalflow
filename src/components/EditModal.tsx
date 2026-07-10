import type { ProjectType, ProjectStage } from '../types';

interface EditModalProps {
  showEditModal: boolean;
  editName: string;
  editNumber: string;
  editCity: string;
  editState: string;
  editCredentials: string;
  editPmName: string;
  editAeName: string;
  editItName: string;
  editItEmail: string;
  editItPhone: string;
  editTravelStart: string;
  editTravelEnd: string;
  editSiteStart: string;
  editSiteEnd: string;
  editGoLive: string;
  editType: ProjectType;
  editStage: ProjectStage;
  onClose: () => void;
  onSetName: (v: string) => void;
  onSetNumber: (v: string) => void;
  onSetCity: (v: string) => void;
  onSetState: (v: string) => void;
  onSetCredentials: (v: string) => void;
  onSetPmName: (v: string) => void;
  onSetAeName: (v: string) => void;
  onSetItName: (v: string) => void;
  onSetItEmail: (v: string) => void;
  onSetItPhone: (v: string) => void;
  onSetTravelStart: (v: string) => void;
  onSetTravelEnd: (v: string) => void;
  onSetSiteStart: (v: string) => void;
  onSetSiteEnd: (v: string) => void;
  onSetGoLive: (v: string) => void;
  onSetType: (v: ProjectType) => void;
  onSetStage: (v: ProjectStage) => void;
  onSave: () => void;
}

export default function EditModal({
  showEditModal, editName, editNumber, editCity, editState, editCredentials,
  editPmName, editAeName, editItName, editItEmail, editItPhone,
  editTravelStart, editTravelEnd, editSiteStart, editSiteEnd, editGoLive,
  editType, editStage,
  onClose, onSetName, onSetNumber, onSetCity, onSetState, onSetCredentials,
  onSetPmName, onSetAeName, onSetItName, onSetItEmail, onSetItPhone,
  onSetTravelStart, onSetTravelEnd, onSetSiteStart, onSetSiteEnd, onSetGoLive,
  onSetType, onSetStage, onSave,
}: EditModalProps) {
  if (!showEditModal) return null;

  return (
    <div className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal-900 border border-indigo-900 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-4 bg-charcoal-950 border-b border-charcoal-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sunset-500">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
              </svg>
              <span>Edit Project Details</span>
            </h3>
            <p className="text-[10px] text-charcoal-400">Update core information, stakeholders, timelines, and status</p>
          </div>
          <button onClick={onClose} className="text-charcoal-500 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Row 1: Number & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">Project ID / Salesforce #</label>
              <input type="text" value={editNumber} onChange={e => onSetNumber(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500" placeholder="e.g. NK-2026-948" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">Hospital / Site Name</label>
              <input type="text" value={editName} onChange={e => onSetName(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500" placeholder="e.g. St. Jude Medical Center" />
            </div>
          </div>

          {/* Row 2: City, State, Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">City</label>
              <input type="text" value={editCity} onChange={e => onSetCity(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500" placeholder="e.g. Memphis" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">State</label>
              <input type="text" maxLength={2} value={editState} onChange={e => onSetState(e.target.value.toUpperCase())} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500 text-center" placeholder="TN" />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">Credentials Required</label>
              <select value={editCredentials} onChange={e => onSetCredentials(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-sunset-500">
                <option value="Symplr">Symplr</option>
                <option value="IntelliCentrics">IntelliCentrics</option>
                <option value="VendorMate">VendorMate</option>
                <option value="None / Visitor badge">None / Visitor badge</option>
              </select>
            </div>
          </div>

          {/* Row 3: Type & Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">Project Type</label>
              <select value={editType} onChange={e => onSetType(e.target.value as ProjectType)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500">
                <option value="Wireless Assessment">Wireless Assessment</option>
                <option value="Wireless Design">Wireless Design</option>
              </select>
              <span className="text-[9px] text-charcoal-500 mt-1 block">Changing type resets checklist to match template.</span>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">Project Stage</label>
              <select value={editStage} onChange={e => onSetStage(e.target.value as ProjectStage)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500">
                <option value="Kickoff">Kickoff</option>
                <option value="Pre-Work">Pre-Work</option>
                <option value="On-Site">On-Site</option>
                <option value="Reporting">Reporting</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="h-[1px] bg-charcoal-800 my-1" />

          {/* Row 4: PM & AE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mb-1">NK PM Name</label>
              <input type="text" value={editPmName} onChange={e => onSetPmName(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500" placeholder="Project Manager Name" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mb-1">NK AE Name</label>
              <input type="text" value={editAeName} onChange={e => onSetAeName(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500" placeholder="Account Executive Name" />
            </div>
          </div>

          {/* Row 5: IT Contact */}
          <div className="bg-charcoal-950/40 p-3 rounded-xl border border-charcoal-800/60 space-y-3">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Hospital BioMed / IT Contact</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-charcoal-400 mb-1">Full Name</label>
                <input type="text" value={editItName} onChange={e => onSetItName(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sunset-500" placeholder="Contact Name" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-charcoal-400 mb-1">Email</label>
                <input type="email" value={editItEmail} onChange={e => onSetItEmail(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sunset-500" placeholder="name@hospital.org" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-charcoal-400 mb-1">Phone</label>
                <input type="text" value={editItPhone} onChange={e => onSetItPhone(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sunset-500" placeholder="555-0199" />
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-charcoal-800 my-1" />

          {/* Row 6: Timelines */}
          <div className="space-y-3">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500">Project Timelines</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-charcoal-950/40 p-2.5 rounded-xl border border-charcoal-800/40">
                <label className="block text-[9px] font-bold text-charcoal-400 mb-1 uppercase">Travel Window</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" style={{ colorScheme: 'dark' }} value={editTravelStart} onChange={e => onSetTravelStart(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sunset-500" />
                  <input type="date" style={{ colorScheme: 'dark' }} value={editTravelEnd} onChange={e => onSetTravelEnd(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sunset-500" />
                </div>
              </div>
              <div className="bg-charcoal-950/40 p-2.5 rounded-xl border border-charcoal-800/40">
                <label className="block text-[9px] font-bold text-charcoal-400 mb-1 uppercase">On-Site Dates</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" style={{ colorScheme: 'dark' }} value={editSiteStart} onChange={e => onSetSiteStart(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sunset-500" />
                  <input type="date" style={{ colorScheme: 'dark' }} value={editSiteEnd} onChange={e => onSetSiteEnd(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sunset-500" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-sunset-500 mb-1">Go-Live Date</label>
              <input type="date" style={{ colorScheme: 'dark' }} value={editGoLive} onChange={e => onSetGoLive(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-charcoal-950 border-t border-charcoal-800 flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-charcoal-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={onSave} className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sunset-500 hover:bg-sunset-400 text-charcoal-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-sunset-500/20 transition-all hover:scale-[1.02]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}