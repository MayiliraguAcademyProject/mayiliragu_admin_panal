import React from 'react';
import { Smartphone, AlertTriangle, X, Loader2 } from 'lucide-react';

interface ResetDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  studentName: string;
  deviceName?: string | null;
  isLoading?: boolean;
}

export const ResetDeviceModal: React.FC<ResetDeviceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  deviceName,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-cardBg rounded-3xl border border-border/80 shadow-2xl shadow-slate-900/20 overflow-hidden transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">
                Reset Bound Device
              </h3>
              <p className="text-xs text-text-secondary font-medium">
                Device Transfer Security Action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed font-medium">
              <p className="font-extrabold text-amber-950 mb-1">
                Are you sure you want to reset the bound device for <span className="underline decoration-amber-400 font-black">{studentName}</span>?
              </p>
              They will be able to log in on a new device. The current registered hardware binding will be permanently unlinked.
            </div>
          </div>

          {deviceName && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-border/60 flex items-center justify-between text-xs">
              <span className="text-text-secondary font-semibold">Currently Bound Device:</span>
              <span className="font-mono font-bold text-text-primary bg-slate-200/60 px-2 py-0.5 rounded-md">
                {deviceName}
              </span>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 bg-slate-50/50 border-t border-border/50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-text-secondary hover:text-text-primary hover:bg-slate-200/60 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black py-2.5 px-5 rounded-xl text-xs shadow-lg shadow-amber-600/25 hover:shadow-amber-600/35 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span>Confirm Reset</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetDeviceModal;
