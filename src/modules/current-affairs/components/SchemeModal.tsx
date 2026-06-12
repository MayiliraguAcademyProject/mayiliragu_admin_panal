import type { GovernmentScheme } from '../../../core/types';

interface SchemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingScheme: GovernmentScheme | null;
  onSubmit: (values: any) => void;
  form: any;
}

export default function SchemeModal({ isOpen, onClose, editingScheme, onSubmit, form }: SchemeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-cardBg border border-border rounded-3xl shadow-2xl overflow-hidden transform">
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-black text-text-primary tracking-tight">
              {editingScheme ? 'Edit Scheme' : 'Add Government Scheme'}
            </h3>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Scheme Type</label>
              <select
                {...form.register('type')}
                className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent text-text-primary bg-slate-50/20"
              >
                <option value="Central">Central Govt Scheme</option>
                <option value="State">State Govt Scheme</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Scheme Title (EN)</label>
                <input
                  type="text"
                  placeholder="Title in English"
                  {...form.register('titleEn')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent text-text-primary bg-slate-50/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Scheme Title (TA - Optional)</label>
                <input
                  type="text"
                  placeholder="Title in Tamil"
                  {...form.register('titleTa')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent text-text-primary bg-slate-50/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Description (EN)</label>
                <textarea
                  rows={4}
                  placeholder="Details of the scheme..."
                  {...form.register('descriptionEn')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent text-text-primary bg-slate-50/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Description (TA - Optional)</label>
                <textarea
                  rows={4}
                  placeholder="Scheme details in Tamil..."
                  {...form.register('descriptionTa')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent text-text-primary bg-slate-50/20"
                />
              </div>
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
                className="px-6 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-md"
              >
                Save Scheme
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
