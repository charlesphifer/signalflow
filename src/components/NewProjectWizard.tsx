import type { ProjectType } from '../types';

interface WizardProps {
  showWizard: boolean;
  wizardStep: number;
  wizName: string;
  wizNumber: string;
  wizCity: string;
  wizState: string;
  wizCredentials: string;
  wizPmName: string;
  wizAeName: string;
  wizItName: string;
  wizItEmail: string;
  wizItPhone: string;
  wizTravelStart: string;
  wizTravelEnd: string;
  wizSiteStart: string;
  wizSiteEnd: string;
  wizGoLive: string;
  wizType: ProjectType;
  wizDrive: boolean;
  wizCalendar: boolean;
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
  onSetDrive: (v: boolean) => void;
  onSetCalendar: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onCreate: () => void;
}

export default function NewProjectWizard({
  showWizard, wizardStep, wizName, wizNumber, wizCity, wizState, wizCredentials,
  wizPmName, wizAeName, wizItName, wizItEmail, wizItPhone,
  wizTravelStart, wizTravelEnd, wizSiteStart, wizSiteEnd, wizGoLive,
  wizType, wizDrive, wizCalendar,
  onClose, onSetName, onSetNumber, onSetCity, onSetState, onSetCredentials,
  onSetPmName, onSetAeName, onSetItName, onSetItEmail, onSetItPhone,
  onSetTravelStart, onSetTravelEnd, onSetSiteStart, onSetSiteEnd, onSetGoLive,
  onSetType, onSetDrive, onSetCalendar, onNext, onBack, onCreate,
}: WizardProps) {
  if (!showWizard) return null;

  const stepLabel = wizardStep === 1 ? 'Core Details' :
    wizardStep === 2 ? 'Key Stakeholders' :
    wizardStep === 3 ? 'Deployment Timelines' : 'Automations & Configs';

  const progressPct = (wizardStep / 4) * 100;

  return (
    <div className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal-900 border border-indigo-900 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-charcoal-950 border-b border-charcoal-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sunset-500">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
              <span>New Project Wizard</span>
            </h3>
            <p className="text-[10px] text-charcoal-400">Step {wizardStep} of 4: {stepLabel}</p>
          </div>
          <button onClick={onClose} className="text-charcoal-500 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-charcoal-950 w-full">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-sunset-500 to-indigo-800 transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]">
          {/* STEP 1 */}
          {wizardStep === 1 && (
            <div className="space-y-3.5">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1.5">1. General Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">Hospital / Account Name *</label>
                  <input type="text" placeholder="e.g. St. Jude Children's Hospital" value={wizName} onChange={e => onSetName(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">Project ID</label>
                    <input type="text" placeholder="e.g. NK-2026-948" value={wizNumber} onChange={e => onSetNumber(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">Credentialing</label>
                    <select value={wizCredentials} onChange={e => onSetCredentials(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500">
                      <option value="Symplr (Required)">Symplr</option>
                      <option value="Reptrax (Required)">Reptrax</option>
                      <option value="IntelliCentrics">IntelliCentrics</option>
                      <option value="None / General check-in">None / Regular Visitor</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">City</label>
                    <input type="text" placeholder="Memphis" value={wizCity} onChange={e => onSetCity(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">State</label>
                    <input type="text" placeholder="TN" value={wizState} onChange={e => onSetState(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1">2A. Project Manager (PM)</h4>
                <input type="text" placeholder="Sarah Jenkins (Project Manager Name)" value={wizPmName} onChange={e => onSetPmName(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sunset-500" />
              </div>
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1">2B. Account Executive (AE)</h4>
                <input type="text" placeholder="Marcus Vance (Account Executive Name)" value={wizAeName} onChange={e => onSetAeName(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sunset-500" />
              </div>
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1">2C. Hospital IT / BioMed Lead</h4>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="Name" value={wizItName} onChange={e => onSetItName(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sunset-500" />
                  <input type="text" placeholder="Email" value={wizItEmail} onChange={e => onSetItEmail(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sunset-500" />
                  <input type="text" placeholder="Phone" value={wizItPhone} onChange={e => onSetItPhone(e.target.value)} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sunset-500" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {wizardStep === 3 && (
            <div className="space-y-3.5">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1.5">3. Key Schedule Dates</h4>
              <div className="space-y-3">
                <div className="bg-charcoal-950/50 p-2.5 border border-charcoal-800 rounded-xl space-y-2.5">
                  <span className="text-[10px] uppercase font-bold text-sunset-500">✈️ Blocked Travel Dates (Outlook Busy)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-charcoal-400">Start</label>
                      <input type="date" value={wizTravelStart} onChange={e => onSetTravelStart(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-charcoal-950 border border-charcoal-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-sunset-500" />
                    </div>
                    <div>
                      <label className="text-[9px] text-charcoal-400">End</label>
                      <input type="date" value={wizTravelEnd} onChange={e => onSetTravelEnd(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-charcoal-950 border border-charcoal-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-sunset-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-charcoal-950/50 p-2.5 border border-charcoal-800 rounded-xl space-y-2.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-400">🏥 On-Site Assessment Schedule</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-charcoal-400">Start</label>
                      <input type="date" value={wizSiteStart} onChange={e => onSetSiteStart(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-charcoal-950 border border-charcoal-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-sunset-500" />
                    </div>
                    <div>
                      <label className="text-[9px] text-charcoal-400">End</label>
                      <input type="date" value={wizSiteEnd} onChange={e => onSetSiteEnd(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-charcoal-950 border border-charcoal-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-sunset-500" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">Target Go-Live Date</label>
                  <input type="date" value={wizGoLive} onChange={e => onSetGoLive(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sunset-500" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-charcoal-800 pb-1.5">4. Setup Automations & Select Template</h4>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">Checklist Template</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => onSetType('Wireless Assessment')} className={`text-left p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                    wizType === 'Wireless Assessment' ? 'bg-orange-950/40 border-sunset-500 text-white shadow' : 'bg-charcoal-950 border-charcoal-800 hover:border-charcoal-700 text-charcoal-400'
                  }`}>
                    <span className="text-xs font-extrabold block mb-1 text-sunset-500">Wireless Assessment</span>
                    <span className="text-[10px] leading-relaxed">Hospital telemetry SSID assessment, POC walking surveys, 16 step checklist.</span>
                  </button>
                  <button onClick={() => onSetType('Wireless Design')} className={`text-left p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                    wizType === 'Wireless Design' ? 'bg-indigo-950/40 border-indigo-500 text-white shadow' : 'bg-charcoal-950 border-charcoal-800 hover:border-charcoal-700 text-charcoal-400'
                  }`}>
                    <span className="text-xs font-extrabold block mb-1 text-indigo-400">Wireless Design</span>
                    <span className="text-[10px] leading-relaxed">AP hardware layout, staging, physical installation, 12 step checklist.</span>
                  </button>
                </div>
              </div>
              <div className="space-y-2.5 pt-2">
                <label className="block text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">Initialization Routines</label>
                <div className="bg-charcoal-950/60 p-3.5 border border-charcoal-800 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">📂 Build Google Drive Structure</span>
                      <span className="text-[10px] text-charcoal-500">Create folder hierarchy automatically.</span>
                    </div>
                    <button onClick={() => onSetDrive(!wizDrive)} className={`w-11 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${wizDrive ? 'bg-sunset-500 justify-end' : 'bg-charcoal-800 justify-start'}`}>
                      <span className="w-4 h-4 bg-charcoal-950 rounded-full shadow" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between border-t border-charcoal-800/60 pt-3">
                    <div>
                      <span className="text-xs font-bold text-white block">📅 Sync Travel to Outlook</span>
                      <span className="text-[10px] text-charcoal-500">Block dates as "Busy" so PMs cannot schedule meetings.</span>
                    </div>
                    <button onClick={() => onSetCalendar(!wizCalendar)} className={`w-11 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${wizCalendar ? 'bg-sunset-500 justify-end' : 'bg-charcoal-800 justify-start'}`}>
                      <span className="w-4 h-4 bg-charcoal-950 rounded-full shadow" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-charcoal-950 border-t border-charcoal-800 flex justify-between">
          <button onClick={onBack} disabled={wizardStep === 1} className="flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-lg border border-charcoal-800 hover:border-charcoal-700 text-charcoal-300 disabled:opacity-30 disabled:hover:border-charcoal-800 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            <span>BACK</span>
          </button>
          {wizardStep < 4 ? (
            <button onClick={onNext} className="bg-indigo-950/60 border border-indigo-700 text-sunset-500 hover:bg-indigo-900/60 text-xs font-black tracking-wider px-5 py-2 rounded-lg flex items-center space-x-1.5 transition-all shadow">
              <span>NEXT</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          ) : (
            <button onClick={onCreate} className="bg-sunset-500 hover:bg-sunset-600 text-charcoal-950 text-xs font-black tracking-widest px-5 py-2 rounded-lg flex items-center space-x-1.5 transition-all shadow-md shadow-sunset-500/15">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span>INITIALIZE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}