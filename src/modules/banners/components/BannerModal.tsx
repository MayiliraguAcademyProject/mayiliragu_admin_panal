import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image as ImageIcon, Loader2, Upload, Plus, Minus } from 'lucide-react';
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
  onSubmit: (values: BannerFormValues, file: File | null) => Promise<void>;
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
  const [curriculumItems, setCurriculumItems] = useState<string[]>(['']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries for linkId populating
  const { data: coursesData } = useCoursesList(1, 50);
  const { data: testsData } = useTestsList();

  const handleUploadZoneClick = () => {
    const input = fileInputRef.current;
    if (!input) return;
    if (input.disabled) return;
    input.click();
  };

  const {
    register,
    handleSubmit,
    watch,
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
      order: defaultOrder,
      isActive: true,
    }
  });

  const isSubmitting = isFormSubmitting || isLoading;

  const watchImageUrl = watch('imageUrl');
  const watchLinkType = watch('linkType');
  const watchOfferPrice = watch('offerPrice');
  const watchOfferValidUntil = watch('offerValidUntil');
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

  // Curriculum dynamic list actions
  const handleAddCurriculumItem = () => {
    setCurriculumItems([...curriculumItems, '']);
  };

  const handleRemoveCurriculumItem = (index: number) => {
    const newItems = curriculumItems.filter((_, i) => i !== index);
    setCurriculumItems(newItems.length > 0 ? newItems : ['']);
  };

  const handleCurriculumItemChange = (index: number, val: string) => {
    const newItems = [...curriculumItems];
    newItems[index] = val;
    setCurriculumItems(newItems);
  };

  useEffect(() => {
    console.log('[BannerModal] Modal state:', { isOpen, editingBannerId: editingBanner?.id, defaultOrder });
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileError(null);

      if (editingBanner) {
        let curriculumList: string[] = [''];
        let stringifiedCurriculum = '';

        if (editingBanner.curriculumJson) {
          let parsed: any = editingBanner.curriculumJson;
          if (typeof parsed === 'string') {
            stringifiedCurriculum = parsed;
            try {
              parsed = JSON.parse(parsed);
            } catch (e) {
              console.warn('[BannerModal] Could not parse curriculumJson string:', e);
            }
          } else {
            try {
              stringifiedCurriculum = JSON.stringify(parsed);
            } catch (e) {
              console.warn('[BannerModal] Could not stringify curriculumJson object:', e);
            }
          }

          if (Array.isArray(parsed)) {
            curriculumList = parsed.map((c: any) => typeof c === 'string' ? c : (c?.title || ''));
          }
        }

        setCurriculumItems(curriculumList.length > 0 ? curriculumList : ['']);

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
          curriculumJson: stringifiedCurriculum,
          order: editingBanner.order,
          isActive: editingBanner.isActive,
        });
      } else {
        setCurriculumItems(['']);
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
    console.log('[BannerModal] 🚀 handleFormSubmit triggered!', { values, selectedFile: selectedFile?.name });
    if (!values.imageUrl && !selectedFile) {
      console.warn('[BannerModal] ⚠️ Validation error: No image provided!');
      setFileError('Please upload an image from local device');
      return;
    }
    const isNone = values.linkType === 'NONE';
    const filteredCurriculum = isNone ? [] : curriculumItems.filter(item => item.trim() !== '');
    const curriculumJson = filteredCurriculum.length > 0
      ? JSON.stringify(filteredCurriculum.map(title => ({ title })))
      : null;

    const payload = {
      ...values,
      linkId: isNone ? null : (values.linkId || null),
      linkUrl: isNone ? null : (values.linkUrl || null),
      price: isNone ? null : values.price,
      offerPrice: isNone ? null : values.offerPrice,
      offerValidUntil: isNone ? null : (values.offerValidUntil || null),
      planDescription: isNone ? null : (values.planDescription || null),
      validityDays: isNone ? null : values.validityDays,
      curriculumJson,
    };
    console.log('[BannerModal] Calling onSubmit with payload:', payload, 'File:', selectedFile);
    await onSubmit(payload, selectedFile);
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
              Specify banner title, upload an image, order, and targeted course link.
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

            {/* Link Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                  Link Type
                </label>
                <select
                  {...register('linkType')}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                >
                  <option value="NONE">None (No Action)</option>
                  <option value="COURSE">Course Detail</option>
                  <option value="TEST">Test Batch Detail</option>
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
                    className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                  >
                    <option value="">Select an item...</option>
                    {watchLinkType === 'COURSE' &&
                      coursesData?.data?.map((course: any) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    {watchLinkType === 'TEST' &&
                      testsData?.map((test: any) => (
                        <option key={test.id} value={test.id}>
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

            {/* Curriculum Dynamic List */}
            {watchLinkType !== 'NONE' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                    Course Curriculum / Sections
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCurriculumItem}
                    className="flex items-center space-x-1 text-[10px] font-bold text-accent hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {curriculumItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder={`Curriculum Item #${index + 1}`}
                        value={item}
                        onChange={(e) => handleCurriculumItemChange(index, e.target.value)}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCurriculumItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
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
                onClick={() => console.log('[BannerModal] 🖱️ Submit button clicked! isSubmitting:', isSubmitting, 'errors:', errors)}
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
