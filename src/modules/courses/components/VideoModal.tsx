import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X, Copy, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { videoSchema, type VideoFormValues } from '../../../core/validation';
import type { LessonVideo } from '../../../core/types';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: VideoFormValues, file?: File | null) => Promise<void>;
  editingVideo: LessonVideo | null;
  copiedEmail?: boolean;
  onCopyEmail?: () => void;
  isLoading?: boolean;
}

export default function VideoModal({
  isOpen,
  onClose,
  onSubmit,
  editingVideo,
  copiedEmail = false,
  onCopyEmail,
  isLoading = false,
}: VideoModalProps) {
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<VideoFormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: '',
      description: '',
      image: '',
      driveFileId: '',
      durationMinutes: 5,
      downloadEnabled: false,
    },
  });

  const isSubmitting = isFormSubmitting || isLoading;

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      if (editingVideo) {
        setValue('title', editingVideo.title);
        setValue('description', editingVideo.description || '');
        setValue('image', editingVideo.image || '');
        setValue('driveFileId', editingVideo.driveFileId);
        setValue('durationMinutes', Math.round(editingVideo.duration / 60));
        setValue('downloadEnabled', editingVideo.downloadEnabled ?? false);
        setUploadMode(editingVideo.image ? 'url' : 'file');
      } else {
        reset({
          title: '',
          description: '',
          image: '',
          driveFileId: '',
          durationMinutes: 5,
          downloadEnabled: false,
        });
        setUploadMode('file');
      }
    }
  }, [isOpen, editingVideo, setValue, reset]);

  const onFormSubmit = async (values: VideoFormValues) => {
    await onSubmit(values, selectedFile);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <form 
        onSubmit={handleSubmit(onFormSubmit)}
        className="w-full max-w-2xl bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
              {editingVideo ? 'Edit Video Lecture' : 'Add Video Lecture'}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Supports both YouTube video links and Google Drive video files.
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
          {/* Instructions Box: YouTube & Google Drive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* YouTube Guide */}
            <div className="bg-[#FFF8F2] border border-[#FFE0C2] rounded-2xl p-3.5 space-y-1.5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-[#8A3800] uppercase tracking-wider flex items-center gap-1.5">
                  1. YouTube Video
                </h4>
                <p className="text-[10px] text-[#8A3800]/90 leading-relaxed font-semibold mt-1">
                  Paste any YouTube URL or 11-char ID. Set video to <strong>Unlisted</strong> with <strong>Allow embedding</strong> enabled.
                </p>
              </div>
            </div>

            {/* Google Drive Guide */}
            <div className="bg-[#F4F8FF] border border-[#D0E2FF] rounded-2xl p-3.5 space-y-1.5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-[#002D70] uppercase tracking-wider flex items-center gap-1.5">
                  2. Google Drive Video
                </h4>
                <p className="text-[10px] text-[#002D70]/80 leading-relaxed font-semibold mt-1">
                  Share file (Viewer) with service account:
                </p>
              </div>
              <div className="flex items-center justify-between bg-white border border-[#B8D6FF] rounded-lg px-2 py-1 mt-1">
                <span className="text-[9px] text-text-primary font-mono select-all truncate max-w-[75%]">
                  mayiliraguacadamy@mayiliragu-501911.iam.gserviceaccount.com
                </span>
                {onCopyEmail && (
                  <button
                    type="button"
                    onClick={onCopyEmail}
                    className="flex items-center space-x-0.5 text-[9px] font-black text-accent hover:text-accent-onContainer flex-shrink-0"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
              Video Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Part 1: Historical Background"
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
                Description / Notes
              </label>
              <span className="text-[10px] font-bold text-text-secondary uppercase">Optional</span>
            </div>
            <textarea
              rows={2}
              placeholder="Brief summary of this video session (optional)..."
              {...register('description')}
              disabled={isSubmitting}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all resize-none ${
                errors.description ? 'border-error focus:ring-error focus:border-error bg-red-50/10' : 'border-border focus:ring-accent focus:border-accent'
              } text-text-primary bg-slate-50/20`}
            />
          </div>

          {/* Thumbnail Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                Video Thumbnail Image
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
                      {selectedFile ? selectedFile.name : (editingVideo?.image ? 'Keep Current Image / Choose New File' : 'Select Video Thumbnail Image')}
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
                    placeholder="https://example.com/video-image.png"
                    {...register('image')}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm font-medium outline-none focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Video Source: YouTube or Google Drive */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                YouTube URL/ID or Google Drive ID <span className="text-error">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. https://youtu.be/... or dQw4w9WgXcQ or 1a2b3c4d..."
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
                Allows students to download this video and watch it offline.
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
              <span>{editingVideo ? 'Save Changes' : 'Add Video'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
