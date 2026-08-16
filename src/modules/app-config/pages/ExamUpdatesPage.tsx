import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api/client';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  ExternalLink,
  Download,
  Bell
} from 'lucide-react';
import RefreshButton from '../../../shared/components/RefreshButton';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../shared/context';
import { extractErrorMessage } from '../../../shared/utils';

export default function ExamUpdatesPage() {
  const toast = useToast();
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<any | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPdfFile, setFormPdfFile] = useState<File | null>(null);
  const [formIsEnabled, setFormIsEnabled] = useState(true);
  const [formSendNotification, setFormSendNotification] = useState(true);

  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<any | null>(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isFormModalOpen || !!updateToDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormModalOpen, updateToDelete]);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/exam-updates');
      if (response.data?.status === 'success') {
        setUpdates(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch exam updates:', error);
      toast.error('Failed to fetch exam updates.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefetching(true);
    await fetchUpdates();
    setIsRefetching(false);
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const openAddModal = () => {
    setEditingUpdate(null);
    setFormTitle('');
    setFormDescription('');
    setFormPdfFile(null);
    setFormIsEnabled(true);
    setFormSendNotification(true);
    setFormValidationError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setEditingUpdate(u);
    setFormTitle(u.title || '');
    setFormDescription(u.description || '');
    setFormPdfFile(null);
    setFormIsEnabled(u.isEnabled !== undefined ? u.isEnabled : true);
    setFormSendNotification(false);
    setFormValidationError(null);
    setIsFormModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormPdfFile(e.target.files[0]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (!formTitle.trim()) {
      setFormValidationError('Title is required');
      return;
    }
    if (!editingUpdate && !formPdfFile) {
      setFormValidationError('Please select a PDF document file to upload');
      return;
    }

    setFormSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', formTitle.trim());
      formData.append('description', formDescription.trim());
      formData.append('isEnabled', String(formIsEnabled));
      formData.append('sendNotification', String(formSendNotification));
      if (formPdfFile) {
        formData.append('pdf', formPdfFile);
      }

      if (editingUpdate) {
        const response = await apiClient.put(`/exam-updates/${editingUpdate.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data?.status === 'success') {
          toast.success('Exam update updated successfully!');
          fetchUpdates();
          setIsFormModalOpen(false);
        }
      } else {
        const response = await apiClient.post('/exam-updates', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data?.status === 'success') {
          toast.success('Exam update created and announced successfully!');
          fetchUpdates();
          setIsFormModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to save exam update:', err);
      setFormValidationError(extractErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!updateToDelete) return;
    try {
      const response = await apiClient.delete(`/exam-updates/${updateToDelete.id}`);
      if (response.data?.status === 'success') {
        toast.success('Exam update deleted successfully!');
        fetchUpdates();
      }
    } catch (err) {
      console.error('Failed to delete exam update:', err);
      toast.error('Failed to delete exam update.');
    } finally {
      setUpdateToDelete(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Exam Updates</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Post and broadcast official government notification PDFs</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <RefreshButton onRefresh={handleRefresh} isRefetching={isRefetching} />
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Update</span>
          </button>
        </div>
      </div>

      {/* Grid List view */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-brandPurple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : updates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-cardBg border border-slate-100 dark:border-border/60 rounded-3xl shadow-sm text-center">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full text-slate-400 mb-4">
            <FileText className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">No Updates Uploaded</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-6">Upload official recruitment PDF notifications to broadcast them to students.</p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-xl transition"
          >
            Upload First Notification
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {updates.map((u) => (
            <div
              key={u.id}
              className={`bg-white dark:bg-cardBg border rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                u.isEnabled ? 'border-slate-100 dark:border-border/60' : 'border-slate-200 bg-slate-50/50 dark:bg-slate-800/10 opacity-70'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate">{u.title}</h4>
                  <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-md ${u.isEnabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'}`}>
                    {u.isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                {u.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                    {u.description}
                  </p>
                )}
                <span className="text-[10px] text-slate-400 font-medium">
                  Published: {new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center space-x-3 self-stretch md:self-auto justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-border/40">
                <a
                  href={u.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-lg transition"
                >
                  <span>Open PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setUpdateToDelete(u)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!updateToDelete}
        onClose={() => setUpdateToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Exam Update"
        message={`Are you sure you want to delete "${updateToDelete?.title}" notification? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-cardBg border border-slate-200 dark:border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-border/60 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingUpdate ? 'Edit Exam Update' : 'Upload Exam Update PDF'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formValidationError && (
                <div className="flex items-center space-x-2 p-3 bg-rose-50 text-rose-800 rounded-lg text-xs font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formValidationError}</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. TNPSC Group IV 2026 Notification"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition"
                />
              </div>

              {/* Short Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Short Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summarize the announcement details, vacancies, or deadline..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition resize-none"
                />
              </div>

              {/* PDF File Picker */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {editingUpdate ? 'Replace PDF Attachment (Optional)' : 'Select PDF Attachment'}
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/20 dark:border-border/60 dark:hover:bg-slate-800/40">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Download className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formPdfFile ? (
                          <span className="font-semibold text-brandPurple text-center truncate max-w-[280px] block">
                            {formPdfFile.name}
                          </span>
                        ) : (
                          <span>Click to upload notification PDF</span>
                        )}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* Enabled Status */}
                <div className="space-y-1 flex flex-col justify-end">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Is Enabled
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormIsEnabled(!formIsEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formIsEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formIsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Send Notification */}
                {!editingUpdate && (
                  <div className="space-y-1 flex flex-col justify-end">
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-primary" />
                      <span>Send Push</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormSendNotification(!formSendNotification)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formSendNotification ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formSendNotification ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-border/60">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 border border-slate-200 dark:border-border/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center space-x-2 px-5 py-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Save Update</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
