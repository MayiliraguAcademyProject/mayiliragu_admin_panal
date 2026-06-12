import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { courseSchema, type CourseFormValues } from '../../../core/validation';
import type { Course } from '../../../core/types';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CourseFormValues) => Promise<void>;
  editingCourse: Course | null;
}

export default function CourseModal({
  isOpen,
  onClose,
  onSubmit,
  editingCourse,
}: CourseModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      thumbnail: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingCourse) {
        setValue('title', editingCourse.title);
        setValue('description', editingCourse.description);
        setValue('thumbnail', editingCourse.thumbnail);
      } else {
        reset();
      }
    }
  }, [isOpen, editingCourse, setValue, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300">
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
              {editingCourse ? 'Edit Course Details' : 'Create Course'}
            </h3>
            <p className="text-xs text-text-secondary mt-1 font-medium">
              Provide course details to construct a new curriculum structure.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                Course Title
              </label>
              <input
                type="text"
                placeholder="e.g. Flutter Web Development"
                {...register('title')}
                disabled={isSubmitting}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                  errors.title ? 'border-error focus:ring-error focus:border-error bg-red-50/10' : 'border-border focus:ring-accent focus:border-accent'
                } text-text-primary bg-slate-50/20`}
              />
              {errors.title && (
                <p className="text-[11px] text-error font-semibold pl-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Provide a summary detailing course learning objectives..."
                {...register('description')}
                disabled={isSubmitting}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all resize-none ${
                  errors.description ? 'border-error focus:ring-error focus:border-error bg-red-50/10' : 'border-border focus:ring-accent focus:border-accent'
                } text-text-primary bg-slate-50/20`}
              />
              {errors.description && (
                <p className="text-[11px] text-error font-semibold pl-1">{errors.description.message}</p>
              )}
            </div>

            {/* Thumbnail */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                Thumbnail Image URL
              </label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                {...register('thumbnail')}
                disabled={isSubmitting}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                  errors.thumbnail ? 'border-error focus:ring-error focus:border-error bg-red-50/10' : 'border-border focus:ring-accent focus:border-accent'
                } text-text-primary bg-slate-50/20`}
              />
              {errors.thumbnail && (
                <p className="text-[11px] text-error font-semibold pl-1">{errors.thumbnail.message}</p>
              )}
            </div>

            {/* Buttons controls */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border/40">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 bg-accent hover:bg-accent-onContainer text-white font-bold py-2.5 px-5 rounded-xl shadow-md disabled:opacity-75"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span>{editingCourse ? 'Save Changes' : 'Create'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
