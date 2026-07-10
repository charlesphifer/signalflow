import type { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  syncEnabled: boolean;
  syncStatus: string;
  onSyncClick: () => void;
  onNewProject: () => void;
}

const tabs: { id: ActiveTab; label: string; shortLabel: string }[] = [
  { id: 'projects', label: 'Deployment Dashboard', shortLabel: 'Dashboard' },
  { id: 'calendar', label: 'Interactive Calendar', shortLabel: 'Calendar' },
  { id: 'email-vault', label: 'Email Boilerplate Vault', shortLabel: 'Email Vault' },
  { id: 'docs-search', label: 'Technical Reference Vault', shortLabel: 'Tech Ref' },
];

export default function Header({ activeTab, onTabChange, syncEnabled, syncStatus, onSyncClick, onNewProject }: HeaderProps) {
  const syncIcon = () => {
    if (!syncEnabled) return 'M20 13.5a8.5 8.5 0 0 1-17 0';
    if (syncStatus === 'syncing') return 'M16.5 16.5 12 21l-4.5-4.5M12 3v18';
    if (syncStatus === 'synced') return 'M9 12.5 11 14.5 15 9.5';
    return 'M6 18 18 6M6 6l12 12';
  };

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
          <button onClick={onSyncClick} className="p-2 rounded-lg border border-charcoal-800 text-charcoal-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={syncIcon()} />
            </svg>
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
          </button>
        ))}
      </div>

      {/* Desktop sync + new project */}
      <div className="hidden lg:flex items-center space-x-2 shrink-0">
        <button onClick={onSyncClick} className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border border-charcoal-800 text-charcoal-400 hover:text-charcoal-200 transition-all duration-200">
          <span>{syncEnabled ? (syncStatus === 'synced' ? 'Cloud Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Sync Error') : 'Cloud Sync Setup'}</span>
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