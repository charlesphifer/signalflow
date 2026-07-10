import { useRef } from 'react';
import type { Project } from '../types';

interface DataBackupPanelProps {
  onImport: (projects: Project[]) => void;
  onToast: (msg: string) => void;
}

function isValidProject(obj: unknown): obj is Project {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;
  return typeof p.id === 'string' && typeof p.number === 'string' && typeof p.name === 'string';
}

function downloadJsonFile(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DataBackupPanel({ onImport, onToast }: DataBackupPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const raw = localStorage.getItem('signalflow_projects');
      if (!raw) {
        onToast('No project data to export.');
        return;
      }
      const data = JSON.parse(raw);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      downloadJsonFile(data, `signalflow-projects-${timestamp}.json`);
      onToast('Projects exported successfully!');
    } catch {
      onToast('Failed to export projects.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!Array.isArray(parsed)) {
          onToast('Invalid file: expected an array of projects.');
          return;
        }

        if (parsed.length === 0 || !parsed.every(isValidProject)) {
          onToast('Invalid file: each project must have id, number, and name fields.');
          return;
        }

        const projects = parsed as Project[];
        localStorage.setItem('signalflow_projects', JSON.stringify(projects));
        onImport(projects);
        onToast(`Imported ${projects.length} project(s) successfully!`);
      } catch {
        onToast('Failed to parse file. Make sure it is valid JSON.');
      }
    };

    reader.readAsText(file);
    // Reset input so the same file can be re-imported
    e.target.value = '';
  };

  return (
    <div className="bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-charcoal-800 rounded-xl p-3.5 shadow-md flex flex-col space-y-2.5">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg border bg-indigo-950/40 border-indigo-900 text-indigo-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Data Backup</h3>
            <p className="text-[10px] text-charcoal-400 font-medium">Import / Export projects</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {/* Export Button */}
        <button
          onClick={handleExport}
          className="flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 text-center flex items-center justify-center gap-1.5 bg-charcoal-950 hover:bg-charcoal-900 border-charcoal-800 text-charcoal-300 hover:text-white"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>

        {/* Import Button */}
        <button
          onClick={handleImportClick}
          className="flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 text-center flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white shadow-sm shadow-indigo-950/50"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}