import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { courseSchema, type CourseFormValues } from '../../../core/validation';
import type { Course } from '../../../core/types';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CourseFormValues, file?: File | null) => Promise<void>;
  editingCourse: Course | null;
}

export default function CourseModal({
  isOpen,
  onClose,
  onSubmit,
  editingCourse,
}: CourseModalProps) {
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');

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
      setSelectedFile(null);
      setFileError('');
      if (editingCourse) {
        setValue('title', editingCourse.title);
        setValue('description', editingCourse.description);
        setValue('thumbnail', editingCourse.thumbnail);
        setUploadMode(editingCourse.thumbnail ? 'url' : 'file');
      } else {
        reset();
        setUploadMode('file');
      }
    }
  }, [isOpen, editingCourse, setValue, reset]);

  const onFormSubmit = async (values: CourseFormValues) => {
    if (uploadMode === 'file' && !selectedFile && !editingCourse?.thumbnail) {
      setFileError('Please select a thumbnail image to upload');
      return;
    }
    await onSubmit(values, selectedFile);
  };

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

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
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

            {/* Thumbnail Image */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                Thumbnail Image
              </label>

              {/* Mode Toggle Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-background-end/40 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('file');
                    setValue('thumbnail', '');
                    setFileError('');
                  }}
                  className={`py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                    uploadMode === 'file'
                      ? 'bg-cardBg text-primary shadow-sm'
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
                    setFileError('');
                  }}
                  className={`py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                    uploadMode === 'url'
                      ? 'bg-cardBg text-primary shadow-sm'
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
                        if (file) {
                          setFileError('');
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="text-center space-y-1">
                      <p className="text-xs font-extrabold text-text-primary">
                        {selectedFile ? selectedFile.name : (editingCourse?.thumbnail ? 'Keep Current Thumbnail / Choose New' : 'Select Thumbnail Image')}
                      </p>
                      <p className="text-[10px] text-text-secondary font-medium">
                        {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'PNG, JPG, JPEG up to 10MB'}
                      </p>
                    </div>
                  </div>
                  {fileError && (
                    <p className="text-[11px] text-error font-semibold pl-1">{fileError}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
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
