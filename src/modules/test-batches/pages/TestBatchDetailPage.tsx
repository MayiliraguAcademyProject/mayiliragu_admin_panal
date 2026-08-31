import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  FileText,
  FileSpreadsheet,
  Upload,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Sparkles
} from 'lucide-react';
import {
  useTestBatchDetail,
  useUploadSchedulePdf,
  useRemoveSchedulePdf,
  useUploadOmrPdf,
  useRemoveOmrPdf,
  useCreateCategory,
  useUpdateCategory,
  useToggleCategoryStatus,
  useDeleteCategory,
  useUploadQuestionPaper,
  useDeleteQuestionPaper,
} from '../services/test-batch-api';
import type { TestBatchQuestionCategory } from '../types';
import { useToast } from '../../../shared/context';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import RefreshButton from '../../../shared/components/RefreshButton';

export default function TestBatchDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'schedule' | 'questions' | 'omr'>('schedule');

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TestBatchQuestionCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySyllabus, setCategorySyllabus] = useState('');
  const [categoryOrder, setCategoryOrder] = useState('0');
  const [categoryEnabled, setCategoryEnabled] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Question Paper Upload Modal State
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperFile, setPaperFile] = useState<File | null>(null);

  // Delete Modals State
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [paperToDelete, setPaperToDelete] = useState<string | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [isDeletingOmr, setIsDeletingOmr] = useState(false);

  // API Hooks
  const { data: batch, isLoading, refetch, isRefetching } = useTestBatchDetail(id);
  const uploadScheduleMutation = useUploadSchedulePdf();
  const removeScheduleMutation = useRemoveSchedulePdf();
  const uploadOmrMutation = useUploadOmrPdf();
  const removeOmrMutation = useRemoveOmrPdf();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const toggleCategoryStatusMutation = useToggleCategoryStatus();
  const deleteCategoryMutation = useDeleteCategory();
  const uploadPaperMutation = useUploadQuestionPaper();
  const deletePaperMutation = useDeleteQuestionPaper();

  // Schedule upload handler
  const handleScheduleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    try {
      await uploadScheduleMutation.mutateAsync({ id, file });
      toast.success('Schedule PDF uploaded successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload schedule PDF');
    }
  };

  // OMR upload handler
  const handleOmrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    try {
      await uploadOmrMutation.mutateAsync({ id, file });
      toast.success('Sample OMR PDF uploaded successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload OMR PDF');
    }
  };

  // Category handlers
  const handleOpenCategoryModal = (cat?: TestBatchQuestionCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryName(cat.name);
      setCategorySyllabus(cat.syllabus || '');
      setCategoryOrder(String(cat.order));
      setCategoryEnabled(cat.isEnabled);
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setCategorySyllabus('');
      setCategoryOrder(String((batch?.categories?.length || 0) + 1));
      setCategoryEnabled(true);
    }
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          categoryId: editingCategory.id,
          batchId: id,
          name: categoryName.trim(),
          syllabus: categorySyllabus.trim() || undefined,
          order: parseInt(categoryOrder, 10) || 0,
          isEnabled: categoryEnabled,
        });
        toast.success('Category updated successfully!');
      } else {
        await createCategoryMutation.mutateAsync({
          batchId: id,
          name: categoryName.trim(),
          syllabus: categorySyllabus.trim() || undefined,
          order: parseInt(categoryOrder, 10) || 0,
          isEnabled: categoryEnabled,
        });
        toast.success('Category created successfully!');
      }
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save category');
    }
  };

  const handleToggleCategory = async (categoryId: string) => {
    try {
      await toggleCategoryStatusMutation.mutateAsync({ categoryId, batchId: id });
      toast.success('Category status updated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to toggle category');
    }
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Question paper handlers
  const handleOpenPaperModal = (categoryId: string) => {
    setTargetCategoryId(categoryId);
    setPaperTitle('');
    setPaperFile(null);
    setIsPaperModalOpen(true);
  };

  const handlePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCategoryId || !paperFile) {
      toast.error('Please select a PDF file');
      return;
    }

    try {
      await uploadPaperMutation.mutateAsync({
        categoryId: targetCategoryId,
        batchId: id,
        file: paperFile,
        title: paperTitle.trim() || paperFile.name,
      });
      toast.success('Question paper PDF uploaded successfully!');
      setIsPaperModalOpen(false);
      setExpandedCategories((prev) => ({ ...prev, [targetCategoryId]: true }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload question paper');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="bg-cardBg border border-border/80 rounded-2xl p-12 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-text-primary">Test Batch Not Found</h3>
        <p className="text-sm text-text-secondary mt-1 mb-6">
          The requested test batch could not be found or has been deleted.
        </p>
        <button
          onClick={() => navigate('/test-batches')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Test Batches</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 pb-16">
      {/* Top Navigation & Info Header */}
      <div className="bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm">
        <button
          onClick={() => navigate('/test-batches')}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Test Batches</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md shadow-accent/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-text-primary">{batch.title}</h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  {batch.targetCategory}
                </span>
                {batch.isAvailableForGuest ? (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-teal-500/10 text-teal-600 border border-teal-500/20">
                    Guest Accessible
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                    TNPSC Only
                  </span>
                )}
                {batch.isEnabled ? (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary mt-0.5">
                {batch.description || 'Test Batch resource workspace'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RefreshButton onRefresh={() => refetch()} isRefetching={isRefetching} />
          </div>
        </div>

        {/* 3 Main Management Tabs */}
        <div className="flex border-b border-border/80 mt-6 gap-2">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Schedule PDF</span>
            {batch.schedulePdfUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Question Papers ({batch.categories?.length || 0} Categories)</span>
          </button>

          <button
            onClick={() => setActiveTab('omr')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'omr'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>3. Sample OMR Sheet</span>
            {batch.omrPdfUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
      </div>

      {/* ================= TAB 1: SCHEDULE PDF ================= */}
      {activeTab === 'schedule' && (
        <div className="bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Master Test Schedule</h2>
            <p className="text-xs text-text-secondary mt-1">
              Upload the official batch schedule PDF containing test dates, timings, and topics.
            </p>
          </div>

          {batch.schedulePdfUrl ? (
            <div className="border border-border/80 rounded-2xl p-6 bg-secondary/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    {batch.schedulePdfName || 'Batch_Schedule.pdf'}
                  </h4>
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Uploaded & Active for students
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={batch.schedulePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-text-primary rounded-xl text-xs font-semibold border border-border/80 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview PDF</span>
                </a>

                <label className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Replace Schedule</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleScheduleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setIsDeletingSchedule(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center bg-secondary/20">
              <Calendar className="w-12 h-12 text-text-secondary opacity-40 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-text-primary">No Schedule PDF Uploaded</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1 mb-5">
                Upload the official schedule document so students can plan their test preparation.
              </p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload Schedule PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleScheduleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: QUESTION PAPERS (CATEGORIES & SYLLABUS) ================= */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Question Paper Categories</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Create categories with syllabus descriptions, active toggles, and upload multiple question PDFs per category.
                </p>
              </div>

              <button
                onClick={() => handleOpenCategoryModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Category</span>
              </button>
            </div>
          </div>

          {(!batch.categories || batch.categories.length === 0) ? (
            <div className="bg-cardBg border border-border/80 rounded-2xl p-12 text-center">
              <FileText className="w-12 h-12 text-text-secondary opacity-40 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-text-primary">No Categories Created Yet</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1 mb-5">
                Start by creating your first subject or unit category (e.g. Unit 8: History & Culture) with its syllabus.
              </p>
              <button
                onClick={() => handleOpenCategoryModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {batch.categories.map((category) => {
                const isExpanded = expandedCategories[category.id] ?? true;
                return (
                  <div
                    key={category.id}
                    className="bg-cardBg border border-border/80 rounded-2xl overflow-hidden shadow-sm transition-all"
                  >
                    {/* Category Header Bar */}
                    <div className="p-5 flex items-center justify-between gap-4 bg-secondary/30">
                      <div
                        onClick={() => toggleCategoryExpand(category.id)}
                        className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                      >
                        <div className="p-1 text-text-secondary hover:text-primary transition-colors">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-bold text-text-primary">{category.name}</h3>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-accent/10 text-accent border border-accent/20">
                              {category.questionPapers?.length || 0} {category.questionPapers?.length === 1 ? 'Paper' : 'Papers'}
                            </span>
                            {category.isEnabled ? (
                              <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                Enabled
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                Disabled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenPaperModal(category.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload PDF</span>
                        </button>

                        <button
                          onClick={() => handleOpenCategoryModal(category)}
                          className="p-2 rounded-xl text-text-secondary hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleCategory(category.id)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            category.isEnabled
                              ? 'text-emerald-600 hover:bg-emerald-500/10'
                              : 'text-text-secondary hover:bg-secondary'
                          }`}
                          title={category.isEnabled ? 'Disable Category' : 'Enable Category'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setCategoryToDelete(category.id)}
                          className="p-2 text-text-secondary hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Category Details & Papers List */}
                    {isExpanded && (
                      <div className="p-6 border-t border-border/80 space-y-6">
                        {/* Syllabus Box */}
                        {category.syllabus && (
                          <div className="bg-secondary/50 border border-border/80 rounded-xl p-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
                              <BookOpen className="w-3.5 h-3.5 text-primary" />
                              <span>Category Syllabus</span>
                            </div>
                            <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed">
                              {category.syllabus}
                            </p>
                          </div>
                        )}

                        {/* Question Paper PDFs List */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                              Uploaded Question Papers ({category.questionPapers?.length || 0})
                            </h4>
                          </div>

                          {(!category.questionPapers || category.questionPapers.length === 0) ? (
                            <div className="border border-dashed border-border rounded-xl p-6 text-center bg-secondary/20">
                              <p className="text-xs text-text-secondary">
                                No question papers uploaded for this category yet.
                              </p>
                              <button
                                onClick={() => handleOpenPaperModal(category.id)}
                                className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Upload first PDF paper</span>
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {category.questionPapers.map((paper) => (
                                <div
                                  key={paper.id}
                                  className="p-3.5 bg-secondary/40 border border-border/80 rounded-xl flex items-center justify-between gap-3 group hover:border-primary/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="overflow-hidden">
                                      <h5 className="text-xs font-bold text-text-primary truncate">
                                        {paper.title}
                                      </h5>
                                      <p className="text-[11px] text-text-secondary truncate">
                                        {paper.fileName}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <a
                                      href={paper.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 text-text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                                      title="View PDF"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <button
                                      onClick={() => setPaperToDelete(paper.id)}
                                      className="p-1.5 text-text-secondary hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Paper"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: OMR SAMPLE SHEET ================= */}
      {activeTab === 'omr' && (
        <div className="bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Sample Practice OMR Sheet</h2>
            <p className="text-xs text-text-secondary mt-1">
              Upload the sample OMR sheet template for students to download, print, and practice offline test bubbling.
            </p>
          </div>

          {batch.omrPdfUrl ? (
            <div className="border border-border/80 rounded-2xl p-6 bg-secondary/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    {batch.omrPdfName || 'Sample_OMR_Sheet.pdf'}
                  </h4>
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    OMR template uploaded & ready for download
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={batch.omrPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-text-primary rounded-xl text-xs font-semibold border border-border/80 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview OMR</span>
                </a>

                <label className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Replace OMR</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleOmrFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setIsDeletingOmr(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center bg-secondary/20">
              <FileSpreadsheet className="w-12 h-12 text-text-secondary opacity-40 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-text-primary">No Sample OMR Sheet Uploaded</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1 mb-5">
                Upload a printable OMR practice sheet template so students can simulate the exam hall environment.
              </p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload Sample OMR PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleOmrFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Add / Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-cardBg border border-border/80 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  {editingCategory ? 'Edit Question Category' : 'Create Question Category'}
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-secondary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 8: History, Culture & Socio-Political Movements"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border border-border/80 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={categoryOrder}
                  onChange={(e) => setCategoryOrder(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border border-border/80 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Syllabus Details
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed syllabus units, key topics, reference books..."
                  value={categorySyllabus}
                  onChange={(e) => setCategorySyllabus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border border-border/80 focus:border-accent focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="catEnabled"
                  checked={categoryEnabled}
                  onChange={(e) => setCategoryEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <label htmlFor="catEnabled" className="text-sm font-medium text-text-primary select-none cursor-pointer">
                  Enable Category (Visible to students)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending
                    ? 'Saving...'
                    : editingCategory
                    ? 'Update Category'
                    : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Question Paper PDF Modal */}
      {isPaperModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-cardBg border border-border/80 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  Upload Question Paper PDF
                </h3>
              </div>
              <button
                onClick={() => setIsPaperModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-secondary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaperSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Paper Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Test 01 - Tamil Society & Culture"
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border border-border/80 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  PDF File *
                </label>
                <input
                  type="file"
                  required
                  accept="application/pdf"
                  onChange={(e) => setPaperFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsPaperModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadPaperMutation.isPending}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {uploadPaperMutation.isPending ? 'Uploading...' : 'Upload PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {categoryToDelete && (
        <ConfirmModal
          isOpen={Boolean(categoryToDelete)}
          title="Delete Category"
          message="Are you sure you want to delete this question category and all its uploaded question papers?"
          confirmText="Delete Category"
          cancelText="Cancel"
          type="danger"
          onConfirm={async () => {
            await deleteCategoryMutation.mutateAsync({ categoryId: categoryToDelete, batchId: id });
            setCategoryToDelete(null);
            toast.success('Category deleted successfully');
          }}
          onClose={() => setCategoryToDelete(null)}
          isLoading={deleteCategoryMutation.isPending}
        />
      )}

      {/* Delete Paper Modal */}
      {paperToDelete && (
        <ConfirmModal
          isOpen={Boolean(paperToDelete)}
          title="Delete Question Paper"
          message="Are you sure you want to delete this question paper PDF?"
          confirmText="Delete Paper"
          cancelText="Cancel"
          type="danger"
          onConfirm={async () => {
            await deletePaperMutation.mutateAsync({ paperId: paperToDelete, batchId: id });
            setPaperToDelete(null);
            toast.success('Question paper deleted successfully');
          }}
          onClose={() => setPaperToDelete(null)}
          isLoading={deletePaperMutation.isPending}
        />
      )}

      {/* Delete Schedule Modal */}
      {isDeletingSchedule && (
        <ConfirmModal
          isOpen={isDeletingSchedule}
          title="Remove Schedule PDF"
          message="Are you sure you want to remove the schedule PDF for this test batch?"
          confirmText="Remove Schedule"
          cancelText="Cancel"
          type="danger"
          onConfirm={async () => {
            await removeScheduleMutation.mutateAsync(id);
            setIsDeletingSchedule(false);
            toast.success('Schedule PDF removed');
          }}
          onClose={() => setIsDeletingSchedule(false)}
          isLoading={removeScheduleMutation.isPending}
        />
      )}

      {/* Delete OMR Modal */}
      {isDeletingOmr && (
        <ConfirmModal
          isOpen={isDeletingOmr}
          title="Remove Sample OMR PDF"
          message="Are you sure you want to remove the sample OMR sheet PDF for this test batch?"
          confirmText="Remove OMR"
          cancelText="Cancel"
          type="danger"
          onConfirm={async () => {
            await removeOmrMutation.mutateAsync(id);
            setIsDeletingOmr(false);
            toast.success('Sample OMR PDF removed');
          }}
          onClose={() => setIsDeletingOmr(false)}
          isLoading={removeOmrMutation.isPending}
        />
      )}
    </div>
  );
}
