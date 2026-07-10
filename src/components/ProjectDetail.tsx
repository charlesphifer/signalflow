import { useState, useRef, useEffect } from 'react';
import type { Project } from '../types';
import {
  getGoogleCalendarUrl,
  downloadIcsFile,
  STAGE_ORDER,
} from '../utils/helpers';

interface ProjectDetailProps {
  project: Project;
  googleDriveUrl: string;
  showDriveConfig: boolean;
  onToggleChecklist: (projectId: string, itemId: string) => void;
  onSaveNotes: (projectId: string, text: string) => void;
  onToggleArchive: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenEdit: (project: Project) => void;
  onOpenGoogleDrive: () => void;
  onCopyDriveStructure: () => void;
  onSetDriveUrl: (url: string) => void;
  onSetShowDriveConfig: (show: boolean) => void;
  onClearDriveUrl: () => void;
  onToast: (msg: string) => void;
}

// ─── Inline SVG icon components ──────────────────────────────────────────────

const SvgMapPin = ({ className }: { className?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const SvgShield = ({ className }: { className?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SvgCalendar = ({ className }: { className?: string }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SvgChevronRight = ({ className }: { className?: string }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const SvgEdit = ({ className }: { className?: string }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const SvgArchive = ({ className }: { className?: string }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="3" width="20" height="5" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" />
  </svg>
);

const SvgCheckSquare = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const SvgCheckCircle2 = ({ className }: { className?: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SvgCircle = ({ className }: { className?: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const SvgCalendarCheck2 = ({ className }: { className?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m16 19 2 2 4-4" />
  </svg>
);

const SvgUser = ({ className }: { className?: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const SvgMail = ({ className }: { className?: string }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);

const SvgPhone = ({ className }: { className?: string }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const SvgFolderOpen = ({ className }: { className?: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="1" y1="12" x2="23" y2="12" />
  </svg>
);

const SvgExternalLink = ({ className }: { className?: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const SvgClipboard = ({ className }: { className?: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const SvgBookOpen = ({ className }: { className?: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

// ─── Pipeline Stage definitions ─────────────────────────────────────────────

const STAGES = ['Kickoff', 'Pre-Work', 'On-Site', 'Reporting', 'Completed'] as const;

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProjectDetail({
  project,
  googleDriveUrl,
  showDriveConfig,
  onToggleChecklist,
  onSaveNotes,
  onToggleArchive,
  onDeleteProject,
  onOpenEdit,
  onOpenGoogleDrive,
  onCopyDriveStructure,
  onSetDriveUrl,
  onSetShowDriveConfig,
  onClearDriveUrl,
  onToast,
}: ProjectDetailProps) {
  const [notesText, setNotesText] = useState(project.notes);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync notesText when project changes (e.g. switching projects)
  useEffect(() => {
    setNotesText(project.notes);
  }, [project.id, project.notes]);

  const handleNotesChange = (text: string) => {
    setNotesText(text);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => {
      onSaveNotes(project.id, text);
    }, 600);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    };
  }, []);

  const completedCount = project.checklist.filter(c => c.completed).length;
  const totalCount = project.checklist.length;
  const currentStageIndex = STAGE_ORDER.indexOf(project.stage);

  return (
    <div className="flex-1 bg-charcoal-900 border border-charcoal-800 rounded-xl shadow-md flex flex-col overflow-hidden">
      {/* ───── Project Header ───── */}
      <div className="p-4 border-b border-charcoal-800 bg-gradient-to-br from-charcoal-900 to-charcoal-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[11px] font-black text-indigo-400 tracking-wider">
              {project.number}
            </span>
            <span className="text-charcoal-600">•</span>
            <span className="text-xs font-bold text-charcoal-400 flex items-center space-x-1">
              <SvgMapPin className="text-sunset-500" />
              <span>{project.city}, {project.state}</span>
            </span>
            <span className="text-charcoal-600">•</span>
            <span className="text-[10px] font-bold tracking-wide text-charcoal-300 px-2 py-0.5 bg-charcoal-800 rounded">
              🏥 Credentials: {project.credentials}
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {project.name}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-charcoal-900/80 border border-charcoal-800 p-2 rounded-xl">
          <div className="text-right shrink-0">
            <div className="text-[9px] uppercase font-extrabold tracking-widest text-charcoal-500">
              Go-Live Date
            </div>
            <div className="text-sm font-black text-sunset-500">
              {project.goLiveDate}
            </div>
          </div>
          <div className="h-8 w-px bg-charcoal-800 hidden sm:block shrink-0" />
          <div className="shrink-0">
            <span className={`text-xs font-black px-3 py-1.5 rounded-lg flex items-center space-x-1.5 ${
              project.type === 'Wireless Assessment'
                ? 'bg-orange-950/50 border border-orange-500/30 text-orange-400'
                : 'bg-indigo-950/50 border border-indigo-500/30 text-indigo-400'
            }`}>
              <SvgShield />
              <span>{project.type === 'Wireless Assessment' ? 'Wireless Assessment' : 'Wireless Design'}</span>
            </span>
          </div>

          {/* Calendar Automation Buttons */}
          <div className="h-8 w-px bg-charcoal-800 hidden md:block shrink-0" />
          <div className="flex items-center space-x-1.5 ml-auto">
            <span className="text-[9px] uppercase font-black text-charcoal-500 mr-1 hidden lg:inline">
              Add Go-Live:
            </span>
            <a
              href={getGoogleCalendarUrl(project)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-charcoal-950 hover:bg-charcoal-850 text-[10px] font-bold text-sunset-500 hover:text-sunset-400 border border-charcoal-800 hover:border-sunset-500/30 transition-all cursor-pointer shadow-sm"
              title="Add to Google Calendar"
            >
              <SvgCalendar />
              <span>Google Cal</span>
            </a>
            <button
              onClick={() => downloadIcsFile(project, onToast)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-charcoal-950 hover:bg-charcoal-850 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 border border-charcoal-800 hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm"
              title="Download iCal/Outlook File"
            >
              <SvgCalendar />
              <span>Outlook/iCal</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───── Pipeline Stage Visualizer + Edit & Archive ───── */}
      <div className="px-4 py-2 bg-charcoal-950/80 border-b border-charcoal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          <span className="text-[9px] uppercase font-extrabold tracking-widest text-charcoal-500 shrink-0">
            Pipeline Stage:
          </span>
          {STAGES.map((stg, i) => {
            const isPast = i < currentStageIndex;
            const isActive = stg === project.stage;
            return (
              <div key={stg} className="flex items-center space-x-1 shrink-0">
                {i > 0 && <SvgChevronRight className="text-charcoal-700" />}
                <span className={`text-[10px] font-black px-2 py-0.5 rounded transition-colors ${
                  isActive
                    ? 'bg-sunset-500 text-charcoal-950 shadow-sm'
                    : isPast
                      ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-900/30'
                      : 'bg-transparent text-charcoal-500 border border-transparent'
                }`}>
                  {stg}
                </span>
              </div>
            );
          })}
        </div>

        {/* Edit & Archive Actions */}
        <div className="flex shrink-0 items-center space-x-2">
          <button
            onClick={() => onOpenEdit(project)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-sunset-500 hover:text-sunset-400 border border-charcoal-700/60 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all shadow-md"
          >
            <SvgEdit className="mr-0.5" />
            <span>Edit Project</span>
          </button>
          {project.isArchived ? (
            <button
              onClick={() => onToggleArchive(project.id)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all shadow-md"
            >
              <SvgArchive className="mr-0.5" />
              <span>Restore to Active</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleArchive(project.id)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all shadow-md ${
                project.stage === 'Completed'
                  ? 'bg-sunset-500 hover:bg-sunset-400 text-charcoal-950 font-black shadow-[0_0_10px_rgba(255,107,53,0.25)] animate-pulse'
                  : 'bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 border border-charcoal-700/60'
              }`}
            >
              <SvgArchive className="mr-0.5" />
              <span>Archive Project</span>
            </button>
          )}
          {!project.isArchived && (
            <button
              onClick={() => onDeleteProject(project.id)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-300 border border-rose-900/40 text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-md"
              title="Delete project permanently"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* ───── Interactive Workspace Grid ───── */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COLUMN 1: CHECKLIST & TRAVEL TIMELINE (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Travel & Site dates info block */}
          <div className="bg-charcoal-950/40 border border-charcoal-800/80 rounded-xl p-3.5 grid grid-cols-2 gap-3">
            <div className="bg-charcoal-900/40 p-2.5 rounded-lg border border-charcoal-800/30">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-sunset-500 mb-1">
                <SvgCalendar />
                <span>Blocked Travel Windows</span>
              </div>
              <div className="text-xs font-medium text-charcoal-200 pl-4.5">
                {project.travelStart} <span className="text-charcoal-500">➔</span> {project.travelEnd}
              </div>
            </div>
            <div className="bg-charcoal-900/40 p-2.5 rounded-lg border border-charcoal-800/30">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-400 mb-1">
                <SvgCalendarCheck2 />
                <span>Hospital On-Site Survey</span>
              </div>
              <div className="text-xs font-medium text-charcoal-200 pl-4.5">
                {project.siteStart} <span className="text-charcoal-500">➔</span> {project.siteEnd}
              </div>
            </div>
          </div>

          {/* Execution Checklist */}
          <div className="bg-charcoal-950/40 border border-charcoal-800 rounded-xl flex-1 flex flex-col overflow-hidden min-h-[380px]">
            <div className="p-3 bg-charcoal-900 border-b border-charcoal-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <SvgCheckSquare className="text-sunset-500" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Execution Checklist ({completedCount} / {totalCount})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-charcoal-400 px-2 py-0.5 bg-charcoal-800 rounded-full">
                {project.type} Auto-Template
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-charcoal-950/60 max-h-[420px]">
              {project.checklist.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => onToggleChecklist(project.id, item.id)}
                  className={`flex items-start space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    item.completed
                      ? 'bg-indigo-950/10 hover:bg-indigo-950/20 text-charcoal-500'
                      : 'bg-charcoal-900/30 hover:bg-charcoal-800/40 text-charcoal-200'
                  }`}
                >
                  <button className="mt-0.5 shrink-0 transition-colors">
                    {item.completed ? (
                      <SvgCheckCircle2 className="text-sunset-500 fill-sunset-500/10" />
                    ) : (
                      <SvgCircle className="text-charcoal-600 hover:text-sunset-500" />
                    )}
                  </button>
                  <div className="flex-1 text-xs">
                    <span className={`font-medium ${item.completed ? 'line-through text-charcoal-500' : ''}`}>
                      {item.task}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-charcoal-600 shrink-0 select-none">
                    Step {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: CONTACTS, FILE LOCKER & QUICK NOTES (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Stakeholders Directory */}
          <div className="bg-charcoal-950/40 border border-charcoal-800 rounded-xl p-3.5 space-y-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <SvgUser className="text-indigo-400" />
              <span>Stakeholders Directory</span>
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Project Manager */}
              <div className="bg-charcoal-900/60 p-2.5 rounded-lg border border-charcoal-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-sunset-500">
                    Project Manager (PM)
                  </span>
                  <span className="text-xs font-bold text-white">{project.pm.name}</span>
                </div>
              </div>

              {/* Account Executive */}
              <div className="bg-charcoal-900/60 p-2.5 rounded-lg border border-charcoal-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-400">
                    Account Executive (AE)
                  </span>
                  <span className="text-xs font-bold text-white">{project.ae.name}</span>
                </div>
              </div>

              {/* Hospital IT / BioMed */}
              <div className="bg-charcoal-900/60 p-2.5 rounded-lg border border-charcoal-800/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-500">
                    Hospital IT / BioMed
                  </span>
                  <span className="text-xs font-bold text-white">{project.itContact.name}</span>
                </div>
                <div className="flex justify-between text-[11px] text-charcoal-400">
                  <span className="hover:text-white cursor-pointer flex items-center space-x-1">
                    <SvgMail className="mr-1" />
                    {project.itContact.email}
                  </span>
                  <span className="hover:text-white cursor-pointer flex items-center space-x-1">
                    <SvgPhone className="mr-1" />
                    {project.itContact.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Google Drive File Locker */}
          <div className="bg-charcoal-950/40 border border-charcoal-800 rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                <SvgFolderOpen className="text-sunset-500" />
                <span>Google Drive File Locker</span>
              </h3>
              <div className="flex items-center space-x-2">
                {googleDriveUrl ? (
                  <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                    Configured
                  </span>
                ) : (
                  <span className="text-[9px] uppercase font-bold text-amber-400 bg-amber-950/50 border border-amber-800/40 px-1.5 py-0.5 rounded">
                    Not configured
                  </span>
                )}
                <button
                  onClick={() => onSetShowDriveConfig(!showDriveConfig)}
                  className="text-charcoal-500 hover:text-white transition-colors"
                  title="Configure Google Drive"
                >
                  <SvgEdit />
                </button>
              </div>
            </div>

            {/* Inline config for Google Drive URL */}
            {showDriveConfig && (
              <div className="bg-charcoal-950 border border-charcoal-800 rounded-lg p-3 space-y-2.5">
                <label className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                  Google Drive Folder URL
                </label>
                <input
                  type="url"
                  value={googleDriveUrl}
                  onChange={e => onSetDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/ABC123"
                  className="w-full bg-charcoal-900 border border-charcoal-800 rounded-lg px-2.5 py-2 text-xs text-white placeholder-charcoal-600 font-mono outline-none focus:border-sunset-500 transition-colors"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-charcoal-500">
                    Paste a shared Google Drive folder link above.
                  </span>
                  <div className="flex space-x-2">
                    {googleDriveUrl && (
                      <button
                        onClick={() => onClearDriveUrl()}
                        className="text-[10px] font-bold text-charcoal-500 hover:text-red-400 transition-colors uppercase px-2 py-1"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => onSetShowDriveConfig(false)}
                      className="text-[10px] font-bold text-sunset-500 hover:text-sunset-400 transition-colors uppercase px-2 py-1 bg-sunset-500/10 rounded"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[11px] text-charcoal-400">
              {googleDriveUrl ? (
                <>Folder hierarchy in your Google Drive under <span className="text-white font-semibold">SignalFlow Docs</span>:</>
              ) : (
                <>Configure a Google Drive folder above to link it. Folder template:</>
              )}
            </p>

            <div className="bg-charcoal-950 border border-charcoal-800/80 p-2.5 rounded-lg font-mono text-[10px] space-y-1 text-charcoal-300">
              <div className="text-white font-bold flex items-center">
                <SvgFolderOpen className="mr-1.5 text-sunset-500" />
                <span>📁 [{project.number}] {project.name}/</span>
              </div>
              <div className="pl-5 text-indigo-400 flex items-center">
                <span className="text-charcoal-700 mr-1">├──</span>
                <span>📂 01_Floor_Plans/</span>
                <span className="text-[9px] text-charcoal-500 ml-2">(AutoCAD DWGs, PDFs)</span>
              </div>
              <div className="pl-5 text-indigo-400 flex items-center">
                <span className="text-charcoal-700 mr-1">├──</span>
                <span>📂 02_Ekahau_Files/</span>
                <span className="text-[9px] text-charcoal-500 ml-2">(.esx projects, surveys)</span>
              </div>
              <div className="pl-5 text-indigo-400 flex items-center">
                <span className="text-charcoal-700 mr-1">├──</span>
                <span>📂 03_Site_Photos/</span>
                <span className="text-[9px] text-charcoal-500 ml-2">(AP placement proofs)</span>
              </div>
              <div className="pl-5 text-indigo-400 flex items-center">
                <span className="text-charcoal-700 mr-1">└──</span>
                <span>📂 04_Final_Reports/</span>
                <span className="text-[9px] text-charcoal-500 ml-2">(Completed PDF exports)</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={onOpenGoogleDrive}
                className={`flex-1 border text-xs font-black tracking-wide p-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-sm ${
                  googleDriveUrl
                    ? 'bg-charcoal-900 border-charcoal-800 hover:border-sunset-500 text-charcoal-200 hover:text-white'
                    : 'bg-charcoal-900/50 border-charcoal-800/60 text-charcoal-500 cursor-not-allowed'
                }`}
              >
                <SvgExternalLink />
                <span>OPEN GOOGLE DRIVE DIRECTORY</span>
              </button>
              <button
                onClick={onCopyDriveStructure}
                className="bg-charcoal-900 border border-charcoal-800 hover:border-sunset-500 text-charcoal-200 hover:text-white text-xs font-black tracking-wide p-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
              >
                <SvgClipboard />
                <span className="hidden sm:inline">COPY STRUCTURE</span>
              </button>
            </div>
          </div>

          {/* Interactive Site Notes */}
          <div className="bg-charcoal-950/40 border border-charcoal-800 rounded-xl p-3.5 flex-1 flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                <SvgBookOpen className="text-sunset-500" />
                <span>Interactive Site Notes</span>
              </h3>
              <span className="text-[9px] font-bold text-charcoal-500 italic">
                Cloud auto-saves active
              </span>
            </div>

            <textarea
              value={notesText}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Write any vital hardware configs, hotel notes, or contact summaries here..."
              className="w-full flex-1 bg-charcoal-950 border border-charcoal-800 rounded-lg p-2.5 text-xs text-white placeholder-charcoal-600 focus:outline-none focus:border-sunset-500 focus:ring-1 focus:ring-sunset-500 transition-colors resize-none min-h-[120px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}