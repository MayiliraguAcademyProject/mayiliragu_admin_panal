import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api/client';
import { ApiConstants } from '../../../core/constants';
import {
  Smartphone,
  Save,
  AlertCircle,
  FileText,
  Plus,
  Edit2,
  Trash2,
  X,
  Newspaper,
  BookOpen,
  Award,
  Video,
  Bookmark,
  ShoppingCart,
  Bell,
  Users,
  Presentation,
  Link
} from 'lucide-react';
import RefreshButton from '../../../shared/components/RefreshButton';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../shared/context';
import { extractErrorMessage } from '../../../shared/utils';

const getIconComponent = (iconName: string) => {
  const name = (iconName || '').toLowerCase().trim();
  switch (name) {
    case 'newspaper':
    case 'filetext':
    case 'current affairs':
    case 'current_affairs':
      return Newspaper;
    case 'bookopen':
    case 'menu_book':
    case 'study materials':
    case 'study_materials':
      return BookOpen;
    case 'award':
    case 'quiz':
    case 'tests':
    case 'assignment_turned_in':
      return Award;
    case 'video':
    case 'ondemand_video':
    case 'online videos':
    case 'online_videos':
      return Video;
    case 'bookmark':
    case 'book mark':
    case 'book_mark':
      return Bookmark;
    case 'shopping_cart':
    case 'book store':
    case 'book_store':
    case 'shopping_bag_outlined':
      return ShoppingCart;
    case 'notifications':
    case 'exam updates':
    case 'exam_updates':
      return Bell;
    case 'groups':
    case 'demo classes':
    case 'demo_classes':
    case 'play_circle_outline':
    case 'demo-class':
    case 'demo-courses':
      return Users;
    case 'co_present':
    case 'live classes':
    case 'live_classes':
      return Presentation;
    default:
      return Link;
  }
};

