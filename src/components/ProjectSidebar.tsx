import type { Project, SortField, SortOrder, ViewMode } from '../types';
import DataBackupPanel from './DataBackupPanel';

interface ProjectSidebarProps {
  projects: Project[];
  sortedProjects: Project[];
  selectedProjectId: string;
  searchTerm: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  syncEnabled: boolean;
  syncStatus: string;
  onSelectProject: (id: string) => void;
  onSearchChange: (term: string) => void;
  onSortByChange: (field: SortField) => void;
  onSortOrderToggle: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSyncClick: () => void;
  onImport: (projects: Project[]) => void;
  onToast: (msg: string) => void;
}

export default function ProjectSidebar({
  sortedProjects,
  selectedProjectId,
  searchTerm,
  sortBy,
  sortOrder,
  viewMode,
  syncEnabled,
  // syncStatus,
  onSelectProject,
  onSearchChange,
  onSortByChange,
  onSortOrderToggle,
  onViewModeChange,
  onSyncClick,
  onImport,
  onToast,
}: ProjectSidebarProps) {
  return (
    <div className="w-full md:w-[320px] flex flex-col gap-3 shrink-0">
      {/* Active / Archive Toggle */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-1 shadow-md flex">
        <button
          onClick={() => onViewModeChange('active')}
          className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'active'
              ? 'bg-sunset-500 text-charcoal-950 font-black shadow-sm'
              : 'text-charcoal-400 hover:text-charcoal-200'
          }`}
        >
          Active Deployments
        </button>
        <button
          onClick={() => onViewModeChange('archived')}
          className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
            viewMode === 'archived'
              ? 'bg-indigo-600 text-white font-black shadow-sm'
              : 'text-charcoal-400 hover:text-charcoal-200'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="5" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" />
          </svg>
          <span>Archived Space</span>
        </button>
      </div>

      {/* Search & Sort */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-3 shadow-md space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-charcoal-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search hospitals, cities..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-sunset-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-charcoal-800/60">
          <span className="text-charcoal-400 font-medium">Sort by:</span>
          <div className="flex items-center space-x-1.5">
            <select
              value={sortBy}
              onChange={e => onSortByChange(e.target.value as SortField)}
              className="bg-charcoal-950 border border-charcoal-800 rounded-md px-2 py-1 text-white focus:outline-none focus:border-sunset-500 text-[11px] font-medium transition-colors"
            >
              <option value="name">Hospital Name</option>
              <option value="number">Project ID</option>
              <option value="goLive">Go-Live Date</option>
              <option value="stage">Project Stage</option>
            </select>
            <button
              onClick={onSortOrderToggle}
              className="bg-charcoal-950 hover:bg-charcoal-800 border border-charcoal-800 rounded-md p-1.5 text-charcoal-300 hover:text-white transition-colors"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <svg
                width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={sortOrder === 'desc' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'}
              >
                <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Project List */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl flex-1 flex flex-col shadow-md overflow-hidden min-h-[400px]">
        <div className="p-3.5 border-b border-charcoal-800 bg-charcoal-900/50 flex justify-between items-center">
          <h2 className="text-xs font-black text-white uppercase tracking-wider">
            {viewMode === 'active' ? 'My Deployments' : 'Archived Space'} ({sortedProjects.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-charcoal-800/60 p-2 space-y-1">
          {sortedProjects.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-charcoal-500 leading-relaxed">
              {viewMode === 'active'
                ? 'No active deployments found.'
                : 'No archived projects. Complete your checklist and click Archive to move deployments here.'}
            </div>
          ) : (
            sortedProjects.map(p => {
              const completedCount = p.checklist.filter(c => c.completed).length;
              const totalCount = p.checklist.length;
              const pct = Math.round((completedCount / totalCount) * 100);
              const isSelected = p.id === selectedProjectId;

              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 border flex flex-col ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-charcoal-800/40'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-charcoal-400">{p.number}</span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      p.type === 'Wireless Assessment'
                        ? 'bg-orange-950/40 text-orange-400 border border-orange-800/30'
                        : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50'
                    }`}>
                      {p.type === 'Wireless Assessment' ? 'Assessment' : 'Design'}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">{p.name}</h3>
                  <div className="flex items-center space-x-1 text-[10px] text-charcoal-400 mb-2">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sunset-500">
                      <path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{p.city}, {p.state}</span>
                  </div>
                  <div className="w-full mt-auto">
                    <div className="flex justify-between items-center text-[9px] font-bold mb-1">
                      <span className="text-charcoal-400 uppercase tracking-wider flex items-center">
                        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                          p.stage === 'Completed' ? 'bg-emerald-500' :
                          p.stage === 'Reporting' ? 'bg-indigo-500' :
                          p.stage === 'On-Site' ? 'bg-sunset-500' : 'bg-charcoal-400'
                        }`} />
                        {p.stage}
                      </span>
                      <span className="text-white">{pct}%</span>
                    </div>
                    <div className="h-1 bg-charcoal-950 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-sunset-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Cloud Sync Card */}
      <div className="bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-charcoal-800 rounded-xl p-3.5 shadow-md flex flex-col space-y-2.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg border ${
              syncEnabled ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' : 'bg-indigo-950/40 border-indigo-900 text-indigo-400'
            }`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Cloud Sync Engine</h3>
              <p className="text-[10px] text-charcoal-400 font-medium">
                {syncEnabled ? 'Active Multi-Device Sync' : 'No sync configured yet'}
              </p>
            </div>
          </div>
          {syncEnabled && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-charcoal-300">
          {syncEnabled
            ? 'Synchronizing workspaces with cloud. Real-time collaboration is enabled.'
            : 'Collaborate with colleagues on-site! Share assessment & design checklists across devices in real-time.'}
        </p>

        <button
          onClick={onSyncClick}
          className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 text-center ${
            syncEnabled
              ? 'bg-charcoal-950 hover:bg-charcoal-900 border-charcoal-800 text-charcoal-300 hover:text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white shadow-sm shadow-indigo-950/50'
          }`}
        >
          {syncEnabled ? 'Configure Sync Settings' : 'Set Up Real-Time Sync'}
        </button>
      </div>

      {/* Data Backup */}
      <DataBackupPanel onImport={onImport} onToast={onToast} />
    </div>
  );
}