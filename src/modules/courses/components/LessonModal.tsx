import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { lessonSchema, type LessonFormValues } from '../../../core/validation';
import type { Lesson } from '../../../core/types';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: LessonFormValues) => Promise<void>;
  editingLesson: Lesson | null;
}

export default function LessonModal({
  isOpen,
  onClose,
  onSubmit,
  editingLesson,
}: LessonModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      description: '',
      driveFileId: 'hls_video',
      durationMinutes: 5,
      downloadEnabled: false,
      hlsUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingLesson) {
        setValue('title', editingLesson.title);
        setValue('description', editingLesson.description);
        setValue('driveFileId', editingLesson.driveFileId || 'hls_video');
        setValue('durationMinutes', Math.round(editingLesson.duration / 60));
        setValue('downloadEnabled', editingLesson.downloadEnabled ?? false);
        setValue('hlsUrl', editingLesson.hlsUrl ?? '');
      } else {
        reset();
      }
    }
  }, [isOpen, editingLesson, setValue, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <form 
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-3xl bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
              {editingLesson ? 'Edit Lesson Details' : 'Create New Lesson'}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Fill in lesson title, description, duration, and HLS playlist link.
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
              Lesson Title
            </label>
            <input
              type="text"
              placeholder="e.g. Introduction to HLS Streaming"
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
              Description / Summary
            </label>
            <textarea
              rows={5}
              placeholder="Outline what students will learn in this session..."
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

          {/* Hidden Drive ID field (required by schema/database) */}
          <input type="hidden" {...register('driveFileId')} />

          <div className="grid grid-cols-1 gap-4">
            {/* Duration */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                Duration (Minutes)
              </label>
              <input
                type="number"
                placeholder="e.g. 15"
                {...register('durationMinutes', { valueAsNumber: true })}
                disabled={isSubmitting}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                  errors.durationMinutes ? 'border-error focus:ring-error focus:border-error bg-red-50/10' : 'border-border focus:ring-accent focus:border-accent'
                } text-text-primary bg-slate-50/20`}
              />
              {errors.durationMinutes && (
                <p className="text-[11px] text-error font-semibold pl-1">{errors.durationMinutes.message}</p>
              )}
            </div>
          </div>

          {/* HLS Video URL Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider pl-1">
              HLS Video Playlist URL (Optional)
            </label>
            <input
              type="text"
              {...register('hlsUrl')}
              placeholder="e.g. https://mayiliragu-cdn.sathish.qzz.io/course-id/lesson-id/master.m3u8"
              className="w-full bg-white border border-border/70 rounded-2xl px-4 py-3 text-sm font-semibold text-text-primary placeholder-gray-400 focus:outline-none focus:border-accent transition-all duration-200"
            />
            {errors.hlsUrl && (
              <p className="text-[11px] text-error font-semibold pl-1">{errors.hlsUrl.message}</p>
            )}
          </div>

          {/* Download Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-border/60 rounded-2xl">
            <div className="space-y-0.5">
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                Enable Offline Download
              </label>
              <p className="text-[10px] text-text-secondary font-medium">
                Allows students to download this lesson and watch it offline.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('downloadEnabled')}
                disabled={isSubmitting}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-border/40 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-2 bg-white border border-border hover:bg-slate-50 text-xs font-bold rounded-xl text-text-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 bg-accent hover:bg-accent-onContainer text-xs font-bold rounded-xl text-white shadow-md shadow-accent/15 transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <span>{editingLesson ? 'Save Changes' : 'Create Lesson'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
