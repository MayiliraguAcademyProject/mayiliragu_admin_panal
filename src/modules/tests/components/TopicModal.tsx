import { X } from 'lucide-react';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  newTopName: string;
  setNewTopName: (name: string) => void;
}

export default function TopicModal({
  isOpen,
  onClose,
  onSubmit,
  newTopName,
  setNewTopName,
}: TopicModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <form 
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-5 border-b border-border/45 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-text-primary tracking-tight">Add Exam Topic</h3>
            <p className="text-[11px] text-text-secondary mt-0.5">Define a study topic within the subject.</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-text-primary uppercase tracking-wider">Topic Name</label>
            <input
              type="text"
              placeholder="e.g. Governor-Generals of India"
              value={newTopName}
              onChange={(e) => setNewTopName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-primary bg-slate-50/20"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-border/40 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 bg-white border border-border hover:bg-slate-50 text-[11px] font-bold rounded-xl text-text-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3.5 py-2 bg-accent hover:bg-accent-onContainer text-[11px] font-bold rounded-xl text-white shadow-md shadow-accent/15 transition-all"
          >
            Add Topic
          </button>
        </div>
      </form>
    </div>
  );
}
