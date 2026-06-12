import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CommModalProps {
  onClose: () => void;
  onSubmit: (data: { type: string; content: string; sentBy: string }) => Promise<void>;
}

export default function CommModal({ onClose, onSubmit }: CommModalProps) {
  const [type, setType] = useState('SMS');
  const [content, setContent] = useState('');
  const [sentBy, setSentBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !sentBy.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        content: content.trim(),
        sentBy: sentBy.trim()
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
          <h3 className="text-base font-extrabold text-text-primary">Log Communication Interaction</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="SMS">SMS</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="Parent Call">Parent Call</option>
                <option value="Follow-up Notes">Follow-up Notes</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Logged By (Staff)</label>
              <input
                type="text"
                required
                value={sentBy}
                onChange={(e) => setSentBy(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Content / Notes</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Sent notification for upcoming Group 4 test. / Called mother to update on attendance status."
              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent h-24 resize-none"
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
