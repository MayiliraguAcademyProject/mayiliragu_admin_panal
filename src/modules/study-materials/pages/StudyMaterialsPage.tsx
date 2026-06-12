import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  FolderOpen,
  FileDown,
  UserCheck,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import {
  useStudyCategoriesList,
  useCreateStudyCategory,
  useDeleteStudyCategory,
  useStudyMaterialsAdminList,
  useCreateStudyMaterial,
  useUpdateStudyMaterial,
  useDeleteStudyMaterial
} from '../../../core/api/endpoints';
import type { StudyMaterial } from '../../../core/types';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import CategoryModal from '../components/CategoryModal';
import UploadMaterialModal from '../components/UploadMaterialModal';
import { categorySchema, materialSchema } from '../components/schemas';

export default function StudyMaterialsPage() {
  const [activeTab, setActiveTab] = useState<'materials' | 'approvals' | 'categories'>('materials');

  // Modals status
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // API Hooks
  const { data: categoriesData, isLoading: isCategoriesLoading } = useStudyCategoriesList();
  const createCategoryMutation = useCreateStudyCategory();
  const deleteCategoryMutation = useDeleteStudyCategory();

  const { data: materialsData, isLoading: isMaterialsLoading, error: materialsError } = useStudyMaterialsAdminList();
  const createMaterialMutation = useCreateStudyMaterial();
  const updateMaterialMutation = useUpdateStudyMaterial();
  const deleteMaterialMutation = useDeleteStudyMaterial();

  // Forms
  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  const materialForm = useForm<z.infer<typeof materialSchema>>({
    resolver: zodResolver(materialSchema),
    defaultValues: { title: '', description: '', categoryId: '', accessType: 'FREE', status: 'APPROVED' },
  });

  // Category submission
  const onCategorySubmit = async (values: z.infer<typeof categorySchema>) => {
    try {
      await createCategoryMutation.mutateAsync(values);
      setIsCategoryModalOpen(false);
      categoryForm.reset();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategoryMutation.mutateAsync(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Material submission
  const handleOpenAddMaterial = () => {
    materialForm.reset({
      title: '',
      description: '',
      categoryId: '',
      accessType: 'FREE',
      status: 'APPROVED',
    });
    setEditingMaterial(null);
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  const handleOpenEditMaterial = (mat: StudyMaterial) => {
    materialForm.reset({
      title: mat.title,
      description: mat.description || '',
      categoryId: mat.categoryId,
      accessType: mat.accessType,
      status: mat.status,
    });
    setEditingMaterial(mat);
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  const onMaterialSubmit = async (values: z.infer<typeof materialSchema>) => {
    try {
      if (editingMaterial) {
        await updateMaterialMutation.mutateAsync({
          id: editingMaterial.id,
          ...values,
          file: selectedFile || undefined,
        });
      } else {
        if (!selectedFile) {
          alert('Please select a file to upload');
          return;
        }
        await createMaterialMutation.mutateAsync({
          ...values,
          file: selectedFile,
        });
      }
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      materialForm.reset();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMaterialConfirm = async () => {
    if (materialToDelete) {
      try {
        await deleteMaterialMutation.mutateAsync(materialToDelete);
      } catch (err) {
        console.error(err);
      } finally {
        setMaterialToDelete(null);
      }
    }
  };

  const handleApproveMaterial = async (mat: StudyMaterial) => {
    try {
      await updateMaterialMutation.mutateAsync({
        id: mat.id,
        status: 'APPROVED',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectMaterial = async (mat: StudyMaterial) => {
    try {
      await updateMaterialMutation.mutateAsync({
        id: mat.id,
        status: 'REJECTED',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const categories = categoriesData?.data || [];
  const materials = materialsData?.data || [];
  const publishedMaterials = materials.filter((m) => m.status === 'APPROVED');
  const pendingMaterials = materials.filter((m) => m.status === 'PENDING');

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-fade-in text-text-primary">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" /> Digital Study Library
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-semibold">
            Upload and manage e-books, revision notes, PYQs, and handwritten notes, review faculty uploads, and manage library metadata.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/80 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${
            activeTab === 'materials'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Study Materials ({publishedMaterials.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${
            activeTab === 'approvals'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Approval Queue ({pendingMaterials.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${
            activeTab === 'categories'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Category Manager ({categories.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: STUDY MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-text-secondary">Library Resources List</h2>
            <button
              onClick={handleOpenAddMaterial}
              className="flex items-center space-x-2 px-4 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/20 transition-all duration-200"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Upload Document</span>
            </button>
          </div>

          {isMaterialsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : materialsError ? (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center max-w-md mx-auto space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-650 mx-auto" />
              <p className="text-xs text-red-600 font-medium">Failed to load study library.</p>
            </div>
          ) : publishedMaterials.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-white/40">
              <p className="text-xs text-text-secondary font-semibold">No study materials uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {publishedMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-cardBg border border-border/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded-md">
                        {mat.category?.name ?? 'General'}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-text-secondary text-[10px] font-bold rounded-md">
                        {mat.accessType}
                      </span>
                      <span className="text-[10px] text-text-secondary font-semibold">
                        Size: {formatBytes(mat.fileSize)} • Version: v{mat.version}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-text-primary mt-2">{mat.title}</h3>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {mat.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <a
                      href={`http://192.168.0.142:5000${mat.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-text-primary text-xs font-bold rounded-xl transition-all"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                    <button
                      onClick={() => handleOpenEditMaterial(mat)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-xl transition-all"
                      title="Update details or upload new version"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setMaterialToDelete(mat.id)}
                      className="p-2 bg-slate-100 hover:bg-red-50 text-red-650 rounded-xl transition-all"
                      title="Delete material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: APPROVAL QUEUE */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-text-secondary">Pending Reviews Queue</h2>
          {isMaterialsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : pendingMaterials.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-white/40">
              <p className="text-xs text-text-secondary font-semibold">No materials waiting for review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-cardBg border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-md">
                        Pending Approval
                      </span>
                      <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded-md">
                        {mat.category?.name ?? 'General'}
                      </span>
                      <span className="text-[10px] text-text-secondary font-semibold">
                        Size: {formatBytes(mat.fileSize)}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-text-primary mt-2">{mat.title}</h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{mat.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <a
                      href={`http://192.168.0.142:5000${mat.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-xl transition-all"
                      title="Inspect PDF"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleApproveMaterial(mat)}
                      className="flex items-center space-x-1 px-3.5 py-2 bg-green-650 hover:bg-green-700 text-white text-xs font-black rounded-xl transition-all"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectMaterial(mat)}
                      className="flex items-center space-x-1 px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white text-xs font-black rounded-xl transition-all"
                    >
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-text-secondary">Material Categories</h2>
            <button
              onClick={() => {
                categoryForm.reset();
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/20 transition-all duration-200"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Category</span>
            </button>
          </div>

          {isCategoriesLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-white/40">
              <p className="text-xs text-text-secondary font-semibold">No categories defined yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-cardBg border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary">{cat.name}</h3>
                    <p className="text-xs text-text-secondary mt-1 min-h-[40px] line-clamp-2">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-end border-t border-border/40 pt-3">
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 bg-slate-100 hover:bg-red-50 text-red-650 rounded-xl transition-all"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={onCategorySubmit}
        form={categoryForm}
      />

      <UploadMaterialModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={onMaterialSubmit}
        form={materialForm}
        categories={categories}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        isEditMode={!!editingMaterial}
      />

      <ConfirmModal
        isOpen={materialToDelete !== null}
        onClose={() => setMaterialToDelete(null)}
        onConfirm={handleDeleteMaterialConfirm}
        title="Delete Library Material?"
        message="This will hide the document and all associated version histories from the student application view."
        confirmText="Delete Document"
      />
    </div>
  );
}
