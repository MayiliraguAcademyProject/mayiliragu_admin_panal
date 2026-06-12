import { Video } from 'lucide-react';
import type { CurrentAffair } from '../../../core/types';

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingArticle: CurrentAffair | null;
  onSubmit: (values: any) => void;
  form: any;
}

export default function ArticleModal({ isOpen, onClose, editingArticle, onSubmit, form }: ArticleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-cardBg border border-border rounded-3xl shadow-2xl overflow-hidden transform my-8">
        <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
          <div>
            <h3 className="text-lg font-black text-text-primary tracking-tight">
              {editingArticle ? 'Edit Current Affairs Article' : 'Publish Daily Current Affairs'}
            </h3>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Category</label>
                <select
                  {...form.register('category')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                >
                  <option>National Affairs</option>
                  <option>International Relations</option>
                  <option>Economy & Finance</option>
                  <option>Science & Technology</option>
                  <option>Environment & Climate</option>
                  <option>Sports News</option>
                  <option>Awards & Honors</option>
                  <option>Government Schemes</option>
                </select>
              </div>

              {/* Published Date */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Published Date</label>
                <input
                  type="date"
                  {...form.register('publishedDate')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
            </div>

            {/* English & Tamil side-by-side title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Title (English)</label>
                <input
                  type="text"
                  placeholder="Title in English"
                  {...form.register('titleEn')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Title (Tamil - Optional)</label>
                <input
                  type="text"
                  placeholder="Title in Tamil"
                  {...form.register('titleTa')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
            </div>

            {/* Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Summary (English)</label>
                <textarea
                  rows={3}
                  placeholder="Short summary for the feed list card"
                  {...form.register('summaryEn')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Summary (Tamil - Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Short summary in Tamil"
                  {...form.register('summaryTa')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Detailed Explanation (English)</label>
                <textarea
                  rows={6}
                  placeholder="Detailed content write-up"
                  {...form.register('contentEn')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Detailed Explanation (Tamil - Optional)</label>
                <textarea
                  rows={6}
                  placeholder="Detailed content write-up in Tamil"
                  {...form.register('contentTa')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
            </div>

            {/* Custom exam sections */}
            <h4 className="text-xs font-bold text-text-secondary pt-2 border-t border-border/40">Additional Exam-Oriented Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Exam Importance / Key Facts (EN)</label>
                <textarea
                  rows={3}
                  placeholder="Why is this relevant? Bullet facts."
                  {...form.register('examImportanceEn')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Exam Importance / Key Facts (TA)</label>
                <textarea
                  rows={3}
                  placeholder="Tamil translation for exam importance"
                  {...form.register('examImportanceTa')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Prelims / Mains Notes (EN)</label>
                <textarea
                  rows={3}
                  placeholder="Short pointers for Prelims/Mains"
                  {...form.register('prelimsNotesEn')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Prelims / Mains Notes (TA)</label>
                <textarea
                  rows={3}
                  placeholder="Tamil translation for exam notes"
                  {...form.register('prelimsNotesTa')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Video Explanation URL */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-accent" /> Video Explanation URL
                </label>
                <input
                  type="text"
                  placeholder="YouTube or Google Drive video url link"
                  {...form.register('videoUrl')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>

              {/* Publish Status Toggle */}
              <div className="flex items-center space-x-2.5 pt-4">
                <input
                  type="checkbox"
                  id="isPublishedArt"
                  {...form.register('isPublished')}
                  className="w-4 h-4 rounded text-accent focus:ring-accent border-border"
                />
                <label htmlFor="isPublishedArt" className="text-xs font-bold text-text-primary select-none cursor-pointer">
                  Publish Immediately (Draft if unchecked)
                </label>
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
                Save Article
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
