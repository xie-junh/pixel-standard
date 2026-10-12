import React from 'react';
import { Check } from 'lucide-react';

interface CopyToastProps {
  message: string | null;
}

export const CopyToast: React.FC<CopyToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
        <Check className="w-3 h-3" />
      </div>
      <span>{message}</span>
    </div>
  );
};