export default function AppConfigPage() {
  const toast = useToast();
  const [releaseTag, setReleaseTag] = useState('');
  const [apkUrl, setApkUrl] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  const GITHUB_DOWNLOAD_PREFIX = 'https://github.com/MayiliraguAcademyProject/mayiliragu_student/releases/download/';
  const GITHUB_DOWNLOAD_SUFFIX = '/app-release.apk';

  const extractTag = (url: string) => {
    if (url && url.startsWith(GITHUB_DOWNLOAD_PREFIX) && url.endsWith(GITHUB_DOWNLOAD_SUFFIX)) {
      return url.substring(GITHUB_DOWNLOAD_PREFIX.length, url.length - GITHUB_DOWNLOAD_SUFFIX.length);
    }
    return '';
  };

  /*
  const buildUrl = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !trimmed.startsWith('http')) {
      return `${GITHUB_DOWNLOAD_PREFIX}${trimmed}${GITHUB_DOWNLOAD_SUFFIX}`;
    }
    return trimmed;
  };
  */

  const extractVersionFromTag = (tag: string) => {
    const match = tag.trim().match(/^v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  };

  const [quickActions, setQuickActions] = useState<any[]>([]);

  // CRUD states for Quick Actions
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<any | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formRoute, setFormRoute] = useState('');
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formIsEnabled, setFormIsEnabled] = useState(true);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');

  useEffect(() => {
    if (!selectedFile) {
      setFilePreview('');
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const [actionToDelete, setActionToDelete] = useState<any | null>(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isFormModalOpen || !!actionToDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormModalOpen, actionToDelete]);

  const openAddModal = () => {
    setEditingAction(null);
    setFormTitle('');
    setFormIcon('');
    setFormRoute('');
    setFormOrder(quickActions.length + 1);
    setFormIsEnabled(true);
    setSelectedFile(null);
    setFormValidationError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (action: any) => {
    setEditingAction(action);
    setFormTitle(action.title || '');
    setFormIcon(action.icon || '');
    setFormRoute(action.route || '');
    setFormOrder(action.order || 0);
    setFormIsEnabled(action.isEnabled !== undefined ? action.isEnabled : true);
    setSelectedFile(null);
    setFormValidationError(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (!formTitle.trim()) {
      setFormValidationError('Title is required');
      return;
    }
    if (!selectedFile && !editingAction) {
      setFormValidationError('Please select an image file to upload');
      return;
    }
    if (!formRoute.trim()) {
      setFormValidationError('Route is required');
      return;
    }

    setFormSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', formTitle.trim());
      formData.append('route', formRoute.trim());
      formData.append('order', String(formOrder));
      formData.append('isEnabled', String(formIsEnabled));

      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('icon', formIcon.trim());
      }

      if (editingAction) {
        // Update existing
        const response = await apiClient.put(`/quick-actions/${editingAction.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data?.status === 'success') {
          toast.success('Quick action updated successfully!');
          fetchQuickActions();
          setIsFormModalOpen(false);
        }
      } else {
        // Create new
        const response = await apiClient.post('/quick-actions', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data?.status === 'success') {
          toast.success('Quick action created successfully!');
          fetchQuickActions();
          setIsFormModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to save quick action:', err);
      setFormValidationError(extractErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!actionToDelete) return;
    try {
      const response = await apiClient.delete(`/quick-actions/${actionToDelete.id}`);
      if (response.data?.status === 'success') {
        toast.success('Quick action deleted successfully!');
        fetchQuickActions();
      }
    } catch (err) {
      console.error('Failed to delete quick action:', err);
      toast.error('Failed to delete quick action');
    } finally {
      setActionToDelete(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefetching(true);
    await Promise.allSettled([
      fetchConfig(),
      fetchQuickActions(),
    ]);
    setIsRefetching(false);
  };

  useEffect(() => {
    fetchConfig();
    fetchQuickActions();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(ApiConstants.appConfig.base);
      if (response.data?.status === 'success') {
        const { requiredVersion, apkDownloadUrl, releaseNotes } = response.data.data;
        const tag = extractTag(apkDownloadUrl);
        setReleaseTag(tag || requiredVersion || '');
        setApkUrl(apkDownloadUrl || '');
        setReleaseNotes(releaseNotes || '');
      }
    } catch (error) {
      console.error('Failed to fetch app configuration:', error);
      toast.error('Failed to fetch current app configuration.');
    } finally {
      setLoading(false);
    }
  };

  /*
  const handleReleaseTagChange = (val: string) => {
    setReleaseTag(val);
    if (!apkUrl || apkUrl.startsWith(GITHUB_DOWNLOAD_PREFIX)) {
      setApkUrl(buildUrl(val));
    }
  };
  */

  const fetchQuickActions = async () => {
    try {
      const response = await apiClient.get('/quick-actions');
      if (response.data?.status === 'success') {
        setQuickActions(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch quick actions:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!apkUrl.trim()) {
      const errText = 'APK Download URL is required.';
      setValidationError(errText);
      return;
    }

    // Default tag to loaded tag or fallback v1.0.0
    const finalReleaseTag = releaseTag.trim() || 'v1.0.0';
    const version = extractVersionFromTag(finalReleaseTag) || '1.0.0';

    setSubmitLoading(true);
    try {
      const response = await apiClient.put(ApiConstants.appConfig.base, {
        requiredVersion: version,
        apkDownloadUrl: apkUrl.trim(),
        releaseNotes: releaseNotes.trim() || null,
      });

      if (response.data?.status === 'success') {
        const succMsg = response.data.message || 'App configuration updated successfully!';
        toast.success(succMsg);
        const { requiredVersion, apkDownloadUrl, releaseNotes } = response.data.data;
        const tag = extractTag(apkDownloadUrl);
        setReleaseTag(tag || requiredVersion || '');
        setApkUrl(apkDownloadUrl || '');
        setReleaseNotes(releaseNotes || '');
      }
    } catch (error: any) {
      console.error('Failed to update app config:', error);
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Smartphone className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">App Configuration</h1>
            {/* <p className="text-sm text-slate-500 dark:text-slate-400">Manage required app version, update releases and APK URLs</p>
          */}
         
          </div>
        </div>
        <RefreshButton onRefresh={handleRefresh} isRefetching={isRefetching} />
      </div>

      {/* Main Card */}
      {false && (
        <div className="bg-white dark:bg-cardBg rounded-2xl border border-slate-100 dark:border-border/60 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-brandPurple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {validationError && (
                <div className="flex items-center space-x-2 p-3 bg-rose-50 text-rose-800 rounded-lg text-xs font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Release Tag Input
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Release Tag / Version Tag
                  </label>
                  <input
                    type="text"
                    value={releaseTag}
                    onChange={(e) => handleReleaseTagChange(e.target.value)}
                    placeholder="v1.0.0"
                    disabled={submitLoading}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition disabled:opacity-50 font-mono"
                  />
                  <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-400 dark:text-slate-500 gap-1">
                    <span>Enter only the release tag name (e.g. <span className="font-mono text-slate-600 dark:text-slate-300">v1.0.0</span>).</span>
                    <span>
                      Detected Version: <span className="font-mono font-semibold text-primary">1.0.0</span>
                    </span>
                  </div>
                </div>
                */}

                {/* APK URL Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    APK Download URL
                  </label>
                  <input
                    type="text"
                    value={apkUrl}
                    onChange={(e) => setApkUrl(e.target.value)}
                    placeholder="https://mayiliragu.com/app.apk"
                    disabled={submitLoading}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition disabled:opacity-50 font-mono"
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    The direct HTTP/HTTPS URL where students can download the updated APK.
                  </p>
                </div>
              </div>

              {/* Release Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Release Notes / Update Description
                </label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-slate-400 dark:text-slate-500">
                    <FileText className="w-4 h-4" />
                  </span>
                  <textarea
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    placeholder="Bug fixes and performance improvements..."
                    rows={4}
                    disabled={submitLoading}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition disabled:opacity-50 resize-none"
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Brief details on what's new in this version. Shown to the students on the update dialog.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-border/60">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {submitLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Configuration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Quick Actions Card */}
      <div className="bg-white dark:bg-cardBg rounded-2xl border border-slate-100 dark:border-border/60 shadow-sm overflow-hidden mt-8 p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Student App Quick Actions</h2>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm rounded-xl transition shadow-sm animate-fade-in"
          >
            <Plus className="w-4 h-4" />
            <span>Add Quick Action</span>
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enable, disable, or change the order of quick actions shown on the student home screen.</p>

        {loading ? (
          <div className="flex items-center justify-center p-6">
            <div className="w-6 h-6 border-4 border-brandPurple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {quickActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-border/40">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Order:</span>
                    <input
                      type="number"
                      value={action.order}
                      onChange={async (e) => {
                        const newOrder = parseInt(e.target.value) || 0;
                        setQuickActions(prev => prev.map(a => a.id === action.id ? { ...a, order: newOrder } : a));
                        try {
                          await apiClient.put(`/quick-actions/${action.id}`, { order: newOrder });
                        } catch (err) {
                          console.error('Failed to update action order', err);
                        }
                      }}
                      className="w-16 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-border/60 rounded text-center font-mono"
                    />
                  </div>

                  {/* Visual Icon Preview */}
                  <div className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-border/40 rounded-xl overflow-hidden text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {(action.icon || '').startsWith('http') ? (
                      <img src={action.icon} alt={action.title} className="w-full h-full object-cover" />
                    ) : (
                      (() => {
                        const IconComp = getIconComponent(action.icon);
                        return <IconComp className="w-5 h-5" />;
                      })()
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{action.title}</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md font-mono max-w-[150px] truncate" title={action.icon}>
                        {(action.icon || '').startsWith('http') ? 'Custom Image' : `Icon: ${action.icon}`}
                      </span>
                    </div>
                    <span className="block text-xs text-slate-400 font-mono">{action.route}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={async () => {
                      const newStatus = !action.isEnabled;
                      setQuickActions(prev => prev.map(a => a.id === action.id ? { ...a, isEnabled: newStatus } : a));
                      try {
                        await apiClient.put(`/quick-actions/${action.id}`, { isEnabled: newStatus });
                      } catch (err) {
                        console.error('Failed to update action status', err);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${action.isEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${action.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(action)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setActionToDelete(action)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!actionToDelete}
        onClose={() => setActionToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Quick Action"
        message={`Are you sure you want to delete the "${actionToDelete?.title}" quick action? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Add / Edit Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-cardBg border border-slate-200 dark:border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-border/60 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingAction ? 'Edit Quick Action' : 'Add Quick Action'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formValidationError && (
                <div className="flex items-center space-x-2 p-3 bg-rose-50 text-rose-800 rounded-lg text-xs font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formValidationError}</span>
                </div>
              )}

              {/* Title Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Current Affairs"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition"
                />
              </div>

              {/* Custom Image Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Upload Icon / Image
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                      }
                    }}
                    className="hidden"
                    id="quick-action-file-upload"
                  />
                  <label
                    htmlFor="quick-action-file-upload"
                    className="px-4 py-2 border border-slate-200 dark:border-border/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl cursor-pointer transition shadow-sm"
                  >
                    Choose Image File
                  </label>
                  <span className="text-xs text-slate-500 truncate max-w-[200px]" title={selectedFile?.name}>
                    {selectedFile ? selectedFile.name : 'No file chosen'}
                  </span>
                </div>
                {/* Current image preview */}
                {editingAction && formIcon.startsWith('http') && !selectedFile && (
                  <div className="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-border/40 w-max mt-2">
                    <img src={formIcon} alt="Current icon" className="w-10 h-10 object-cover rounded-lg" />
                    <span className="text-[10px] text-slate-400 font-mono">Current Image</span>
                  </div>
                )}
                {/* Selected image preview */}
                {selectedFile && filePreview && (
                  <div className="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-border/40 w-max mt-2">
                    <img src={filePreview} alt="Selected preview" className="w-10 h-10 object-cover rounded-lg" />
                    <span className="text-[10px] text-slate-400 font-mono">Selected Preview</span>
                  </div>
                )}
              </div>

              {/* Route Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Route Path
                </label>
                <input
                  type="text"
                  value={formRoute}
                  onChange={(e) => setFormRoute(e.target.value)}
                  placeholder="e.g. /current-affairs"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition font-mono"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Enter the Flutter app route path directly. E.g. `/current-affairs`, `/study-materials`, `/tests`, `/courses`.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* Order Field */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition font-mono text-center"
                  />
                </div>

                {/* Enabled Status Field */}
                <div className="space-y-1 flex flex-col justify-center">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
              </div>

              {/* Modal Action Buttons */}
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
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingAction ? 'Save Changes' : 'Create Action'}</span>
                    </>
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
