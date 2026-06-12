import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger',
}: ConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirm action failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorMap = {
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white shadow-red-100',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: 'text-accent',
      button: 'bg-accent hover:bg-accent-onContainer text-white shadow-accent/10',
    },
  };

  const activeColors = colorMap[type] || colorMap.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Header/Close */}
        <div className="p-4 flex justify-end">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center space-y-4">
          <div className={`w-12 h-12 ${activeColors.bg} border ${activeColors.border} rounded-2xl flex items-center justify-center mx-auto`}>
            <AlertTriangle className={`w-6 h-6 ${activeColors.icon}`} />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-black text-text-primary tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed font-semibold">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-text-primary font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center space-x-1.5 font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 ${activeColors.button}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
