import React from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useShanpoorna();

  if (toasts.length === 0) return null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[92%] pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-stone-900/95 text-white shadow-xl backdrop-blur-md border border-stone-700/60 transition-all transform animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2.5 text-xs font-medium">
            {toast.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="leading-snug">{toast.message}</span>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-stone-400 hover:text-white p-0.5 rounded-md hover:bg-stone-800 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
