import type { ActiveTab } from '../types';

type SaveStatus = 'saved' | 'saving' | 'error' | 'idle';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  saveStatus: SaveStatus;
  onSaveNow: () => void;
  onNewProject: () => void;
  pendingDraftCount: number;
}

const tabs: { id: ActiveTab; label: string; shortLabel: string }[] = [
  { id: 'projects', label: 'Deployment Dashboard', shortLabel: 'Dashboard' },
  { id: 'intake', label: 'NK Order Intake', shortLabel: 'Intake' },
  { id: 'people', label: 'People Roster', shortLabel: 'People' },
  { id: 'calendar', label: 'Interactive Calendar', shortLabel: 'Calendar' },
  { id: 'email-vault', label: 'Email Boilerplate Vault', shortLabel: 'Email Vault' },
  { id: 'docs-search', label: 'Technical Reference Vault', shortLabel: 'Tech Ref' },
];

export default function Header({ activeTab, onTabChange, saveStatus, onSaveNow, onNewProject, pendingDraftCount }: HeaderProps) {
  const statusConfig = {
    saved:   { label: 'Saved',       color: 'text-emerald-400', dot: 'bg-emerald-400' },
    saving:  { label: 'Saving...',   color: 'text-amber-400',   dot: 'bg-amber-400 animate-pulse' },
    error:   { label: 'Save Failed', color: 'text-rose-400',    dot: 'bg-rose-400' },
    idle:    { label: 'Not Saved',   color: 'text-charcoal-500', dot: 'bg-charcoal-500' },
  }[saveStatus];

  return (
    <header className="sticky top-0 z-40 bg-charcoal-900 border-b border-indigo-900 shadow-lg px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex items-center justify-between w-full lg:w-auto">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sunset-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
            <span className="font-extrabold text-charcoal-950 text-lg tracking-wider">SF</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center flex-wrap">
              SIGNAL<span className="text-sunset-500">FLOW</span>
              <span className="ml-2 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-indigo-900/50 border border-indigo-700/50 rounded text-indigo-300">
                Custom Workspace
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-charcoal-400 font-medium tracking-wide">
              Nihon Kohden Wireless Deployment Assistant
            </p>
          </div>
        </div>

        {/* Mobile actions */}
        <div className="lg:hidden flex items-center space-x-1.5 shrink-0">
          <button onClick={onSaveNow} className="p-2 rounded-lg border border-charcoal-800 text-charcoal-400" title="Save now">
            <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
          </button>
          <button onClick={onNewProject} className="bg-sunset-500 hover:bg-sunset-600 text-charcoal-950 text-xs font-black tracking-wider px-3.5 py-2 rounded-lg flex items-center space-x-1 shadow-md transition-all duration-200">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">NEW PROJECT</span>
            <span className="sm:hidden">NEW</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }} className="flex items-center space-x-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 whitespace-nowrap">
        <style>{`.scrollbar-none::-webkit-scrollbar { display: none !important; }`}</style>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-1.5 px-3 py-2 sm:px-3.5 rounded-lg text-xs font-bold transition-all duration-200 border shrink-0 ${
              activeTab === tab.id
                ? 'bg-indigo-950/60 border-indigo-700 text-sunset-500'
                : 'border-transparent hover:border-charcoal-800 text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {tab.id === 'intake' && pendingDraftCount > 0 && (
              <span className="bg-sunset-500 text-charcoal-950 text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {pendingDraftCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Desktop save status + new project */}
      <div className="hidden lg:flex items-center space-x-2 shrink-0">
        <button onClick={onSaveNow} className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border border-charcoal-800 hover:text-charcoal-200 transition-all duration-200">
          <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
          <span className={statusConfig.color}>{statusConfig.label}</span>
        </button>
        <button onClick={onNewProject} className="bg-sunset-500 hover:bg-sunset-600 text-charcoal-950 text-xs font-black tracking-wider px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-md transition-all duration-200">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>NEW PROJECT</span>
        </button>
      </div>
    </header>
  );
}