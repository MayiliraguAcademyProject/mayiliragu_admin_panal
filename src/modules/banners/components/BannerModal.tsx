import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image as ImageIcon, Loader2, Upload, FileText, ExternalLink, X, RefreshCw } from 'lucide-react';
import type { Banner } from '../../../core/types';
import { useCoursesList, useTestsList } from '../../../core/api/endpoints';

// Helper to parse numbers safely without producing NaN validation errors in Zod
const parseOptionalNumber = (val: unknown) => {
  if (val === '' || val === null || val === undefined) return null;
  const num = Number(val);
  return Number.isNaN(num) ? null : num;
};

// Form Validation Schema
export const bannerSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  imageUrl: z.string().optional(),
  linkUrl: z.string().nullable().optional(),
  linkType: z.enum(['COURSE', 'TEST', 'NONE']).default('NONE'),
  linkId: z.string().nullable().optional(),
  price: z.preprocess(parseOptionalNumber, z.number().min(0).nullable().optional()),
  offerPrice: z.preprocess(parseOptionalNumber, z.number().min(0).nullable().optional()),
  offerValidUntil: z.string().nullable().optional(),
  planDescription: z.string().nullable().optional(),
  validityDays: z.preprocess(parseOptionalNumber, z.number().int().min(0).nullable().optional()),
  curriculumJson: z.preprocess((val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    try {
      return JSON.stringify(val);
    } catch {
      return null;
    }
  }, z.string().nullable().optional()),
  curriculumPdfUrl: z.string().nullable().optional(),
  curriculumPdfName: z.string().nullable().optional(),
  order: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const num = Number(val);
    return Number.isNaN(num) ? 0 : num;
  }, z.number().int().min(0, 'Order must be 0 or greater')),
  isActive: z.boolean(),
});

export type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: BannerFormValues, file: File | null, pdfFile: File | null) => Promise<void>;
  editingBanner: Banner | null;
  defaultOrder: number;
  isLoading?: boolean;
}

