import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  BookOpen,
  Edit2,
  Users,
  Key,
  AlertTriangle,
  X,
  Search,
  Home,
  ChevronRight,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import RefreshButton from '../../../shared/components/RefreshButton';
import {
  useTestBatchDetail,
  useCreateCategory,
  useUpdateCategory,
  useToggleCategoryStatus,
  useDeleteCategory,
  useUploadQuestionPaper,
  useDeleteQuestionPaper,
  useUploadAnswerKey,
  useRemoveAnswerKey,
  useBatchEnrollments,
  useEnrollStudent,
  useRemoveEnrollment,
  useBatchOmrSubmissions,
  useDeleteOmrSubmission,
  useDeleteStudentBatchOmrSubmissions,
} from '../services/test-batch-api';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../core/api/client';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../shared/context';
import type { TestBatchQuestionCategory, TestBatchOmrSubmissionItem } from '../types';

export default function TestBatchDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // Active Tab: 'papers' | 'enrollments' | 'omr'
  const [activeTab, setActiveTab] = useState<'papers' | 'enrollments' | 'omr'>('papers');

  // Main Batch Detail Query
  const {
    data: batch,
    isLoading,
    isError,
    refetch: refetchBatch,
    isRefetching: isRefetchingBatch,
  } = useTestBatchDetail(id);

  // Enrollments Query
  const {
    data: enrollments = [],
    isLoading: isEnrollmentsLoading,
    refetch: refetchEnrollments,
    isRefetching: isRefetchingEnrollments,
  } = useBatchEnrollments(id);

  // OMR Submissions Query
  const {
    data: omrSubmissions = [],
    isLoading: isOmrLoading,
    refetch: refetchOmr,
    isRefetching: isRefetchingOmr,
  } = useBatchOmrSubmissions(id);

  const isRefetching = isRefetchingBatch || isRefetchingEnrollments || isRefetchingOmr;

  const handleRefreshAll = async () => {
    try {
      await Promise.all([refetchBatch(), refetchEnrollments(), refetchOmr()]);
      toast.success('Test batch refreshed successfully');
    } catch {
      toast.error('Failed to refresh data');
    }
  };

  // All Students for Single Enrollment
  const { data: rawStudentsData } = useQuery({
    queryKey: ['students-list-for-batch-enroll'],
    queryFn: async () => {
      const res = await apiClient.get('/enrollments/students?limit=100');
      return res.data?.data;
    },
    enabled: activeTab === 'enrollments' || activeTab === 'omr',
  });

  const students = useMemo<Array<{ id: string; name?: string; fullName?: string; email: string }>>(() => {
    if (!rawStudentsData) return [];
    if (Array.isArray(rawStudentsData)) return rawStudentsData;
    if (Array.isArray(rawStudentsData.data)) return rawStudentsData.data;
    if (Array.isArray(rawStudentsData.students)) return rawStudentsData.students;
    return [];
  }, [rawStudentsData]);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TestBatchQuestionCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySyllabus, setCategorySyllabus] = useState('');
  const [categoryEnabled, setCategoryEnabled] = useState(true);

  // Paper Modal State
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [selectedCategoryIdForPaper, setSelectedCategoryIdForPaper] = useState<string | null>(null);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperFile, setPaperFile] = useState<File | null>(null);

  // Expanded Categories Map
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Single Student Enrollment State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Student-specific OMR Cleanup State
  const [isStudentCleanupModalOpen, setIsStudentCleanupModalOpen] = useState(false);
  const [selectedStudentForOmrCleanup, setSelectedStudentForOmrCleanup] = useState('');
  const [cleanupConfirmText, setCleanupConfirmText] = useState('');

  // Individual OMR Submission to Delete
  const [submissionToDelete, setSubmissionToDelete] = useState<TestBatchOmrSubmissionItem | null>(null);

  // Deletion Confirmation States
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [paperToDelete, setPaperToDelete] = useState<string | null>(null);

  // Mutations
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const uploadPaperMutation = useUploadQuestionPaper();
  const deletePaperMutation = useDeleteQuestionPaper();
  const toggleCategoryStatusMutation = useToggleCategoryStatus();
  const uploadAnswerKeyMutation = useUploadAnswerKey();
  const removeAnswerKeyMutation = useRemoveAnswerKey();

  const enrollStudentMutation = useEnrollStudent();
  const removeEnrollmentMutation = useRemoveEnrollment();
  const deleteOmrSubmissionMutation = useDeleteOmrSubmission();
  const deleteStudentBatchOmrMutation = useDeleteStudentBatchOmrSubmissions();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleToggleCategory = async (cat: TestBatchQuestionCategory) => {
    try {
      await toggleCategoryStatusMutation.mutateAsync({
        categoryId: cat.id,
        batchId: id,
      });
      toast.success(`Category ${!cat.isEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch {
      toast.error('Failed to update category status');
    }
  };

  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategorySyllabus('');
    setCategoryEnabled(true);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: TestBatchQuestionCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategorySyllabus(cat.syllabus || '');
    setCategoryEnabled(cat.isEnabled);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          categoryId: editingCategory.id,
          batchId: id,
          name: categoryName.trim(),
          syllabus: categorySyllabus.trim() || undefined,
          isEnabled: categoryEnabled,
        });
        toast.success('Category updated successfully');
      } else {
        await createCategoryMutation.mutateAsync({
          batchId: id,
          name: categoryName.trim(),
          syllabus: categorySyllabus.trim() || undefined,
          isEnabled: categoryEnabled,
        });
        toast.success('Category created successfully');
      }
      setIsCategoryModalOpen(false);
    } catch {
      toast.error('Failed to save category');
    }
  };

  const handleOpenUploadPaper = (categoryId: string) => {
    setSelectedCategoryIdForPaper(categoryId);
    setPaperTitle('');
    setPaperFile(null);
    setIsPaperModalOpen(true);
  };

  const handlePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryIdForPaper) return;
    if (!paperTitle.trim()) {
      toast.error('Please enter a paper title');
      return;
    }
    if (!paperFile) {
      toast.error('Please select a PDF file');
      return;
    }

    try {
      await uploadPaperMutation.mutateAsync({
        batchId: id,
        categoryId: selectedCategoryIdForPaper,
        title: paperTitle.trim(),
        file: paperFile,
      });
      toast.success('Question paper uploaded successfully');
      setIsPaperModalOpen(false);
    } catch {
      toast.error('Failed to upload question paper');
    }
  };

  const handleAnswerKeyUpload = async (paperId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadAnswerKeyMutation.mutateAsync({ paperId, batchId: id, file });
      toast.success('Answer key uploaded successfully');
    } catch {
      toast.error('Failed to upload answer key');
    }
  };

  const handleRemoveAnswerKey = async (paperId: string) => {
    try {
      await removeAnswerKeyMutation.mutateAsync({ paperId, batchId: id });
      toast.success('Answer key removed');
    } catch {
      toast.error('Failed to remove answer key');
    }
  };

  const handleEnrollSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error('Please select a student to enroll');
      return;
    }

    try {
      await enrollStudentMutation.mutateAsync({ batchId: id, studentId: selectedStudentId });
      toast.success('Student enrolled successfully');
      setSelectedStudentId('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to enroll student');
    }
  };

  const handleStudentCleanupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForOmrCleanup) {
      toast.error('Please select a student');
      return;
    }
    if (cleanupConfirmText.trim().toUpperCase() !== 'CONFIRM') {
      toast.error('Please type CONFIRM to execute cleanup');
      return;
    }

    try {
      const res = await deleteStudentBatchOmrMutation.mutateAsync({
        batchId: id,
        studentId: selectedStudentForOmrCleanup,
      });
      setIsStudentCleanupModalOpen(false);
      setCleanupConfirmText('');
      setSelectedStudentForOmrCleanup('');
      toast.success(`Deleted ${res.deleted} OMR submissions for student`);
      if (res.warnings && res.warnings.length > 0) {
        toast.error(`Some files could not be removed from S3 (${res.warnings.length})`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to cleanup student OMR submissions');
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) return students;
    const q = studentSearchTerm.toLowerCase();
    return students.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [students, studentSearchTerm]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !batch) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl inline-block">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Test Batch Not Found</h2>
        <p className="text-text-secondary text-sm">
          The requested test batch could not be found or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate('/test-batches')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Test Batches
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 w-full">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
        <button
          onClick={() => navigate('/dashboard')}
          className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <button
          onClick={() => navigate('/test-batches')}
          className="hover:text-primary transition-colors cursor-pointer"
        >
          Test Batches
        </button>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="text-text-primary font-bold truncate max-w-md">{batch.title}</span>
      </div>

      {/* Header & Back Action */}
      <div className="flex flex-col gap-4 pb-4 border-b border-border/80 w-full">
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/test-batches')}
              className="p-2.5 rounded-xl border border-border hover:bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex-shrink-0"
              title="Back to Test Batches"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-text-primary">{batch.title}</h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
                {batch.targetCategory}
              </span>
              <span
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                  batch.isEnabled
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}
              >
                {batch.isEnabled ? 'Active' : 'Disabled'}
              </span>
              {batch.isAvailableForGuest && (
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
                  Open Preview
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <RefreshButton
              onRefresh={handleRefreshAll}
              isRefetching={isRefetching}
              title="Refresh Test Batch Data"
            />
          </div>
        </div>

        {/* Full-width description block */}
        {batch.description && (
          <div className="w-full bg-cardBg/70 border border-border/70 rounded-xl p-4 text-sm text-text-secondary whitespace-pre-line leading-relaxed shadow-xs">
            {batch.description}
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-cardBg border border-border/80 rounded-2xl max-w-fit shadow-xs">
        <button
          onClick={() => setActiveTab('papers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'papers'
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'text-text-secondary hover:text-text-primary hover:bg-secondary/80'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Question Papers ({batch.categories?.reduce((acc, c) => acc + (c.questionPapers?.length || 0), 0) || 0})
        </button>

        <button
          onClick={() => setActiveTab('enrollments')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'enrollments'
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'text-text-secondary hover:text-text-primary hover:bg-secondary/80'
          }`}
        >
          <Users className="w-4 h-4" />
          Enrolled Students ({enrollments.length})
        </button>

        <button
          onClick={() => setActiveTab('omr')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'omr'
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'text-text-secondary hover:text-text-primary hover:bg-secondary/80'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          OMR Submissions ({omrSubmissions.length})
        </button>
      </div>

      {/* ================= TAB 1: QUESTION PAPERS ================= */}
      {activeTab === 'papers' && (
        <div className="space-y-6">
          {/* Top Actions for Papers */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Categories & Question Papers</h2>
              <p className="text-xs text-text-secondary">
                Organize tests into units/modules, manage sequential order, and upload answer keys.
              </p>
            </div>

            <button
              onClick={handleOpenCreateCategory}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          {/* Categories Accordion List */}
          {(!batch.categories || batch.categories.length === 0) ? (
            <div className="p-12 text-center bg-cardBg border border-border/80 rounded-2xl space-y-3">
              <BookOpen className="w-10 h-10 text-text-secondary/40 mx-auto" />
              <h3 className="text-base font-bold text-text-primary">No Categories Added Yet</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Create unit categories (e.g. "Unit 1: Tamil Society", "General Science") to start uploading sequential mock test papers.
              </p>
              <button
                onClick={handleOpenCreateCategory}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create First Category
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {batch.categories.map((cat, idx) => {
                const isExpanded = Boolean(expandedCategories[cat.id]);
                return (
                  <div
                    key={cat.id}
                    className="bg-cardBg border border-border/80 rounded-2xl overflow-hidden shadow-xs transition-all"
                  >
                    {/* Category Header */}
                    <div className="p-5 flex items-center justify-between gap-4 hover:bg-secondary/40 transition-colors">
                      <div
                        onClick={() => toggleCategory(cat.id)}
                        className="flex items-center gap-3.5 flex-1 cursor-pointer select-none"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-bold text-text-primary">{cat.name}</h3>
                            {!cat.isEnabled && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                                Disabled
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            {cat.questionPapers?.length || 0} Test Papers • Order: #{cat.order}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenUploadPaper(cat.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-text-primary text-xs font-semibold rounded-lg border border-border/80 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-primary" />
                          <span className="hidden sm:inline">Upload Test PDF</span>
                        </button>
                        <button
                          onClick={() => handleToggleCategory(cat)}
                          className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                          title={cat.isEnabled ? 'Disable Category' : 'Enable Category'}
                        >
                          {cat.isEnabled ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-2 text-text-secondary hover:text-primary rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(cat.id)}
                          className="p-2 text-text-secondary hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-secondary transition-colors cursor-pointer ml-1"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Category Details & Question Papers */}
                    {isExpanded && (
                      <div className="p-5 border-t border-border/80 bg-secondary/20 space-y-4">
                        {/* Syllabus section */}
                        {cat.syllabus && (
                          <div className="p-4 bg-secondary/50 rounded-xl border border-border/60 text-xs text-text-secondary space-y-1">
                            <span className="font-bold text-text-primary block">Syllabus Covered:</span>
                            <p className="whitespace-pre-line">{cat.syllabus}</p>
                          </div>
                        )}

                        {/* Papers list */}
                        {(!cat.questionPapers || cat.questionPapers.length === 0) ? (
                          <div className="p-6 text-center text-xs text-text-secondary border border-dashed border-border/80 rounded-xl">
                            No question papers uploaded in this category.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {cat.questionPapers.map((paper, paperIdx) => {
                              return (
                                <div
                                  key={paper.id}
                                  className="p-4 bg-cardBg border border-border/70 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-border transition-all"
                                >
                                  {/* Left: Info */}
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-sm font-bold text-text-primary truncate">
                                          {paper.title}
                                        </h4>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
                                          Test #{paperIdx + 1}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                                        <span className="truncate">{paper.fileName}</span>
                                        {paper.fileSize && (
                                          <span>• {(paper.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                        )}
                                        <a
                                          href={paper.fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-primary hover:underline inline-flex items-center gap-1"
                                        >
                                          View PDF <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Answer Key Actions */}
                                  <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                                    {/* Answer Key Upload / View / Delete */}
                                    {paper.answerKeyUrl ? (
                                      <div className="flex items-center gap-1.5">
                                        <a
                                          href={paper.answerKeyUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                                        >
                                          <Key className="w-3.5 h-3.5" /> Key
                                        </a>
                                        <button
                                          onClick={() => handleRemoveAnswerKey(paper.id)}
                                          className="p-1.5 text-text-secondary hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                                          title="Remove Answer Key"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border/80 bg-secondary hover:bg-secondary/80 text-text-primary cursor-pointer transition-colors">
                                        <Key className="w-3.5 h-3.5 text-accent" />
                                        Upload Key
                                        <input
                                          type="file"
                                          accept="application/pdf"
                                          onChange={(e) => handleAnswerKeyUpload(paper.id, e)}
                                          className="hidden"
                                        />
                                      </label>
                                    )}

                                    {/* Delete Paper button */}
                                    <button
                                      onClick={() => setPaperToDelete(paper.id)}
                                      className="p-1.5 text-text-secondary hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                                      title="Delete Question Paper"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: ENROLLED STUDENTS ================= */}
      {activeTab === 'enrollments' && (
        <div className="space-y-6 w-full">
          {/* Single Student Enrollment (Full Width) */}
          <div className="p-6 bg-cardBg border border-border/80 rounded-2xl shadow-xs space-y-4 w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Enroll Individual Student</h3>
            </div>

            <form onSubmit={handleEnrollSingleStudent} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search student by name or email..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-secondary rounded-xl border border-border/80 focus:outline-none focus:border-accent"
                  />
                </div>

                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-secondary rounded-xl border border-border/80 focus:outline-none focus:border-accent"
                >
                  <option value="">-- Select Student to Enroll --</option>
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName || s.name || 'Unnamed Student'} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={enrollStudentMutation.isPending || !selectedStudentId}
                className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
              >
                {enrollStudentMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
              </button>
            </form>
          </div>

          {/* Enrolled Students Table */}
          <div className="bg-cardBg border border-border/80 rounded-2xl overflow-hidden shadow-xs w-full">
            <div className="p-5 border-b border-border/80 flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary">
                Enrolled Students ({enrollments.length})
              </h3>
            </div>

            {isEnrollmentsLoading ? (
              <div className="p-8 text-center text-xs text-text-secondary">Loading enrollments...</div>
            ) : enrollments.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="w-8 h-8 text-text-secondary/40 mx-auto" />
                <p className="text-sm font-bold text-text-primary">No Students Enrolled</p>
                <p className="text-xs text-text-secondary">
                  Enroll students individually to grant access to this test batch.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 text-text-secondary uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Enrolled Date</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {enrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-text-primary">
                          {enr.name || enr.student?.fullName || enr.student?.name || 'Unnamed Student'}
                        </td>
                        <td className="px-6 py-4 text-text-secondary">{enr.email || enr.student?.email || '-'}</td>
                        <td className="px-6 py-4 text-text-secondary">
                          {new Date(enr.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={async () => {
                              await removeEnrollmentMutation.mutateAsync({
                                batchId: id,
                                studentId: enr.studentId,
                              });
                              toast.success('Student removed from batch');
                            }}
                            className="p-1.5 text-text-secondary hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove Enrollment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: OMR SUBMISSIONS ================= */}
      {activeTab === 'omr' && (
        <div className="space-y-6 w-full">
          {/* Header & Student-Specific Cleanup */}
          <div className="p-6 bg-cardBg border border-border/80 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Student OMR Practice Submissions</h2>
              <p className="text-xs text-text-secondary">
                View student uploaded answer sheets, recorded marks, or cleanup submissions for a particular student.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedStudentForOmrCleanup('');
                setCleanupConfirmText('');
                setIsStudentCleanupModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Cleanup Student's OMRs
            </button>
          </div>

          {/* Submissions Table */}
          <div className="bg-cardBg border border-border/80 rounded-2xl overflow-hidden shadow-xs w-full">
            {isOmrLoading ? (
              <div className="p-8 text-center text-xs text-text-secondary">Loading submissions...</div>
            ) : omrSubmissions.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-text-secondary/40 mx-auto" />
                <p className="text-sm font-bold text-text-primary">No OMR Sheets Submitted Yet</p>
                <p className="text-xs text-text-secondary">
                  When enrolled students submit their shaded OMR practice sheets, they will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 text-text-secondary uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Question Paper</th>
                      <th className="px-6 py-3.5">Submitted OMR PDF</th>
                      <th className="px-6 py-3.5">Marks Obtained</th>
                      <th className="px-6 py-3.5">Submitted At</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {omrSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-text-primary">
                          {sub.studentName || sub.student?.fullName || sub.student?.name || 'Student'}
                          <span className="block font-normal text-[11px] text-text-secondary">
                            {sub.studentEmail || sub.student?.email || ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-text-primary font-medium">
                          {sub.paperTitle || sub.paper?.title || 'Unknown Paper'}
                          {sub.categoryName && (
                            <span className="block text-[11px] text-text-secondary">
                              {sub.categoryName}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={sub.omrFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {sub.omrFileName || 'View OMR PDF'}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-6 py-4 font-bold text-text-primary">
                          {sub.totalMarks !== null && sub.totalMarks !== undefined ? (
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 font-bold">
                              {sub.totalMarks} Marks
                            </span>
                          ) : (
                            <span className="text-text-secondary italic">Not recorded</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-text-secondary">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSubmissionToDelete(sub)}
                            className="p-1.5 text-text-secondary hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete this OMR Submission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Student-Specific OMR Cleanup Modal */}
      {isStudentCleanupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-cardBg border border-border/80 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-text-primary">Cleanup Student's OMRs</h3>
              </div>
              <button
                onClick={() => setIsStudentCleanupModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStudentCleanupSubmit} className="p-6 space-y-4">
              <p className="text-xs text-text-secondary leading-relaxed">
                Select a student to <strong className="text-red-500">permanently delete all their OMR submissions</strong> from AWS S3 and the database for this test batch.
              </p>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Select Enrolled Student *
                </label>
                <select
                  required
                  value={selectedStudentForOmrCleanup}
                  onChange={(e) => setSelectedStudentForOmrCleanup(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-secondary rounded-xl border border-border/80 focus:outline-none focus:border-red-500"
                >
                  <option value="">-- Select Student --</option>
                  {enrollments.map((enr) => (
                    <option key={enr.studentId} value={enr.studentId}>
                      {enr.name || enr.student?.fullName || enr.student?.name || 'Student'} ({enr.email || enr.student?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/20 text-xs text-red-600">
                Please type <strong className="underline">CONFIRM</strong> below to authorize deletion:
              </div>

              <input
                type="text"
                required
                placeholder="Type CONFIRM"
                value={cleanupConfirmText}
                onChange={(e) => setCleanupConfirmText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border border-border/80 focus:border-red-500 focus:outline-none uppercase font-bold tracking-wider text-center"
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsStudentCleanupModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-xl hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    deleteStudentBatchOmrMutation.isPending ||
                    !selectedStudentForOmrCleanup ||
                    cleanupConfirmText.trim().toUpperCase() !== 'CONFIRM'
                  }
                  className="px-5 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/20 hover:bg-red-700 disabled:opacity-40 cursor-pointer transition-all"
                >
                  {deleteStudentBatchOmrMutation.isPending ? 'Cleaning up...' : 'Delete Student Submissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single OMR Submission Modal */}
      {submissionToDelete && (
        <ConfirmModal
          isOpen={Boolean(submissionToDelete)}
          title="Delete OMR Submission"
          message={`Are you sure you want to permanently delete the OMR submission for ${
            submissionToDelete.studentName || submissionToDelete.student?.name || 'this student'
          } on "${submissionToDelete.paperTitle || submissionToDelete.paper?.title || 'this paper'}"?`}
          confirmText="Delete Submission"
          cancelText="Cancel"
          type="danger"
          onConfirm={async () => {
            await deleteOmrSubmissionMutation.mutateAsync({
              submissionId: submissionToDelete.id,
              batchId: id,
            });
            setSubmissionToDelete(null);
            toast.success('OMR submission deleted permanently');
          }}
          onClose={() => setSubmissionToDelete(null)}
          isLoading={deleteOmrSubmissionMutation.isPending}
        />
      )}

      {/* Create / Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-cardBg border border-border/80 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary">
                {editingCategory ? 'Edit Question Category' : 'Create Question Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Category / Unit Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 1: Tamil Society & History"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border border-border/80 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Syllabus Covered (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Topics covering Sangam literature, architecture, and political movements..."
                  value={categorySyllabus}
                  onChange={(e) => setCategorySyllabus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border border-border/80 focus:border-accent focus:outline-none"
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
                <X className="w-4 h-4" />
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
    </div>
  );
}
