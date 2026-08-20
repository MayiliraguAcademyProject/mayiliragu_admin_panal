import { X, Upload, FileText, Loader2, AlertCircle } from 'lucide-react';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  form: any;
  categories: any[];
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  isEditMode?: boolean;
  isLoading?: boolean;
}

export default function UploadMaterialModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  categories,
  selectedFile,
  onFileChange,
  isEditMode = false,
  isLoading = false,
}: UploadMaterialModalProps) {
  if (!isOpen) return null;

  const isSubmitting = form.formState.isSubmitting || isLoading;

  const MAX_FILE_SIZE_MB = 100;
  const isFileTooLarge = selectedFile ? selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024 : false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-cardBg border border-border rounded-3xl shadow-2xl overflow-hidden transform my-8">
        <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">
                {isEditMode ? 'Update Study Material' : 'Upload Study Material'}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {isEditMode
                  ? 'Update metadata or upload a new version of the resource.'
                  : 'Add a new resource to the digital library with appropriate categories.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-text-secondary transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Indian Economy Notes"
                  {...form.register('title')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-white"
                />
                {form.formState.errors.title && (
                  <p className="text-[10px] text-red-650 font-bold">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Category</label>
                <select
                  {...form.register('categoryId')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.categoryId && (
                  <p className="text-[10px] text-red-650 font-bold">{form.formState.errors.categoryId.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Description</label>
              <textarea
                placeholder="Brief summary or chapters index..."
                {...form.register('description')}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-white resize-none"
              />
            </div>

            {/* Access & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Access Type</label>
                <select
                  {...form.register('accessType')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-white"
                >
                  <option value="FREE">Free (All students)</option>
                  <option value="PREMIUM">Premium (Enrolled students only)</option>
                  <option value="COURSE_RESTRICTED">Course Restricted</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Status</label>
                <select
                  {...form.register('status')}
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-white"
                >
                  <option value="APPROVED">Approved / Published</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* File Upload Zone */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
                {isEditMode ? 'Upload New File Version (Optional)' : 'File Attachment (Required)'}
              </label>
              <div className="border border-dashed border-border rounded-2xl p-6 text-center hover:bg-slate-50/20 transition-all cursor-pointer relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.docx,.doc,.txt,.png,.jpeg,.jpg,.webp,.zip,.rar"
                />
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-accent" />
                  <p className="text-xs font-semibold text-text-primary">
                    Click to select file or drag & drop here
                  </p>
                  <p className="text-[10px] text-text-secondary">
                    Supported: PDF, DOCX, ZIP, PNG, JPG (Max 100MB)
                  </p>
                </div>
              </div>
              {selectedFile && (
                <div
                  className={`flex items-center space-x-2 p-3 border rounded-xl mt-2 ${
                    isFileTooLarge ? 'bg-red-50 border-red-200' : 'bg-accent/5 border-accent/20'
                  }`}
                >
                  <FileText className={`w-4 h-4 ${isFileTooLarge ? 'text-red-650' : 'text-accent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{selectedFile.name}</p>
                    <p className={`text-[9px] ${isFileTooLarge ? 'text-red-600 font-extrabold' : 'text-text-secondary'}`}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB{' '}
                      {isFileTooLarge && `(Exceeds ${MAX_FILE_SIZE_MB}MB Limit!)`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFileChange(null)}
                    className="text-xs font-bold text-red-650 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
              {isFileTooLarge && (
                <div className="flex items-center space-x-1.5 mt-1.5 text-red-600 text-[10px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>File size exceeds {MAX_FILE_SIZE_MB}MB limit. Please select a smaller file.</span>
                </div>
              )}
            </div>

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
                disabled={isSubmitting || isFileTooLarge}
                className="px-6 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-md disabled:opacity-55 flex items-center justify-center space-x-2 transition-all min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{isEditMode ? 'Updating...' : 'Uploading...'}</span>
                  </>
                ) : (
                  <span>{isEditMode ? 'Update Material' : 'Upload and Publish'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

