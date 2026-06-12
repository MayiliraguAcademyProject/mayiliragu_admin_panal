
interface DateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  form: any;
}

export default function DateModal({ isOpen, onClose, onSubmit, form }: DateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-cardBg border border-border rounded-3xl shadow-2xl overflow-hidden transform">
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-black text-text-primary tracking-tight">Add Calendar Event / Day</h3>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Day Type</label>
              <select
                {...form.register('type')}
                className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent text-text-primary bg-slate-50/20"
              >
                <option value="National">National Day</option>
                <option value="International">International Day</option>
                <option value="Commemorative">Commemorative Event</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Event Title (EN)</label>
                <input
                  type="text"
                  placeholder="e.g. National Science Day"
                  {...form.register('titleEn')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent text-text-primary bg-slate-50/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Event Title (TA - Optional)</label>
                <input
                  type="text"
                  placeholder="Tamil translation"
                  {...form.register('titleTa')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent text-text-primary bg-slate-50/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Date</label>
              <input
                type="date"
                {...form.register('date')}
                className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent text-text-primary bg-slate-50/20"
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
                className="px-6 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-md"
              >
                Add Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
