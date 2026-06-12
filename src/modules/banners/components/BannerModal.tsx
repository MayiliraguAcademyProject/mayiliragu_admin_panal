import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import type { Banner } from '../../../core/types';

// Form Validation Schema
export const bannerSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  imageUrl: z.string().min(1, 'Image URL is required').url('Must be a valid URL'),
  linkUrl: z.string().nullable().optional(),
  order: z.number().int().min(0, 'Order must be 0 or greater'),
  isActive: z.boolean(),
});

export type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: BannerFormValues) => Promise<void>;
  editingBanner: Banner | null;
  defaultOrder: number;
}

export default function BannerModal({
  isOpen,
  onClose,
  onSubmit,
  editingBanner,
  defaultOrder,
}: BannerModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: '',
      imageUrl: '',
      linkUrl: '',
      order: defaultOrder,
      isActive: true,
    }
  });

  const watchImageUrl = watch('imageUrl');

  useEffect(() => {
    if (isOpen) {
      if (editingBanner) {
        reset({
          title: editingBanner.title,
          imageUrl: editingBanner.imageUrl,
          linkUrl: editingBanner.linkUrl || '',
          order: editingBanner.order,
          isActive: editingBanner.isActive,
        });
      } else {
        reset({
          title: '',
          imageUrl: '',
          linkUrl: '',
          order: defaultOrder,
          isActive: true,
        });
      }
    }
  }, [isOpen, editingBanner, defaultOrder, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300">
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-black text-text-primary tracking-tight">
              {editingBanner ? 'Edit Promotion Banner' : 'Add Promotion Banner'}
            </h3>
            <p className="text-xs text-text-secondary mt-1 font-semibold">
              Specify banner title, image URL, order, and targeted course link.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                Banner Title
              </label>
              <input
                type="text"
                placeholder="e.g. UPSC Exam Crash Course 2026"
                {...register('title')}
                disabled={isSubmitting}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                  errors.title ? 'border-error focus:ring-error focus:border-error bg-red-50/10' : 'border-border focus:ring-accent focus:border-accent'
                } text-text-primary bg-slate-50/20`}
              />
              {errors.title && (
                <p className="text-[10px] text-error font-semibold pl-1">{errors.title.message}</p>
              )}
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                Banner Image URL
              </label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/... or hosted URL"
                {...register('imageUrl')}
                disabled={isSubmitting}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                  errors.imageUrl ? 'border-error focus:ring-error focus:border-error bg-red-50/10' : 'border-border focus:ring-accent focus:border-accent'
                } text-text-primary bg-slate-50/20`}
              />
              {errors.imageUrl && (
                <p className="text-[10px] text-error font-semibold pl-1">{errors.imageUrl.message}</p>
              )}
            </div>

            {/* LIVE PREVIEW CONTAINER */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                Live Banner Preview
              </label>
              <div className="aspect-[3/1] rounded-2xl bg-slate-100 border border-border/80 overflow-hidden flex items-center justify-center relative">
                {watchImageUrl && watchImageUrl.startsWith('http') ? (
                  <img 
                    src={watchImageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-6 h-6 text-gray-350 mx-auto mb-1" />
                    <span className="text-[10px] text-text-secondary font-semibold">Enter image URL to view preview</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Link URL (String Input) */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                  Target Course Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. course UUID or path"
                  {...register('linkUrl')}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20`}
                />
              </div>

              {/* Order */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                  Sequence Order
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  {...register('order', { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                    errors.order ? 'border-error focus:ring-error focus:border-error bg-red-50/10' : 'border-border focus:ring-accent focus:border-accent'
                  } text-text-primary bg-slate-50/20`}
                />
                {errors.order && (
                  <p className="text-[10px] text-error font-semibold pl-1">{errors.order.message}</p>
                )}
              </div>
            </div>

            {/* Is Active Checkbox Toggle */}
            <div className="flex items-center space-x-2.5 py-1.5">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                disabled={isSubmitting}
                className="w-4 h-4 rounded text-accent focus:ring-accent border-border"
              />
              <label htmlFor="isActive" className="text-xs font-bold text-text-primary select-none cursor-pointer">
                Enable banner instantly (Visible in mobile app)
              </label>
            </div>

            {/* Buttons controls */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border/40">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-md shadow-accent/15 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingBanner ? 'Save Changes' : 'Create Banner'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
