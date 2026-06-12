import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CounselingModalProps {
  onClose: () => void;
  onSubmit: (data: { mentorName: string; notes: string; remarks?: string; followUpDate?: string }) => Promise<void>;
}

export default function CounselingModal({ onClose, onSubmit }: CounselingModalProps) {
  const [mentorName, setMentorName] = useState('');
  const [notes, setNotes] = useState('');
  const [remarks, setRemarks] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorName.trim() || !notes.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        mentorName: mentorName.trim(),
        notes: notes.trim(),
        remarks: remarks.trim() || undefined,
        followUpDate: followUpDate || undefined
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
      <div className="w-full max-w-md bg-cardBg border border-border/80 rounded-3xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-text-primary">Log Counseling Session</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Mentor Name</label>
              <input
                type="text"
                required
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                placeholder="Staff name"
                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Session Notes</label>
            <textarea
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record details of career / academic counseling..."
              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent h-24 resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Actionable Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Focus on Polity daily test"
              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
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
