import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  FileSpreadsheet 
} from 'lucide-react';
import { useImportQuestions, downloadImportTemplate } from '../../../core/api/endpoints';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const importMutation = useImportQuestions();

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrorDetails([]);
    setGeneralError(null);
    setSuccessMsg(null);

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setGeneralError('Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setGeneralError('File size exceeds 5MB limit.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadImportTemplate();
    } catch (err: any) {
      setGeneralError('Failed to download template. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setErrorDetails([]);
    setGeneralError(null);
    setSuccessMsg(null);

    try {
      const result = await importMutation.mutateAsync(file);
      if (result.status === 'success') {
        setSuccessMsg(result.message || 'Successfully imported all questions!');
        setFile(null);
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccessMsg(null);
        }, 2000);
      }
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData && responseData.summary && responseData.summary.errors) {
        setErrorDetails(responseData.summary.errors);
        setGeneralError(responseData.message || 'Import failed due to row-level validation errors.');
      } else {
        setGeneralError(responseData?.message || err.message || 'An unexpected error occurred during import.');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Bulk Import Questions</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Upload a structured Excel sheet containing bilingual questions</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Download Template Panel */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-accent/5 to-blue-500/5 border border-accent/10 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Use our import template</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Download a pre-formatted template featuring sample question types</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-accent transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Drag & Drop Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragActive ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-accent hover:bg-slate-50/50'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".xlsx,.xls,.csv"
                onChange={handleChange}
              />
              
              <div className="space-y-3.5 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-inner">
                  <Upload className="w-6 h-6 stroke-[1.5]" />
                </div>
                
                {file ? (
                  <div>
                    <p className="text-xs font-bold text-slate-800">{file.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB • Click to change</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Drag & drop your file here, or <span className="text-accent hover:underline">browse</span></p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Supports .xlsx, .xls, .csv (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Error or Success banners */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-start space-x-2.5 animate-slide-in">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-bold leading-relaxed">{successMsg}</p>
              </div>
            )}

            {generalError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 flex items-start space-x-2.5 animate-slide-in">
                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold leading-relaxed">{generalError}</p>
                  
                  {/* Detailed row-level errors list */}
                  {errorDetails.length > 0 && (
                    <div className="mt-2.5 max-h-40 overflow-y-auto border-t border-rose-100/50 pt-2 space-y-1.5">
                      {errorDetails.map((err, idx) => (
                        <div key={idx} className="text-[10px] text-rose-650 font-semibold">
                          <span className="font-black bg-rose-100 px-1.5 py-0.5 rounded mr-1.5">Row {err.row}</span>
                          Field <code className="bg-rose-100 px-1 rounded font-bold">{err.field}</code>: {err.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-4 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={importMutation.isPending}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || importMutation.isPending}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-accent hover:bg-accent/90 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs shadow-md shadow-accent/15 transition-all disabled:shadow-none"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <span>Start Import</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
