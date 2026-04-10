import { X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 start-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2" data-testid="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 bg-[#323232] text-white text-sm rounded-lg shadow-xl slide-up min-w-[300px]" data-testid="toast-message">
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button onClick={t.action.fn} className="font-medium text-[#8AB4F8] hover:text-white transition-fast" data-testid="toast-action">
              {t.action.label}
            </button>
          )}
          <button onClick={() => onDismiss(t.id)} className="text-white/60 hover:text-white transition-fast"><X className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  );
}
