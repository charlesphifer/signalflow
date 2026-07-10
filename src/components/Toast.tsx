interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-indigo-950 border-2 border-sunset-500 p-3.5 rounded-xl shadow-xl shadow-sunset-500/10 flex items-center space-x-3 text-white max-w-sm animate-in slide-in-from-bottom-2 duration-300">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sunset-500 shrink-0">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <div className="text-xs font-bold leading-normal">{message}</div>
    </div>
  );
}