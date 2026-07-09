import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import { apiClient } from '../../../core/api/endpoints';
import { useExamCategories } from '../../../core/api/endpoints';

interface Batch {
  id: string;
  fileName: string;
  examCategory: string;
  status: 'QUEUED' | 'PROCESSING' | 'NEEDS_REVIEW' | 'APPROVED' | 'FAILED';
  totalParsed: number;
  totalApproved: number;
  errorLog?: string;
  createdAt: string;
}

export default function PDFImportsPage() {
  const navigate = useNavigate();
  const { data: categories = [] } = useExamCategories();

  const [file, setFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);

  // Fetch batches
  const fetchBatches = async () => {
    try {
      const res = await apiClient.get('/questions/parsed-batches');
      setBatches(res.data.data.batches || []);
    } catch (err) {
      console.error('Failed to fetch batches', err);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Poll status every 5 seconds ONLY if there is a batch being processed or queued
  useEffect(() => {
    const isParsing = batches.some((b) => b.status === 'PROCESSING' || b.status === 'QUEUED');
    if (!isParsing) return;

    const interval = setInterval(fetchBatches, 5000);
    return () => clearInterval(interval);
  }, [batches]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.toLowerCase().split('.').pop();
      if (ext === 'pdf' || ext === 'docx') {
        setFile(droppedFile);
        setUploadError('');
      } else {
        setUploadError('Only PDF and DOCX files are supported');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError('');
    }
    e.target.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedCategory) return;

    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('exam_category', selectedCategory);
    if (selectedSubject) {
      formData.append('subject_id', selectedSubject);
    }

    try {
      await apiClient.post('/questions/import-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      fetchBatches();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload and parse PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PDF import batch?')) return;
    try {
      await apiClient.delete(`/questions/parsed-batches/${id}`);
      fetchBatches();
    } catch (err) {
      alert('Failed to delete batch');
    }
  };

  const handleReparseBatch = async (id: string) => {
    try {
      await apiClient.put(`/questions/parsed-batches/${id}/reparse`);
      fetchBatches();
    } catch (err) {
      alert('Failed to trigger reparsing');
    }
  };

  // Find selected category object for subjects dropdown
  const categoryObj = categories.find((c) => c.id === selectedCategory);
  const subjects = categoryObj?.subjects || [];
  
  // Check if any batch is actively parsing or queued
  const isParsingActive = batches.some((b) => b.status === 'PROCESSING' || b.status === 'QUEUED');

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">File Test Import Wizard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Upload mock test PDFs or DOCX files to automatically extract, verify, and import questions.
        </p>
      </div>

      {isParsingActive && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center space-x-4 animate-pulse">
          <RefreshCw className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-primary">File Ingestion & AI Parsing in Progress...</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Gemini is currently extracting questions, options, passages, and building rich layouts in the background. The status table below updates automatically.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Card */}
        <div className="lg:col-span-1 bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-text-primary mb-4">Upload PDF / DOCX</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Exam Category *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubject('');
                }}
                required
                className="w-full bg-background-start border border-border/80 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Select */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Subject (Optional)
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedCategory}
                className="w-full bg-background-start border border-border/80 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('pdf-file-input')?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                file
                  ? 'border-green-500 bg-green-50/10'
                  : 'border-border/80 hover:border-accent bg-background-start/40'
              }`}
            >
              <input
                id="pdf-file-input"
                type="file"
                accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className={`w-8 h-8 mx-auto mb-3 ${file ? 'text-green-500' : 'text-text-secondary'}`} />
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-text-primary truncate">{file.name}</p>
                  <p className="text-xs text-text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-text-primary">Drag & drop your question PDF or DOCX</p>
                  <p className="text-xs text-text-secondary">or click to browse local files</p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="flex items-center space-x-2 text-red-500 text-xs font-semibold bg-red-50/10 p-3 rounded-xl border border-red-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || !selectedCategory || isUploading}
              className="w-full bg-primary hover:bg-accent disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Uploading & Parsing...</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Parse Question PDF</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Batches Table */}
        <div className="lg:col-span-2 bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">Ingestion Batches</h2>
            <button onClick={fetchBatches} className="p-2 hover:bg-secondary rounded-lg text-text-secondary transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-xs font-bold text-text-secondary uppercase">
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Progress</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm text-text-primary">
                {isLoadingBatches ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-secondary">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-secondary">
                      No ingestion batches found. Upload a PDF to start.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold max-w-[200px] truncate" title={b.fileName}>
                        {b.fileName}
                      </td>
                      <td className="py-3.5 px-4 capitalize">{b.examCategory.replace(/_/g, ' ')}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            b.status === 'APPROVED'
                              ? 'bg-green-500/10 text-green-600'
                              : b.status === 'NEEDS_REVIEW'
                              ? 'bg-amber-500/10 text-amber-600'
                              : b.status === 'PROCESSING'
                              ? 'bg-blue-500/10 text-blue-600'
                              : b.status === 'FAILED'
                              ? 'bg-red-500/10 text-red-600'
                              : 'bg-gray-500/10 text-gray-600'
                          }`}
                        >
                          {(b.status === 'PROCESSING' || b.status === 'QUEUED') && (
                            <RefreshCw className="w-3 h-3 animate-spin mr-1.5" />
                          )}
                          {b.status === 'NEEDS_REVIEW' ? 'Needs Review' : b.status}
                        </span>
                        {b.status === 'PROCESSING' && b.errorLog && (
                          <div className="text-[11px] text-text-secondary mt-1 max-w-[200px] truncate" title={b.errorLog}>
                            {b.errorLog}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {b.totalApproved} / {b.totalParsed}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-text-secondary">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {b.status === 'NEEDS_REVIEW' && (
                          <button
                            onClick={() => navigate(`/tests/parsed-verification/${b.id}`)}
                            className="inline-flex items-center space-x-1 text-xs font-bold text-white bg-primary hover:bg-accent px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <span>Verify</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {b.status === 'FAILED' && (
                          <button
                            onClick={() => handleReparseBatch(b.id)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"
                            title="Retry Ingestion"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBatch(b.id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"
                          title="Delete Ingestion"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