export default function BannerModal({
  isOpen,
  onClose,
  onSubmit,
  editingBanner,
  defaultOrder,
  isLoading = false,
}: BannerModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // PDF Syllabus file state
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Queries for linkId populating
  const { data: coursesData } = useCoursesList(1, 50);
  const { data: testsData } = useTestsList();

  const handleUploadZoneClick = () => {
    const input = fileInputRef.current;
    if (!input || input.disabled) return;
    input.click();
  };

  const handlePdfUploadZoneClick = () => {
    const input = pdfInputRef.current;
    if (!input || input.disabled) return;
    input.click();
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting: isFormSubmitting }
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema) as any,
    defaultValues: {
      title: '',
      imageUrl: '',
      linkUrl: '',
      linkType: 'NONE',
      linkId: '',
      price: null,
      offerPrice: null,
      offerValidUntil: '',
      planDescription: '',
      validityDays: null,
      curriculumJson: '',
      curriculumPdfUrl: '',
      curriculumPdfName: '',
      order: defaultOrder,
      isActive: true,
    }
  });

  const isSubmitting = isFormSubmitting || isLoading;

  const watchImageUrl = watch('imageUrl');
  const watchLinkType = watch('linkType');
  const watchOfferPrice = watch('offerPrice');
  const watchOfferValidUntil = watch('offerValidUntil');
  const watchCurriculumPdfUrl = watch('curriculumPdfUrl');
  const watchCurriculumPdfName = watch('curriculumPdfName');
  const activePreviewUrl = previewUrl || watchImageUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileError(null);
      
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

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedPdfFile(file);
      setValue('curriculumPdfName', file.name);
    }
  };

  const handleRemovePdf = () => {
    setSelectedPdfFile(null);
    setValue('curriculumPdfUrl', '');
    setValue('curriculumPdfName', '');
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setSelectedPdfFile(null);
      setPreviewUrl(null);
      setFileError(null);

      if (editingBanner) {
        reset({
          title: editingBanner.title,
          imageUrl: editingBanner.imageUrl,
          linkUrl: editingBanner.linkUrl || '',
          linkType: editingBanner.linkType || 'NONE',
          linkId: editingBanner.linkId || '',
          price: editingBanner.price !== null && editingBanner.price !== undefined ? Number(editingBanner.price) : null,
          offerPrice: editingBanner.offerPrice !== null && editingBanner.offerPrice !== undefined ? Number(editingBanner.offerPrice) : null,
          offerValidUntil: editingBanner.offerValidUntil ? new Date(editingBanner.offerValidUntil).toISOString().slice(0, 16) : '',
          planDescription: editingBanner.planDescription || '',
          validityDays: editingBanner.validityDays !== null && editingBanner.validityDays !== undefined ? Number(editingBanner.validityDays) : null,
          curriculumJson: typeof editingBanner.curriculumJson === 'string' ? editingBanner.curriculumJson : JSON.stringify(editingBanner.curriculumJson || ''),
          curriculumPdfUrl: editingBanner.curriculumPdfUrl || '',
          curriculumPdfName: editingBanner.curriculumPdfName || '',
          order: editingBanner.order,
          isActive: editingBanner.isActive,
        });
      } else {
        reset({
          title: '',
          imageUrl: '',
          linkUrl: '',
          linkType: 'NONE',
          linkId: '',
          price: null,
          offerPrice: null,
          offerValidUntil: '',
          planDescription: '',
          validityDays: null,
          curriculumJson: '',
          curriculumPdfUrl: '',
          curriculumPdfName: '',
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
    const isNone = values.linkType === 'NONE';

    const payload = {
      ...values,
      linkId: isNone ? null : (values.linkId || null),
      linkUrl: isNone ? null : (values.linkUrl || null),
      price: isNone ? null : values.price,
      offerPrice: isNone ? null : values.offerPrice,
      offerValidUntil: isNone ? null : (values.offerValidUntil || null),
      planDescription: isNone ? null : (values.planDescription || null),
      validityDays: isNone ? null : values.validityDays,
      curriculumPdfUrl: isNone ? null : (values.curriculumPdfUrl || null),
      curriculumPdfName: isNone ? null : (values.curriculumPdfName || null),
    };

    await onSubmit(payload, selectedFile, selectedPdfFile);
  };

  const handleFormInvalid = (errs: any) => {
    console.error('[BannerModal] ❌ Zod Form Validation Failed!', errs);
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
              Specify banner title, upload an image, syllabus PDF, and link to a course or test batch.
            </p>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit, handleFormInvalid)} className="space-y-4">
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
                    accept="image/*"
                    onChange={handleFileChange}
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
                    {selectedFile ? 'Change chosen image' : 'Tap to select banner image'}
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
                      Remove image
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

            {/* Link Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                  Link Type
                </label>
                <select
                  {...register('linkType')}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-cardBg"
                >
                  <option value="NONE" className="bg-cardBg text-text-primary">None (No Action)</option>
                  <option value="COURSE" className="bg-cardBg text-text-primary">Course Detail</option>
                  <option value="TEST" className="bg-cardBg text-text-primary">Test Batch Detail</option>
                </select>
              </div>

              {watchLinkType !== 'NONE' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                    Linked Item
                  </label>
                  <select
                    {...register('linkId')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-cardBg"
                  >
                    <option value="" className="bg-cardBg text-text-primary">Select an item...</option>
                    {watchLinkType === 'COURSE' &&
                      coursesData?.data?.map((course: any) => (
                        <option key={course.id} value={course.id} className="bg-cardBg text-text-primary">
                          {course.title}
                        </option>
                      ))}
                    {watchLinkType === 'TEST' &&
                      testsData?.map((test: any) => (
                        <option key={test.id} value={test.id} className="bg-cardBg text-text-primary">
                          {test.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Price and Validity */}
            {watchLinkType !== 'NONE' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    {...register('price', { valueAsNumber: true })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                  />
                  {errors.price && (
                    <p className="text-[10px] text-error font-semibold pl-1">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                    Validity (Days)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 90"
                    {...register('validityDays')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                  />
                  {errors.validityDays && (
                    <p className="text-[10px] text-error font-semibold pl-1">{errors.validityDays.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Offer Price and Offer Validity */}
            {watchLinkType !== 'NONE' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                    Offer Price (INR) - Optional
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 999"
                    {...register('offerPrice', { valueAsNumber: true })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                  />
                  {errors.offerPrice && (
                    <p className="text-[10px] text-error font-semibold pl-1">{errors.offerPrice.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                    Offer Valid Until
                  </label>
                  <input
                    type="datetime-local"
                    {...register('offerValidUntil')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                  />
                  {errors.offerValidUntil && (
                    <p className="text-[10px] text-error font-semibold pl-1">{errors.offerValidUntil.message}</p>
                  )}
                </div>
              </div>
            )}

            {watchLinkType !== 'NONE' && watchOfferPrice && watchOfferValidUntil && (
              <p className="text-[10px] text-green-600 font-semibold pl-1 -mt-2">
                Discount active: Offer ends on {new Date(watchOfferValidUntil).toLocaleString()}
              </p>
            )}

            {/* Plan Description */}
            {watchLinkType !== 'NONE' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                  Plan Summary / Description
                </label>
                <textarea
                  placeholder="e.g. PLAN PRICE - 1271&#10;GST (18%) - 229&#10;TOTAL - 1500"
                  {...register('planDescription')}
                  disabled={isSubmitting}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                />
              </div>
            )}

            {/* Syllabus / Curriculum PDF Upload */}
            {watchLinkType !== 'NONE' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                    Course Syllabus / Curriculum PDF
                  </label>
                  <span className="text-[10px] text-text-secondary font-medium">
                    Unlocked for enrolled students
                  </span>
                </div>

                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUploadChange => handlePdfFileChange(handlePdfUploadChange)}
                  className="hidden"
                  disabled={isSubmitting}
                />

                {selectedPdfFile || watchCurriculumPdfUrl ? (
                  <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 rounded-2xl">
                    <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                      <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-text-primary truncate">
                          {selectedPdfFile ? selectedPdfFile.name : (watchCurriculumPdfName || 'Course_Syllabus.pdf')}
                        </p>
                        <p className="text-[10px] text-text-secondary">
                          {selectedPdfFile
                            ? `${(selectedPdfFile.size / 1024).toFixed(1)} KB (New File Selected)`
                            : 'Attached Syllabus Document'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {watchCurriculumPdfUrl && !selectedPdfFile && (
                        <a
                          href={watchCurriculumPdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-xs font-bold text-accent hover:bg-accent/10 rounded-xl flex items-center space-x-1 transition-colors"
                          title="Preview PDF in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handlePdfUploadZoneClick}
                        disabled={isSubmitting}
                        className="p-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center space-x-1 transition-colors"
                        title="Replace PDF"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        disabled={isSubmitting}
                        className="p-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                        title="Remove PDF"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handlePdfUploadZoneClick}
                    className="border border-dashed border-border rounded-2xl p-4 text-center hover:bg-slate-50/20 transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 select-none group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary">
                        Click to upload Syllabus PDF
                      </p>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        Upload the comprehensive syllabus document (PDF up to 50MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Legacy Link URL / External URL */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                  Or External Link URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://example.com"
                  {...register('linkUrl')}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
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
