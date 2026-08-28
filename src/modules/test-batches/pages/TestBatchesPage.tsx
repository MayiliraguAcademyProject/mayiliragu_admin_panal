import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  ArrowRight,
  Sparkles,
  Calendar,
  FileSpreadsheet,
  X,
  Upload,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Maximize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useTestBatchesList,
  useTestBatchDetail,
  useCreateTestBatch,
  useUpdateTestBatch,
  useDeleteTestBatch,
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
import type { TestBatch, TestBatchQuestionCategory } from '../types';
import { useToast } from '../../../shared/context';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import RefreshButton from '../../../shared/components/RefreshButton';

export default function TestBatchesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<TestBatch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  // Selected Batch for Side Screen
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'schedule' | 'questions' | 'omr'>('schedule');

  // Category Modal State (inside Side Screen)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TestBatchQuestionCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySyllabus, setCategorySyllabus] = useState('');
  const [categoryOrder, setCategoryOrder] = useState('0');
  const [categoryEnabled, setCategoryEnabled] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Question Paper Upload Modal State (inside Side Screen)
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperFile, setPaperFile] = useState<File | null>(null);

  // Delete Modals inside Side Screen
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [paperToDelete, setPaperToDelete] = useState<string | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [isDeletingOmr, setIsDeletingOmr] = useState(false);

  // Batch Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetCategory, setTargetCategory] = useState('TNPSC');
  const [order, setOrder] = useState('0');
  const [isEnabled, setIsEnabled] = useState(true);

  // API Hooks
  const { data: batches = [], isLoading, refetch, isRefetching } = useTestBatchesList();
  const { data: activeBatchDetail, refetch: refetchDetail, isRefetching: isRefetchingDetail } = useTestBatchDetail(
    selectedBatchId || ''
  );

  const createMutation = useCreateTestBatch();
  const updateMutation = useUpdateTestBatch();
  const deleteMutation = useDeleteTestBatch();

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

  const handleOpenCreateModal = () => {
    setEditingBatch(null);
    setTitle('');
    setDescription('');
    setTargetCategory('TNPSC');
    setOrder(String(batches.length + 1));
    setIsEnabled(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (batch: TestBatch, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingBatch(batch);
    setTitle(batch.title);
    setDescription(batch.description || '');
    setTargetCategory(batch.targetCategory);
    setOrder(String(batch.order));
    setIsEnabled(batch.isEnabled);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Batch title is required');
      return;
    }

    try {
      if (editingBatch) {
        await updateMutation.mutateAsync({
          id: editingBatch.id,
          title: title.trim(),
          description: description.trim() || undefined,
          targetCategory: targetCategory.trim(),
          order: parseInt(order, 10) || 0,
          isEnabled,
        });
        toast.success('Test batch updated successfully!');
      } else {
        const created = await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          targetCategory: targetCategory.trim(),
          order: parseInt(order, 10) || 0,
          isEnabled,
        });
        toast.success('Test batch created successfully!');
        if (created?.id) {
          setSelectedBatchId(created.id);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save test batch');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!batchToDelete) return;
    try {
      await deleteMutation.mutateAsync(batchToDelete);
      toast.success('Test batch deleted successfully!');
      if (selectedBatchId === batchToDelete) {
        setSelectedBatchId(null);
      }
      setBatchToDelete(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete test batch');
    }
  };

  // Schedule upload in side screen
  const handleScheduleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedBatchId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    try {
      await uploadScheduleMutation.mutateAsync({ id: selectedBatchId, file });
      toast.success('Schedule PDF uploaded successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload schedule PDF');
    }
  };

  // OMR upload in side screen
  const handleOmrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedBatchId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    try {
      await uploadOmrMutation.mutateAsync({ id: selectedBatchId, file });
      toast.success('Sample OMR PDF uploaded successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload OMR PDF');
    }
  };

  // Category in side screen
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
      setCategoryOrder(String((activeBatchDetail?.categories?.length || 0) + 1));
      setCategoryEnabled(true);
    }
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          categoryId: editingCategory.id,
          batchId: selectedBatchId,
          name: categoryName.trim(),
          syllabus: categorySyllabus.trim() || undefined,
          order: parseInt(categoryOrder, 10) || 0,
          isEnabled: categoryEnabled,
        });
        toast.success('Category updated successfully!');
      } else {
        await createCategoryMutation.mutateAsync({
          batchId: selectedBatchId,
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

  const handlePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !targetCategoryId || !paperFile) {
      toast.error('Please select a PDF file');
      return;
    }

    try {
      await uploadPaperMutation.mutateAsync({
        categoryId: targetCategoryId,
        batchId: selectedBatchId,
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

  const filteredBatches = batches.filter((b) =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.targetCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8 pb-16">
      {/* Top Header Card */}
      <div className="bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md shadow-accent/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text-primary">Test Batches</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-accent/10 text-accent border border-accent/20">
                  {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-0.5">
                Manage test batches (e.g. Kalki), schedules, categorized question papers, and sample OMR sheets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RefreshButton onRefresh={() => refetch()} isRefetching={isRefetching} />
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Batch</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search batches by name or category (e.g. Kalki, TNPSC)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-secondary rounded-xl border border-border/80 focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Batch Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-cardBg border border-border/80 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-text-secondary mb-4">
            <Layers className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">No Test Batches Found</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mt-1 mb-6">
            {searchTerm
              ? 'No test batches matching your search query. Try another keyword.'
              : 'Create your first test batch (e.g. Kalki Batch) to start uploading schedules, syllabus-wise questions, and OMR sheets.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Test Batch</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBatches.map((batch) => {
            const isSelected = selectedBatchId === batch.id;
            return (
              <div
                key={batch.id}
                onClick={() => setSelectedBatchId(batch.id)}
                className={`bg-cardBg border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]'
                    : 'border-border/80 hover:border-primary/50'
                }`}
              >
                <div>
                  {/* Header: Title & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                          {batch.targetCategory}
                        </span>
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
                      <h2 className="text-lg font-bold text-text-primary mt-2 group-hover:text-primary transition-colors">
                        {batch.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEditModal(batch, e)}
                        title="Edit Batch Info"
                        className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBatchToDelete(batch.id);
                        }}
                        title="Delete Batch"
                        className="p-1.5 rounded-lg text-text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {batch.description && (
                    <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">
                      {batch.description}
                    </p>
                  )}

                  {/* Resource Summary Badges */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/60">
                    <div className="bg-secondary/60 rounded-xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-text-secondary mb-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] font-medium">Schedule</span>
                      </div>
                      <span className={`text-xs font-bold ${batch.schedulePdfUrl ? 'text-emerald-600' : 'text-text-secondary/60'}`}>
                        {batch.schedulePdfUrl ? 'Uploaded' : 'Pending'}
                      </span>
                    </div>

                    <div className="bg-secondary/60 rounded-xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-text-secondary mb-1">
                        <FileText className="w-3.5 h-3.5 text-accent" />
                        <span className="text-[11px] font-medium">Questions</span>
                      </div>
                      <span className="text-xs font-bold text-text-primary">
                        {batch.totalQuestionPapers || 0} PDFs
                      </span>
                    </div>

                    <div className="bg-secondary/60 rounded-xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-text-secondary mb-1">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[11px] font-medium">OMR</span>
                      </div>
                      <span className={`text-xs font-bold ${batch.omrPdfUrl ? 'text-emerald-600' : 'text-text-secondary/60'}`}>
                        {batch.omrPdfUrl ? 'Uploaded' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-5 pt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBatchId(batch.id);
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all group/btn cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-secondary hover:bg-primary hover:text-white text-text-primary'
                    }`}
                  >
                    <span>{isSelected ? 'Side Screen Open' : 'Open Batch in Side Screen'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= SLIDING SIDE SCREEN (DRAWER WORKSPACE) ================= */}
      {selectedBatchId && activeBatchDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-2xl bg-cardBg border-l border-border/80 shadow-2xl h-full flex flex-col animate-slide-left overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Side Screen Header */}
            <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text-primary truncate max-w-xs">
                      {activeBatchDetail.title}
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                      {activeBatchDetail.targetCategory}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate max-w-xs mt-0.5">
                    {activeBatchDetail.description || 'Test Batch Management'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/test-batches/${activeBatchDetail.id}`)}
                  title="Expand to Full Page"
                  className="p-2 rounded-xl text-text-secondary hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <RefreshButton onRefresh={() => refetchDetail()} isRefetching={isRefetchingDetail} />
                <button
                  onClick={() => setSelectedBatchId(null)}
                  className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-secondary transition-colors cursor-pointer"
                  title="Close Side Screen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Side Screen Tab Navigation */}
            <div className="flex border-b border-border/80 px-6 gap-2 bg-secondary/10">
              <button
                onClick={() => setDrawerActiveTab('schedule')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  drawerActiveTab === 'schedule'
                    ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule PDF</span>
                {activeBatchDetail.schedulePdfUrl && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              <button
                onClick={() => setDrawerActiveTab('questions')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  drawerActiveTab === 'questions'
                    ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Question Papers ({activeBatchDetail.categories?.length || 0})</span>
              </button>

              <button
                onClick={() => setDrawerActiveTab('omr')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  drawerActiveTab === 'omr'
                    ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>OMR Sample</span>
                {activeBatchDetail.omrPdfUrl && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            {/* Side Screen Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* SCHEDULE TAB */}
              {drawerActiveTab === 'schedule' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">Master Test Schedule</h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Upload the PDF schedule detailing all test dates and topics for this batch.
                    </p>
                  </div>

                  {activeBatchDetail.schedulePdfUrl ? (
                    <div className="border border-border/80 rounded-2xl p-4 bg-secondary/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-text-primary truncate">
                            {activeBatchDetail.schedulePdfName || 'Schedule.pdf'}
                          </p>
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Active & available for students
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <a
                          href={activeBatchDetail.schedulePdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                          title="Preview Schedule"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <label className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer" title="Replace Schedule">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleScheduleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={() => setIsDeletingSchedule(true)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove Schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-secondary/20">
                      <Calendar className="w-10 h-10 text-text-secondary opacity-50 mx-auto mb-2" />
                      <p className="text-xs font-bold text-text-primary">No Schedule Uploaded</p>
                      <p className="text-[11px] text-text-secondary max-w-xs mx-auto mt-1 mb-4">
                        Upload schedule PDF for students to view test dates.
                      </p>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
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

              {/* QUESTIONS TAB */}
              {drawerActiveTab === 'questions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Categories & Syllabi</h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Group questions by category, add syllabus, and upload multiple question PDFs.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenCategoryModal()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Category</span>
                    </button>
                  </div>

                  {(!activeBatchDetail.categories || activeBatchDetail.categories.length === 0) ? (
                    <div className="border border-dashed border-border rounded-2xl p-8 text-center bg-secondary/20">
                      <FileText className="w-10 h-10 text-text-secondary opacity-50 mx-auto mb-2" />
                      <p className="text-xs font-bold text-text-primary">No Categories Yet</p>
                      <p className="text-[11px] text-text-secondary max-w-xs mx-auto mt-1 mb-4">
                        Create a category (e.g. Unit 8) to upload question paper PDFs.
                      </p>
                      <button
                        onClick={() => handleOpenCategoryModal()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Category</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeBatchDetail.categories.map((cat) => {
                        const isExpanded = expandedCategories[cat.id] ?? true;
                        return (
                          <div
                            key={cat.id}
                            className="bg-cardBg border border-border/80 rounded-2xl overflow-hidden shadow-xs"
                          >
                            <div className="p-3.5 flex items-center justify-between gap-2 bg-secondary/30">
                              <div
                                onClick={() =>
                                  setExpandedCategories((prev) => ({
                                    ...prev,
                                    [cat.id]: !isExpanded,
                                  }))
                                }
                                className="flex items-center gap-2 flex-1 cursor-pointer select-none overflow-hidden"
                              >
                                <div className="text-text-secondary">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-bold text-text-primary truncate">
                                      {cat.name}
                                    </h5>
                                    <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded bg-accent/10 text-accent">
                                      {cat.questionPapers?.length || 0} PDFs
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setTargetCategoryId(cat.id);
                                    setPaperTitle('');
                                    setPaperFile(null);
                                    setIsPaperModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>PDF</span>
                                </button>
                                <button
                                  onClick={() => handleOpenCategoryModal(cat)}
                                  className="p-1 rounded text-text-secondary hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                                  title="Edit Category"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    await toggleCategoryStatusMutation.mutateAsync({
                                      categoryId: cat.id,
                                      batchId: selectedBatchId,
                                    });
                                    toast.success('Category visibility updated');
                                  }}
                                  className={`p-1 rounded transition-colors cursor-pointer ${
                                    cat.isEnabled ? 'text-emerald-600 hover:bg-emerald-500/10' : 'text-text-secondary'
                                  }`}
                                  title={cat.isEnabled ? 'Active' : 'Inactive'}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setCategoryToDelete(cat.id)}
                                  className="p-1 text-text-secondary hover:text-rose-600 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Accordion Body */}
                            {isExpanded && (
                              <div className="p-4 border-t border-border/60 space-y-3">
                                {cat.syllabus && (
                                  <div className="bg-secondary/40 border border-border/60 rounded-xl p-3">
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-text-primary uppercase tracking-wider mb-1">
                                      <BookOpen className="w-3 h-3 text-primary" />
                                      <span>Syllabus</span>
                                    </div>
                                    <p className="text-[11px] text-text-secondary whitespace-pre-line leading-relaxed">
                                      {cat.syllabus}
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider block mb-2">
                                    Question Paper PDFs
                                  </span>

                                  {(!cat.questionPapers || cat.questionPapers.length === 0) ? (
                                    <p className="text-[11px] text-text-secondary italic">
                                      No question papers uploaded yet.
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {cat.questionPapers.map((p) => (
                                        <div
                                          key={p.id}
                                          className="p-2.5 bg-secondary/50 border border-border/60 rounded-xl flex items-center justify-between gap-2"
                                        >
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                            <div className="overflow-hidden">
                                              <p className="text-xs font-semibold text-text-primary truncate">
                                                {p.title}
                                              </p>
                                              <p className="text-[10px] text-text-secondary truncate">
                                                {p.fileName}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <a
                                              href={p.fileUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1 text-text-secondary hover:text-primary rounded cursor-pointer"
                                              title="Preview PDF"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            <button
                                              onClick={() => setPaperToDelete(p.id)}
                                              className="p-1 text-text-secondary hover:text-rose-600 rounded cursor-pointer"
                                              title="Delete Paper"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
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

              {/* OMR TAB */}
              {drawerActiveTab === 'omr' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">Sample Practice OMR Sheet</h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Upload the official sample OMR practice sheet template for student downloads.
                    </p>
                  </div>

                  {activeBatchDetail.omrPdfUrl ? (
                    <div className="border border-border/80 rounded-2xl p-4 bg-secondary/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-text-primary truncate">
                            {activeBatchDetail.omrPdfName || 'Sample_OMR.pdf'}
                          </p>
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Template active & downloadable
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <a
                          href={activeBatchDetail.omrPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                          title="Preview OMR"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <label className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer" title="Replace OMR">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleOmrFileUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={() => setIsDeletingOmr(true)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove OMR"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-secondary/20">
                      <FileSpreadsheet className="w-10 h-10 text-text-secondary opacity-50 mx-auto mb-2" />
                      <p className="text-xs font-bold text-text-primary">No OMR Sheet Uploaded</p>
                      <p className="text-[11px] text-text-secondary max-w-xs mx-auto mt-1 mb-4">
                        Upload sample OMR template for offline test practice.
                      </p>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
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
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-cardBg border border-border/80 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  {editingBatch ? 'Edit Test Batch' : 'Create New Test Batch'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-secondary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Batch Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kalki Test Batch 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border border-border/80 focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Target Exam *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TNPSC"
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border border-border/80 focus:border-accent focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border border-border/80 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description about the test series batch, dates, and syllabus overview..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border border-border/80 focus:border-accent focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="batchEnabled"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <label htmlFor="batchEnabled" className="text-sm font-medium text-text-primary select-none cursor-pointer">
                  Enable Batch (Visible to assigned TNPSC students)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingBatch ? 'Update Batch' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isCategoryModalOpen && selectedBatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-cardBg border border-border/80 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  {editingCategory ? 'Edit Question Category' : 'Add Question Category'}
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
                  placeholder="e.g. Unit 8: History & Culture of Tamil Nadu"
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
                  id="categoryEnabled"
                  checked={categoryEnabled}
                  onChange={(e) => setCategoryEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <label htmlFor="categoryEnabled" className="text-sm font-medium text-text-primary select-none cursor-pointer">
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
      {isPaperModalOpen && selectedBatchId && (
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

      {/* Delete Batch Confirmation Modal */}
      {batchToDelete && (
        <ConfirmModal
          isOpen={Boolean(batchToDelete)}
          title="Delete Test Batch"
          message="Are you sure you want to delete this test batch? All associated categories, question papers, and schedules will be archived."
          confirmText="Delete Batch"
          cancelText="Cancel"
          type="danger"
          onConfirm={handleDeleteConfirm}
          onClose={() => setBatchToDelete(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Delete Category Modal */}
      {categoryToDelete && selectedBatchId && (
        <ConfirmModal
          isOpen={Boolean(categoryToDelete)}
          title="Delete Category"
          message="Are you sure you want to delete this question category and all its uploaded question papers?"
          confirmText="Delete Category"
          cancelText="Cancel"
          type="danger"
          onConfirm={async () => {
            await deleteCategoryMutation.mutateAsync({ categoryId: categoryToDelete, batchId: selectedBatchId });
            setCategoryToDelete(null);
            toast.success('Category deleted successfully');
          }}
          onClose={() => setCategoryToDelete(null)}
          isLoading={deleteCategoryMutation.isPending}
        />
      )}

      {/* Delete Paper Modal */}
      {paperToDelete && selectedBatchId && (
        <ConfirmModal
          isOpen={Boolean(paperToDelete)}
          title="Delete Question Paper"
          message="Are you sure you want to delete this question paper PDF?"
          confirmText="Delete Paper"
          cancelText="Cancel"
          type="danger"
          onConfirm={async () => {
            await deletePaperMutation.mutateAsync({ paperId: paperToDelete, batchId: selectedBatchId });
            setPaperToDelete(null);
            toast.success('Question paper deleted successfully');
          }}
          onClose={() => setPaperToDelete(null)}
          isLoading={deletePaperMutation.isPending}
        />
      )}

      {/* Delete Schedule Modal */}
      {isDeletingSchedule && selectedBatchId && (
        <ConfirmModal
          isOpen={isDeletingSchedule}
          title="Remove Schedule PDF"
          message="Are you sure you want to remove the schedule PDF for this test batch?"
          confirmText="Remove Schedule"
          cancelText="Cancel"
          type="danger"
          onConfirm={async () => {
            await removeScheduleMutation.mutateAsync(selectedBatchId);
            setIsDeletingSchedule(false);
            toast.success('Schedule PDF removed');
          }}
          onClose={() => setIsDeletingSchedule(false)}
          isLoading={removeScheduleMutation.isPending}
        />
      )}

      {/* Delete OMR Modal */}
      {isDeletingOmr && selectedBatchId && (
        <ConfirmModal
          isOpen={isDeletingOmr}
          title="Remove Sample OMR PDF"
          message="Are you sure you want to remove the sample OMR sheet PDF for this test batch?"
          confirmText="Remove OMR"
          cancelText="Cancel"
          type="danger"
          onConfirm={async () => {
            await removeOmrMutation.mutateAsync(selectedBatchId);
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
