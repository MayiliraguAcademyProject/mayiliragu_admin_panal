import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastState = {
  show: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
};

interface ToastProps {
  toast: ToastState;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ toast, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (toast.show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.show, toast.message, duration, onClose]);

  if (!toast.show) return null;

  const bgStyles = {
    success: 'bg-emerald-900/90 border-emerald-500/50 text-white',
    error: 'bg-red-900/90 border-red-500/50 text-white',
    info: 'bg-slate-900/90 border-slate-500/50 text-white',
  }[toast.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[toast.type];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 transition-all duration-300 animate-bounce-in">
      <div className={`flex items-center space-x-3 ${bgStyles} px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-md max-w-md`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-xs font-bold leading-relaxed">{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors text-white/80"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
