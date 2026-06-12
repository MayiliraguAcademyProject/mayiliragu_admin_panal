import { X } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  form: any;
}

export default function CategoryModal({ isOpen, onClose, onSubmit, form }: CategoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-cardBg border border-border rounded-3xl shadow-2xl overflow-hidden transform">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">Create Material Category</h3>
              <p className="text-xs text-text-secondary mt-0.5">Add a new type of study material to the library.</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-text-secondary transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Category Name</label>
              <input
                type="text"
                placeholder="e.g. Handwritten Notes, E-Books"
                {...form.register('name')}
                className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-white"
              />
              {form.formState.errors.name && (
                <p className="text-[10px] text-red-650 font-bold">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Description (Optional)</label>
              <textarea
                placeholder="Brief description of materials under this category..."
                {...form.register('description')}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-white resize-none"
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
                disabled={form.formState.isSubmitting}
                className="px-6 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-md disabled:opacity-55"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
