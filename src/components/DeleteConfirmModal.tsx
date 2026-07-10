import type { Project } from '../types';

interface DeleteConfirmModalProps {
  project: Project;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ project, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal-900 border border-rose-900/60 rounded-2xl max-w-md w-full shadow-2xl shadow-rose-950/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-charcoal-950 border-b border-charcoal-800">
          <div className="flex items-center space-x-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500 shrink-0">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Delete Project</h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-bold text-charcoal-300 leading-relaxed">
            Are you sure you want to permanently delete this project?
          </p>

          <div className="bg-charcoal-950/60 border border-charcoal-800 rounded-xl p-3 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider">Project</span>
              <span className="text-xs font-black text-white">{project.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider">Number</span>
              <span className="text-xs font-mono font-bold text-indigo-400">{project.number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider">Type</span>
              <span className="text-xs font-bold text-charcoal-300">{project.type}</span>
            </div>
          </div>

          <p className="text-[10px] text-rose-400 font-medium leading-relaxed">
            This action cannot be undone. All checklist progress, notes, and configuration data for this deployment will be permanently removed.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-charcoal-950 border-t border-charcoal-800 flex justify-between items-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-charcoal-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-950/30 transition-all hover:scale-[1.02]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
}