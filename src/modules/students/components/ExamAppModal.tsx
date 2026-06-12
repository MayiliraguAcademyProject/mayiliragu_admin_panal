import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface ExamAppModalProps {
  onClose: () => void;
  onSubmit: (data: {
    examName: string;
    notificationDate?: string;
    applied: boolean;
    applicationNo?: string;
    hallTicketNo?: string;
    examDate?: string;
    resultStatus: string;
    finalSelection?: string;
  }) => Promise<void>;
}

export default function ExamAppModal({ onClose, onSubmit }: ExamAppModalProps) {
  const [examName, setExamName] = useState('UPSC');
  const [notificationDate, setNotificationDate] = useState('');
  const [applied, setApplied] = useState(false);
  const [applicationNo, setApplicationNo] = useState('');
  const [hallTicketNo, setHallTicketNo] = useState('');
  const [examDate, setExamDate] = useState('');
  const [resultStatus, setResultStatus] = useState('Awaiting');
  const [finalSelection, setFinalSelection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        examName,
        notificationDate: notificationDate || undefined,
        applied,
        applicationNo: applicationNo.trim() || undefined,
        hallTicketNo: hallTicketNo.trim() || undefined,
        examDate: examDate || undefined,
        resultStatus,
        finalSelection: finalSelection.trim() || undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-cardBg border border-border/80 rounded-3xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-text-primary">Track Exam Application</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Exam Name</label>
              <select
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="UPSC">UPSC</option>
                <option value="TNPSC Group 1">TNPSC Group 1</option>
                <option value="TNPSC Group 2">TNPSC Group 2</option>
                <option value="TNPSC Group 4">TNPSC Group 4</option>
                <option value="SSC CGL">SSC CGL</option>
                <option value="SSC CHSL">SSC CHSL</option>
                <option value="Banking">Banking</option>
                <option value="Railways">Railways</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Notification Date</label>
              <input
                type="date"
                value={notificationDate}
                onChange={(e) => setNotificationDate(e.target.value)}
                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 py-1">
            <input
              type="checkbox"
              id="appliedCheck"
              checked={applied}
              onChange={(e) => setApplied(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <label htmlFor="appliedCheck" className="text-xs font-bold text-text-primary uppercase cursor-pointer">
              Has student applied for this notification?
            </label>
          </div>

          {applied && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Application No</label>
                <input
                  type="text"
                  value={applicationNo}
                  onChange={(e) => setApplicationNo(e.target.value)}
                  placeholder="App No"
                  className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Hall Ticket No</label>
                <input
                  type="text"
                  value={hallTicketNo}
                  onChange={(e) => setHallTicketNo(e.target.value)}
                  placeholder="Ticket No"
                  className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Result Status</label>
              <select
                value={resultStatus}
                onChange={(e) => setResultStatus(e.target.value)}
                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none"
              >
                <option value="Awaiting">Awaiting</option>
                <option value="Cleared">Cleared</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Final Selection Status</label>
              <input
                type="text"
                value={finalSelection}
                onChange={(e) => setFinalSelection(e.target.value)}
                placeholder="e.g. Selected VAO"
                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold flex items-center space-x-1">
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
