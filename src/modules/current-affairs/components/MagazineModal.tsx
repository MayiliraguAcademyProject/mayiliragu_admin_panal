import { Loader2 } from 'lucide-react';

interface MagazineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  form: any;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  isPending: boolean;
}

export default function MagazineModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  selectedFile,
  onFileChange,
  isPending
}: MagazineModalProps) {
  if (!isOpen) return null;

  const getMonthName = (m: number) => {
    const dates = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return dates[m - 1] || `${m}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-cardBg border border-border rounded-3xl shadow-2xl overflow-hidden transform">
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-black text-text-primary tracking-tight">Upload Compilation PDF</h3>
            <p className="text-xs text-text-secondary mt-0.5">Provide a title, choose the target month and year, and select the PDF file.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Magazine Title</label>
              <input
                type="text"
                placeholder="e.g. Mayiliragu Current Affairs June 2026"
                {...form.register('title')}
                className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Month</label>
                <select
                  {...form.register('month', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>{getMonthName(m)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Year</label>
                <select
                  {...form.register('year', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                className="block w-full text-xs text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-text-primary hover:file:bg-slate-200"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || isPending}
                className="flex items-center space-x-1 px-6 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-md disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Upload PDF</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
