import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { lessonSchema, type LessonFormValues } from '../../../core/validation';
import type { Lesson } from '../../../core/types';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: LessonFormValues, file?: File | null) => Promise<void>;
  editingLesson: Lesson | null;
  copiedEmail?: boolean;
  onCopyEmail?: () => void;
  isLoading?: boolean;
}

export default function LessonModal({
  isOpen,
  onClose,
  onSubmit,
  editingLesson,
  isLoading = false,
}: LessonModalProps) {
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      description: '',
      image: '',
    },
  });

  const isSubmitting = isFormSubmitting || isLoading;

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      if (editingLesson) {
        setValue('title', editingLesson.title);
        setValue('description', editingLesson.description || '');
        setValue('image', editingLesson.image || '');
        setUploadMode(editingLesson.image ? 'url' : 'file');
      } else {
        reset({
          title: '',
          description: '',
          image: '',
        });
        setUploadMode('file');
      }
    }
  }, [isOpen, editingLesson, setValue, reset]);

  const onFormSubmit = async (values: LessonFormValues) => {
    await onSubmit(values, selectedFile);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <form 
        onSubmit={handleSubmit(onFormSubmit)}
        className="w-full max-w-lg bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
              {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Detailed unit (e.g. Fundamental Rights) that will contain video lectures.
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
              Lesson Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Fundamental Rights & Duties"
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

          {/* Description (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                Description / Summary
              </label>
              <span className="text-[10px] font-bold text-text-secondary uppercase">Optional</span>
            </div>
            <textarea
              rows={3}
              placeholder="Outline what students will learn across the videos in this lesson..."
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

          {/* Lesson Thumbnail Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                Lesson Thumbnail Image
              </label>
              <span className="text-[10px] font-bold text-text-secondary uppercase">Optional</span>
            </div>

            {/* Mode Toggle Switch */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setUploadMode('file');
                  setValue('image', '');
                }}
                className={`py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  uploadMode === 'file'
                    ? 'bg-white text-accent shadow-sm'
                    : 'text-text-secondary hover:text-text-primary bg-transparent'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('url');
                  setSelectedFile(null);
                }}
                className={`py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  uploadMode === 'url'
                    ? 'bg-white text-accent shadow-sm'
                    : 'text-text-secondary hover:text-text-primary bg-transparent'
                }`}
              >
                Image URL
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div className="space-y-1.5">
                <div className="border-2 border-dashed border-border/80 hover:border-accent/80 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/15 relative">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSubmitting}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedFile(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="text-center space-y-1">
                    <Upload className="w-6 h-6 text-accent mx-auto" />
                    <p className="text-xs font-extrabold text-text-primary">
                      {selectedFile ? selectedFile.name : (editingLesson?.image ? 'Keep Current Image / Choose New File' : 'Select Lesson Thumbnail Image')}
                    </p>
                    <p className="text-[10px] text-text-secondary font-semibold">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative flex items-center">
                  <ImageIcon className="w-4 h-4 text-text-secondary absolute left-3.5" />
                  <input
                    type="url"
                    placeholder="https://example.com/lesson-image.png"
                    {...register('image')}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm font-medium outline-none focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                  />
                </div>
              </div>
            )}
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
