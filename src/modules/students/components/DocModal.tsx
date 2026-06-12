import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface DocModalProps {
  onClose: () => void;
  onSubmit: (data: { documentType: string; fileUrl: string }) => Promise<void>;
}

export default function DocModal({ onClose, onSubmit }: DocModalProps) {
  const [documentType, setDocumentType] = useState('Aadhaar Copy');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        documentType,
        fileUrl: fileUrl.trim()
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
          <h3 className="text-base font-extrabold text-text-primary">Add Document Reference</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="Student Photo">Student Photo</option>
              <option value="Aadhaar Copy">Aadhaar Copy</option>
              <option value="Degree Certificate">Degree Certificate</option>
              <option value="Community Certificate">Community Certificate</option>
              <option value="Transfer Certificate">Transfer Certificate</option>
              <option value="Passport Photo">Passport Photo</option>
              <option value="Signature Image">Signature Image</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Document URL / Reference</label>
            <input
              type="text"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="e.g. https://storage.google.com/..."
              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="pt-3 flex items-center justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold flex items-center space-x-1">
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Document</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
