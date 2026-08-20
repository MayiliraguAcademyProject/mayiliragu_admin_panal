import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api/client';
import {
  Video,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Clock,
  Send,
  Calendar
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

export default function LiveStreamsPage() {
  const toast = useToast();
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<any | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formScheduledTime, setFormScheduledTime] = useState('');
  const [formIsEnabled, setFormIsEnabled] = useState(true);
  const [formSendNotification, setFormSendNotification] = useState(false);

  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [streamToDelete, setStreamToDelete] = useState<any | null>(null);

  // Time tracker for active countdown rendering
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isFormModalOpen || !!streamToDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormModalOpen, streamToDelete]);

  const fetchLiveStreams = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/live-streams');
      if (response.data?.status === 'success') {
        setStreams(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch live streams:', error);
      toast.error('Failed to fetch live streams.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefetching(true);
    await fetchLiveStreams();
    setIsRefetching(false);
  };

  useEffect(() => {
    fetchLiveStreams();
  }, []);

  const openAddModal = () => {
    setEditingStream(null);
    setFormTitle('');
    setFormDescription('');
    setFormYoutubeUrl('');
    // Default to tomorrow local time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0); // Default to 6:00 PM tomorrow
    // Format to yyyy-MM-ddThh:mm for datetime-local input
    const offset = tomorrow.getTimezoneOffset();
    const localTomorrow = new Date(tomorrow.getTime() - (offset * 60 * 1000));
    setFormScheduledTime(localTomorrow.toISOString().slice(0, 16));
    setFormIsEnabled(true);
    setFormSendNotification(false);
    setFormValidationError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (stream: any) => {
    setEditingStream(stream);
    setFormTitle(stream.title || '');
    setFormDescription(stream.description || '');
    setFormYoutubeUrl(stream.youtubeUrl || '');
    // Format scheduledStart time from DB (ISO string) to local input string
    if (stream.scheduledStartTime) {
      const date = new Date(stream.scheduledStartTime);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      setFormScheduledTime(localDate.toISOString().slice(0, 16));
    } else {
      setFormScheduledTime('');
    }
    setFormIsEnabled(stream.isEnabled !== undefined ? stream.isEnabled : true);
    setFormSendNotification(false);
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
    if (!formYoutubeUrl.trim()) {
      setFormValidationError('YouTube Live URL is required');
      return;
    }
    if (!formScheduledTime) {
      setFormValidationError('Scheduled start time is required');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        youtubeUrl: formYoutubeUrl.trim(),
        scheduledStartTime: new Date(formScheduledTime).toISOString(),
        isEnabled: formIsEnabled,
        sendNotification: formSendNotification,
      };

      if (editingStream) {
        const response = await apiClient.put(`/live-streams/${editingStream.id}`, payload);
        if (response.data?.status === 'success') {
          toast.success('Live stream updated successfully!');
          fetchLiveStreams();
          setIsFormModalOpen(false);
        }
      } else {
        const response = await apiClient.post('/live-streams', payload);
        if (response.data?.status === 'success') {
          toast.success('Live stream created successfully!');
          fetchLiveStreams();
          setIsFormModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to save live stream:', err);
      setFormValidationError(extractErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!streamToDelete) return;
    try {
      const response = await apiClient.delete(`/live-streams/${streamToDelete.id}`);
      if (response.data?.status === 'success') {
        toast.success('Live stream deleted successfully!');
        fetchLiveStreams();
      }
    } catch (err) {
      console.error('Failed to delete live stream:', err);
      toast.error('Failed to delete live stream.');
    } finally {
      setStreamToDelete(null);
    }
  };

  const handleSendAnnouncement = async (stream: any) => {
    try {
      const response = await apiClient.post(`/live-streams/${stream.id}/announce`);
      if (response.data?.status === 'success') {
        toast.success('Announcement push notification sent to all students!');
      }
    } catch (err: any) {
      console.error('Failed to send announcement:', err);
      toast.error(extractErrorMessage(err) || 'Failed to send announcement notification.');
    }
  };

  const getYoutubeVideoId = (url: string) => {
    if (!url) return '';
    let match = url.match(/[?&]v=([^&#]+)/);
    if (match && match[1]) return match[1];
    match = url.match(/(?:youtu\.be\/|embed\/|live\/|v\/)([^?&#]+)/);
    if (match && match[1]) return match[1];
    return '';
  };

  // Helper to compute stream status card color & tags
  const getStreamStatus = (startTimeStr: string) => {
    const startTime = new Date(startTimeStr);
    const difference = startTime.getTime() - currentTime.getTime();

    if (difference > 0) {
      return { label: 'Upcoming', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    } else if (difference <= 0 && Math.abs(difference) < 2 * 60 * 60 * 1000) {
      // Deemed live if start time passed but within 2 hours window
      return { label: 'Live Now', color: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' };
    } else {
      return { label: 'Recorded', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Countdown text generator
  const getCountdownText = (startTimeStr: string) => {
    const startTime = new Date(startTimeStr);
    const diff = startTime.getTime() - currentTime.getTime();

    if (diff <= 0) {
      if (Math.abs(diff) < 2 * 60 * 60 * 1000) {
        return 'Stream has started!';
      }
      return 'Completed';
    }

    const secs = Math.floor(diff / 1000) % 60;
    const mins = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${mins}m`);
    parts.push(`${secs}s`);

    return `Starts in ${parts.join(' ')}`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Video className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Live Video Classes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Schedule YouTube Live video streams and notify students</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <RefreshButton onRefresh={handleRefresh} isRefetching={isRefetching} />
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Live</span>
          </button>
        </div>
      </div>

      {/* Grid of streams */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-brandPurple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : streams.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-cardBg border border-slate-100 dark:border-border/60 rounded-3xl shadow-sm text-center">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full text-slate-400 mb-4">
            <Video className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">No Live Streams Scheduled</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-6">Create your first YouTube Live stream announcement to display it on the student dashboard.</p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-xl transition"
          >
            Schedule Live Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {streams.map((stream) => {
            const status = getStreamStatus(stream.scheduledStartTime);
            const videoId = getYoutubeVideoId(stream.youtubeUrl);
            const isLiveOrUpcoming = new Date(stream.scheduledStartTime).getTime() - currentTime.getTime() > -2 * 60 * 60 * 1000;

            return (
              <div
                key={stream.id}
                className={`bg-white dark:bg-cardBg border rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between ${
                  stream.isEnabled ? 'border-slate-100 dark:border-border/60' : 'border-slate-200 bg-slate-50/50 dark:bg-slate-800/10 opacity-70'
                }`}
              >
                <div>
                  {/* Card Header Status */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className={`px-2.5 py-0.5 border text-xs font-semibold rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                    {!stream.isEnabled && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                        Disabled
                      </span>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 line-clamp-1">
                    {stream.title}
                  </h3>
                  {stream.description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {stream.description}
                    </p>
                  )}

                  {/* Video Thumbnail (Youtube) */}
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
                    </div>
                  ) : (
                    <div className="aspect-video rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-border/60 flex flex-col items-center justify-center text-slate-400 mb-4">
                      <YoutubeIcon className="w-8 h-8 mb-1" />
                      <span className="text-[10px]">Invalid URL format</span>
                    </div>
                  )}

                  {/* Date & Countdown Info */}
                  <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-border/20 rounded-2xl mb-4">
                    <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">
                        {new Date(stream.scheduledStartTime).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    {isLiveOrUpcoming && (
                      <div className="flex items-center space-x-2 text-xs text-primary font-bold">
                        <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>{getCountdownText(stream.scheduledStartTime)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Operations */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-border/40 gap-3">
                  {/* Send announcement trigger */}
                  <button
                    onClick={() => handleSendAnnouncement(stream)}
                    disabled={!stream.isEnabled}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition disabled:opacity-50"
                    title="Notify all students"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Announce</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(stream)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStreamToDelete(stream)}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!streamToDelete}
        onClose={() => setStreamToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Live Stream"
        message={`Are you sure you want to delete "${streamToDelete?.title}" live stream? This action cannot be undone.`}
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
                {editingStream ? 'Edit Scheduled Live' : 'Schedule Live Stream'}
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
                  placeholder="e.g. IBPS PO Live Reasoning Session"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Description (Optional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief details about the live stream curriculum..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition resize-none"
                />
              </div>

              {/* YouTube URL Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  YouTube Live / Video URL
                </label>
                <input
                  type="text"
                  value={formYoutubeUrl}
                  onChange={(e) => setFormYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  Supports standard public URLs or unlisted stream share links.
                </p>
              </div>

              {/* Date & Time Picker */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Scheduled Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formScheduledTime}
                  onChange={(e) => setFormScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition font-mono"
                />
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* Enabled Status Field */}
                <div className="space-y-1 flex flex-col">
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

                {/* Send Notification Instantly Field */}
                {!editingStream && (
                  <div className="space-y-1 flex flex-col">
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Announce via Push
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
                      <Clock className="w-4 h-4" />
                      <span>{editingStream ? 'Save Changes' : 'Schedule Stream'}</span>
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
