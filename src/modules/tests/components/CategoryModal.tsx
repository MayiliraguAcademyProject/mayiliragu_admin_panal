import { X } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  newCatName: string;
  setNewCatName: (name: string) => void;
  newCatDescription: string;
  setNewCatDescription: (desc: string) => void;
  newCatIcon: string;
  setNewCatIcon: (icon: string) => void;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  newCatName,
  setNewCatName,
  newCatDescription,
  setNewCatDescription,
  newCatIcon,
  setNewCatIcon,
}: CategoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <form 
        onSubmit={onSubmit}
        className="w-full max-w-md bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-border/45 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight">Add Exam Category</h3>
            <p className="text-xs text-text-secondary font-medium mt-0.5">Configure a new category folder for syllabus taxonomy.</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Category Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">Category Name</label>
            <input
              type="text"
              placeholder="e.g. UPSC Exams"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-primary bg-slate-50/20"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">Description</label>
            <textarea
              placeholder="Describe the category, exam focus areas, etc."
              value={newCatDescription}
              onChange={(e) => setNewCatDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-semibold text-text-primary bg-slate-50/20"
            />
          </div>

          {/* Choose Icon */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">Select Icon Graphic</label>
            <select
              value={newCatIcon}
              onChange={(e) => setNewCatIcon(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-secondary bg-slate-50/20"
            >
              <option value="GraduationCap">Graduation Cap</option>
              <option value="Landmark">Landmark (Banking)</option>
              <option value="FileText">File Text (Standard)</option>
              <option value="Award">Award (Certifications)</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-border/40 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-border hover:bg-slate-50 text-xs font-bold rounded-xl text-text-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 bg-accent hover:bg-accent-onContainer text-xs font-bold rounded-xl text-white shadow-md shadow-accent/15 transition-all"
          >
            Add Category
          </button>
        </div>
      </form>
    </div>
  );
}
