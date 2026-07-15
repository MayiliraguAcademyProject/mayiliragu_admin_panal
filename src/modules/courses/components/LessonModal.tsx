import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X, Copy, Check } from 'lucide-react';
import { lessonSchema, type LessonFormValues } from '../../../core/validation';
import type { Lesson } from '../../../core/types';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: LessonFormValues) => Promise<void>;
  editingLesson: Lesson | null;
  copiedEmail: boolean;
  onCopyEmail: () => void;
}

export default function LessonModal({
  isOpen,
  onClose,
  onSubmit,
  editingLesson,
  copiedEmail,
  onCopyEmail,
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
      driveFileId: '',
      durationMinutes: 5,
      downloadEnabled: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingLesson) {
        setValue('title', editingLesson.title);
        setValue('description', editingLesson.description);
        setValue('driveFileId', editingLesson.driveFileId);
        setValue('durationMinutes', Math.round(editingLesson.duration / 60));
        setValue('downloadEnabled', editingLesson.downloadEnabled ?? false);
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
            <p className="text-xs text-text-secondary mt-10">
              Fill in lesson title, description, and configure the YouTube video source.
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
          {/* Instructions Box */}
          <div className="bg-[#FFF8F2] border border-[#FFE0C2] rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-extrabold text-[#8A3800] uppercase tracking-wider flex items-center gap-1.5">
              YouTube Video Setup Guide
            </h4>
            <p className="text-[11px] text-[#8A3800]/90 leading-relaxed font-semibold">
              To embed a lesson video from YouTube, configure your YouTube video settings as follows:
            </p>
            <ul className="text-[10px] text-[#8A3800]/80 list-disc list-inside space-y-1 font-medium pl-1">
              <li>Upload your video as <strong>Unlisted</strong> so it isn't publicly searchable on YouTube.</li>
              <li>Make sure <strong>Allow embedding</strong> is enabled under content settings.</li>
              <li>Enable comments if you want students to ask questions.</li>
            </ul>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
              Lesson Title
            </label>
            <input
              type="text"
              placeholder="e.g. Setting up Flutter Environment"
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

          <div className="grid grid-cols-2 gap-4">
            {/* YouTube Video ID / URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                YouTube Video ID or URL
              </label>
              <input
                type="text"
                placeholder="e.g. dQw4w9WgXcQ or https://youtu.be/..."
                {...register('driveFileId')}
                disabled={isSubmitting}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                  errors.driveFileId ? 'border-error focus:ring-error focus:border-error bg-red-50/10' : 'border-border focus:ring-accent focus:border-accent'
                } text-text-primary bg-slate-50/20`}
              />
              {errors.driveFileId && (
                <p className="text-[11px] text-error font-semibold pl-1">{errors.driveFileId.message}</p>
              )}
            </div>

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
