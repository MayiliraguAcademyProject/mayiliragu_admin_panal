import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import type { Banner } from '../../../core/types';

// Form Validation Schema
export const bannerSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  imageUrl: z.string().optional(),
  linkUrl: z.string().nullable().optional(),
  order: z.number().int().min(0, 'Order must be 0 or greater'),
  isActive: z.boolean(),
});

export type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: BannerFormValues, file: File | null) => Promise<void>;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadZoneClick = () => {
    console.log('[Upload] Zone tapped/clicked');
    const input = fileInputRef.current;
    if (!input) {
      console.error('[Upload] fileInputRef.current is NULL — ref not attached');
      return;
    }
    console.log('[Upload] Input element found:', input.tagName);
    console.log('[Upload] Input disabled:', input.disabled);
    console.log('[Upload] Input type:', input.type);
    console.log('[Upload] Input accept:', input.accept);
    console.log('[Upload] Input visibility:', input.style.display, '| opacity:', input.style.opacity);
    console.log('[Upload] Input computed offsetWidth:', input.offsetWidth, 'offsetHeight:', input.offsetHeight);
    console.log('[Upload] isSubmitting state:', isSubmitting);
    if (input.disabled) {
      console.error('[Upload] BLOCKED — input is disabled! isSubmitting was true.');
      return;
    }
    try {
      console.log('[Upload] Calling input.click()...');
      input.click();
      console.log('[Upload] input.click() returned (file picker may now be open)');
    } catch (err) {
      console.error('[Upload] input.click() threw an error:', err);
    }
  };

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
  const activePreviewUrl = previewUrl || watchImageUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange triggered. Files length:', e.target.files?.length);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('Selected file name:', file.name, 'size:', file.size, 'type:', file.type);
      setSelectedFile(file);
      setFileError(null);
      
      // Clean up previous preview url if it exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileError(null);

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

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, editingBanner, defaultOrder, reset]);

  const handleFormSubmit = async (values: BannerFormValues) => {
    if (!values.imageUrl && !selectedFile) {
      setFileError('Please upload an image from local device');
      return;
    }
    await onSubmit(values, selectedFile);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 max-h-[90vh] flex flex-col">
        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1">
          <div>
            <h3 className="text-lg font-black text-text-primary tracking-tight">
              {editingBanner ? 'Edit Promotion Banner' : 'Add Promotion Banner'}
            </h3>
            <p className="text-xs text-text-secondary mt-1 font-semibold">
              Specify banner title, upload an image, order, and targeted course link.
            </p>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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

            {/* TEST INPUT FOR MOBILE CHROME */}
            {/* <div className="p-3 bg-yellow-500/20 border border-yellow-500 rounded-xl space-y-1">
              <p className="text-[10px] font-bold text-yellow-600 uppercase">TEST INPUT (PLAIN & VISIBLE)</p>
              <input
                type="file"
                onChange={(e) => {
                  console.log('[TEST INPUT] onChange fired!', e.target.files);
                  handleFileChange(e);
                }}
              />
            </div> */}

            {/* Image Source Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                Banner Image
              </label>
              <div className="border border-border/80 rounded-2xl p-4 space-y-3 bg-slate-50/10">
                {/* File Upload zone */}
                <div 
                  onClick={handleUploadZoneClick}
                  className="relative border border-dashed border-border rounded-xl p-4 text-center hover:bg-slate-50/20 transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 select-none"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                      console.log('[Upload] onChange fired! files:', e.target.files?.length);
                      handleFileChange(e);
                    }}
                    onClick={() => {
                      console.log('[Upload] Input native onClick fired — file picker should open now');
                    }}
                    style={{
                      position: 'fixed',
                      top: '-9999px',
                      left: '-9999px',
                      width: '1px',
                      height: '1px',
                      opacity: 0,
                    }}
                    disabled={isSubmitting}
                  />
                  <Upload className="w-5 h-5 text-accent" />
                  <p className="text-xs font-semibold text-text-primary">
                    {selectedFile ? 'Change chosen file' : 'Tap to select image from gallery'}
                  </p>
                  <p className="text-[9px] text-text-secondary">
                    {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : 'Supported: JPEG, PNG, WEBP, SVG (Max 10MB)'}
                  </p>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between p-2 bg-accent/5 border border-accent/20 rounded-xl">
                    <span className="text-[10px] font-bold text-text-primary truncate max-w-[80%]">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-[10px] font-black text-red-650 hover:underline"
                    >
                      Remove file
                    </button>
                  </div>
                )}
              </div>
              {fileError && (
                <p className="text-[10px] text-error font-semibold pl-1">{fileError}</p>
              )}
            </div>

            {/* LIVE PREVIEW CONTAINER */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                Live Banner Preview
              </label>
              <div className="aspect-[3/1] rounded-2xl bg-slate-100 border border-border/80 overflow-hidden flex items-center justify-center relative">
                {activePreviewUrl ? (
                  <img 
                    src={activePreviewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-6 h-6 text-gray-350 mx-auto mb-1" />
                    <span className="text-[10px] text-text-secondary font-semibold font-sans">No image selected</span>
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
