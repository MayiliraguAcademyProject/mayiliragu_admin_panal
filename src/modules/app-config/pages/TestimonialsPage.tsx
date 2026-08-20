import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api/client';
import {
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  User,
  ExternalLink
} from 'lucide-react';
import RefreshButton from '../../../shared/components/RefreshButton';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../shared/context';
import { extractErrorMessage } from '../../../shared/utils';

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.387.51A3.003 3.003 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.862.51 9.387.51 9.387.51s7.525 0 9.387-.51a3.003 3.003 0 0 0 2.11-2.108c.502-1.907.502-5.837.502-5.837s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function TestimonialsPage() {
  const toast = useToast();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any | null>(null);
  const [formStudentName, setFormStudentName] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState(0);
  const [formIsEnabled, setFormIsEnabled] = useState(true);

  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<any | null>(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isFormModalOpen || !!testimonialToDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormModalOpen, testimonialToDelete]);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/testimonials');
      if (response.data?.status === 'success') {
        setTestimonials(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
      toast.error('Failed to fetch testimonials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefetching(true);
    await fetchTestimonials();
    setIsRefetching(false);
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const openAddModal = () => {
    setEditingTestimonial(null);
    setFormStudentName('');
    setFormAvatarUrl('');
    setFormDesignation('');
    setFormVideoUrl('');
    setFormDescription('');
    setFormOrder(testimonials.length);
    setFormIsEnabled(true);
    setFormValidationError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setEditingTestimonial(t);
    setFormStudentName(t.studentName || '');
    setFormAvatarUrl(t.avatarUrl || '');
    setFormDesignation(t.designation || '');
    setFormVideoUrl(t.videoUrl || '');
    setFormDescription(t.description || '');
    setFormOrder(t.order !== undefined ? t.order : 0);
    setFormIsEnabled(t.isEnabled !== undefined ? t.isEnabled : true);
    setFormValidationError(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (!formStudentName.trim()) {
      setFormValidationError('Student name is required');
      return;
    }
    if (!formVideoUrl.trim()) {
      setFormValidationError('Video URL is required');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        studentName: formStudentName.trim(),
        avatarUrl: formAvatarUrl.trim() || null,
        designation: formDesignation.trim() || null,
        videoUrl: formVideoUrl.trim(),
        description: formDescription.trim() || null,
        order: Number(formOrder),
        isEnabled: formIsEnabled,
      };

      if (editingTestimonial) {
        const response = await apiClient.put(`/testimonials/${editingTestimonial.id}`, payload);
        if (response.data?.status === 'success') {
          toast.success('Testimonial updated successfully!');
          fetchTestimonials();
          setIsFormModalOpen(false);
        }
      } else {
        const response = await apiClient.post('/testimonials', payload);
        if (response.data?.status === 'success') {
          toast.success('Testimonial created successfully!');
          fetchTestimonials();
          setIsFormModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to save testimonial:', err);
      setFormValidationError(extractErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!testimonialToDelete) return;
    try {
      const response = await apiClient.delete(`/testimonials/${testimonialToDelete.id}`);
      if (response.data?.status === 'success') {
        toast.success('Testimonial deleted successfully!');
        fetchTestimonials();
      }
    } catch (err) {
      console.error('Failed to delete testimonial:', err);
      toast.error('Failed to delete testimonial.');
    } finally {
      setTestimonialToDelete(null);
    }
  };

  const getYoutubeVideoId = (url: string) => {
    if (!url) return '';
    let match = url.match(/[?&]v=([^&#]+)/);
    if (match && match[1]) return match[1];
    match = url.match(/(?:youtu\.be\/|embed\/|live\/|shorts\/|v\/)([^?&#]+)/);
    if (match && match[1]) return match[1];
    return '';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Student Testimonials</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage video testimonials and success story shortcuts</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <RefreshButton onRefresh={handleRefresh} isRefetching={isRefetching} />
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Testimonial</span>
          </button>
        </div>
      </div>

      {/* List / Grid view */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-brandPurple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-cardBg border border-slate-100 dark:border-border/60 rounded-3xl shadow-sm text-center">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full text-slate-400 mb-4">
            <MessageSquare className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">No Testimonials Found</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-6">Upload student success videos or Shorts to showcase them in the student app.</p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-xl transition"
          >
            Create Testimonial Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => {
            const videoId = getYoutubeVideoId(t.videoUrl);
            const isShorts = t.videoUrl.includes('/shorts/');

            return (
              <div
                key={t.id}
                className={`bg-white dark:bg-cardBg border rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between ${
                  t.isEnabled ? 'border-slate-100 dark:border-border/60' : 'border-slate-200 bg-slate-50/50 dark:bg-slate-800/10 opacity-70'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center space-x-3">
                      {t.avatarUrl ? (
                        <img
                          src={t.avatarUrl}
                          alt={t.studentName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-border/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.studentName}</h4>
                        {t.designation && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">
                            {t.designation}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500 rounded-md">
                        Order: {t.order}
                      </span>
                      {!t.isEnabled && (
                        <span className="text-[9px] uppercase font-bold text-red-500">Disabled</span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail / Video Box */}
                  {videoId ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 dark:border-border/40 mb-4 group">
                      <img
                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <div className="p-3 bg-red-600 text-white rounded-full shadow-lg group-hover:scale-110 transition duration-200">
                          <YoutubeIcon className="w-5 h-5 fill-current" />
                        </div>
                      </div>
                      {isShorts && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                          SHORTS
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-border/60 flex flex-col items-center justify-center text-slate-400 mb-4">
                      <YoutubeIcon className="w-8 h-8 mb-1" />
                      <span className="text-[10px]">Invalid URL format</span>
                    </div>
                  )}

                  {t.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed italic">
                      "{t.description}"
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-border/40 gap-3">
                  <a
                    href={t.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-lg transition"
                  >
                    <span>Watch URL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTestimonialToDelete(t)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!testimonialToDelete}
        onClose={() => setTestimonialToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Testimonial"
        message={`Are you sure you want to delete "${testimonialToDelete?.studentName}" testimonial? This action cannot be undone.`}
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
                {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial Video'}
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

              {/* Student Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Student Name
                </label>
                <input
                  type="text"
                  value={formStudentName}
                  onChange={(e) => setFormStudentName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition"
                />
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Designation / Achievement
                </label>
                <input
                  type="text"
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  placeholder="e.g. Cleared TNPSC Group II - Rank 24"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition"
                />
              </div>

              {/* Avatar Url */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={formAvatarUrl}
                  onChange={(e) => setFormAvatarUrl(e.target.value)}
                  placeholder="https://image-link.com/avatar.jpg"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition"
                />
              </div>

              {/* Video Url */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  YouTube Video / Shorts URL
                </label>
                <input
                  type="text"
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or /shorts/..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition font-mono"
                />
              </div>

              {/* Short Message / Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Testimonial Quote / Message (Optional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What did the student say about the academy?"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition resize-none"
                />
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* Order */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition"
                  />
                </div>

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
                    <span>Save Testimonial</span>
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
