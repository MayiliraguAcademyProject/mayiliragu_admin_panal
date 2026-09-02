import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api/client';
import { ApiConstants } from '../../../core/constants';
import {
  Bell,
  Send,
  Calendar,
  Users,
  User,
  Clock,
  FileText,
  GraduationCap,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  X
} from 'lucide-react';
import RefreshButton from '../../../shared/components/RefreshButton';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../shared/context';
import { extractErrorMessage } from '../../../shared/utils';

interface CampaignLog {
  id: string;
  studentId: string;
  status: string;
  sentAt: string;
  error?: string | null;
}

interface Campaign {
  id: string;
  title: string;
  body: string;
  pdfUrl?: string | null;
  status: string; // PENDING, SENT, FAILED
  targetGroup: string; // ALL, BATCH, INDIVIDUAL
  targetValue?: string | null;
  scheduledAt: string;
  sentAt?: string | null;
  logs?: CampaignLog[];
}

interface Course {
  id: string;
  title: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

const BATCH_TYPE_OPTIONS = [
  { value: 'REGULAR', label: 'Regular Batch (Weekday Full-Time)' },
  { value: 'WEEKEND', label: 'Weekend Batch (Saturday & Sunday)' },
  { value: 'EVENING', label: 'Evening Batch (Weekday Evenings)' },
];

export default function NotificationsPage() {
  const toast = useToast();
  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [targetGroup, setTargetGroup] = useState<'ALL' | 'COURSE' | 'BATCH' | 'INDIVIDUAL'>('ALL');
  const [targetValue, setTargetValue] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Data State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  // Edit Campaign State
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editTargetGroup, setEditTargetGroup] = useState<'ALL' | 'COURSE' | 'BATCH' | 'INDIVIDUAL'>('ALL');
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editSubmitLoading, setEditSubmitLoading] = useState(false);

  // Delete Campaign State
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleRefresh = async () => {
    setIsRefetching(true);
    await Promise.allSettled([
      fetchCampaigns(),
      fetchCourses(),
      fetchStudents(),
    ]);
    setIsRefetching(false);
  };

  // Fetch initial data
  useEffect(() => {
    fetchCampaigns();
    fetchCourses();
    fetchStudents();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(ApiConstants.notifications.campaigns);
      const resData = response.data;
      let list: Campaign[] = [];
      if (Array.isArray(resData)) {
        list = resData;
      } else if (Array.isArray(resData?.data)) {
        list = resData.data;
      } else if (Array.isArray(resData?.data?.data)) {
        list = resData.data.data;
      }
      setCampaigns(list);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get(ApiConstants.courses.base, { params: { limit: 50 } });
      const resData = response.data;
      let list: Course[] = [];
      if (Array.isArray(resData)) {
        list = resData;
      } else if (Array.isArray(resData?.data)) {
        list = resData.data;
      } else if (Array.isArray(resData?.data?.data)) {
        list = resData.data.data;
      } else if (Array.isArray(resData?.courses)) {
        list = resData.courses;
      }
      setCourses(list);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setCourses([]);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get(ApiConstants.students.base);
      const resData = response.data;
      let list: Student[] = [];
      if (Array.isArray(resData)) {
        list = resData;
      } else if (Array.isArray(resData?.data)) {
        list = resData.data;
      } else if (Array.isArray(resData?.data?.data)) {
        list = resData.data.data;
      } else if (Array.isArray(resData?.students)) {
        list = resData.students;
      }
      setStudents(list);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      const errText = 'Title and Message Body are required.';
      toast.error(errText);
      return;
    }

    if (targetGroup !== 'ALL' && !targetValue) {
      const errText = targetGroup === 'COURSE'
        ? 'Please select a target course.'
        : 'Please select a target student.';
      toast.error(errText);
      return;
    }

    if (isScheduled && !scheduledAt) {
      const errText = 'Please select a scheduled date and time.';
      toast.error(errText);
      return;
    }

    setSubmitLoading(true);

    try {
      let response;
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('body', body.trim());
      formData.append('targetGroup', targetGroup);
      if (targetGroup !== 'ALL' && targetValue) {
        formData.append('targetValue', targetValue);
      }
      if (isScheduled && scheduledAt) {
        formData.append('scheduledAt', new Date(scheduledAt).toISOString());
      }
      if (pdfFile) {
        formData.append('pdf', pdfFile);
      }

      if (isScheduled) {
        response = await apiClient.post(ApiConstants.notifications.campaigns, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await apiClient.post(ApiConstants.notifications.sendImmediate, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (response.data?.status === 'success') {
        const succMsg = isScheduled
          ? 'Campaign scheduled successfully!'
          : 'Push notifications dispatched successfully!';
        toast.success(succMsg);
        // Reset form
        setTitle('');
        setBody('');
        setPdfFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTargetValue('');
        setIsScheduled(false);
        setScheduledAt('');
        fetchCampaigns();
      } else {
        const errMsg = response.data?.message || 'Something went wrong.';
        toast.error(errMsg);
      }
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenEdit = (camp: Campaign) => {
    setEditingCampaign(camp);
    setEditTitle(camp.title || '');
    setEditBody(camp.body || '');
    setEditTargetGroup((camp.targetGroup as any) || 'ALL');
    setEditTargetValue(camp.targetValue || '');

    if (camp.scheduledAt) {
      const date = new Date(camp.scheduledAt);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      setEditScheduledAt(formatted);
    } else {
      setEditScheduledAt('');
    }
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent, sendNow: boolean = false) => {
    e.preventDefault();
    if (!editingCampaign) return;

    if (!editTitle.trim() || !editBody.trim()) {
      toast.error('Title and Message Body are required.');
      return;
    }

    if (editingCampaign.status === 'PENDING' && editTargetGroup !== 'ALL' && !editTargetValue) {
      if (editTargetGroup === 'COURSE') toast.error('Please select a target course.');
      else if (editTargetGroup === 'BATCH') toast.error('Please select a target batch.');
      else toast.error('Please select a target student.');
      return;
    }

    if (editingCampaign.status === 'PENDING' && !sendNow && !editScheduledAt) {
      toast.error('Please select a scheduled date and time.');
      return;
    }

    setEditSubmitLoading(true);
    try {
      const payload: any = {
        title: editTitle.trim(),
        body: editBody.trim(),
      };

      if (editingCampaign.status === 'PENDING') {
        payload.targetGroup = editTargetGroup;
        payload.targetValue = editTargetGroup === 'ALL' ? null : editTargetValue;
        payload.scheduledAt = editScheduledAt ? new Date(editScheduledAt).toISOString() : undefined;
        payload.sendNow = sendNow;
      }

      const response = await apiClient.put(
        ApiConstants.notifications.campaignDetail(editingCampaign.id),
        payload
      );

      if (response.data?.status === 'success') {
        toast.success(sendNow ? 'Campaign dispatched immediately!' : 'Campaign updated successfully!');
        setIsEditModalOpen(false);
        setEditingCampaign(null);
        fetchCampaigns();
      } else {
        toast.error(response.data?.message || 'Failed to update campaign');
      }
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    } finally {
      setEditSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCampaign) return;
    setDeleteLoading(true);
    try {
      const response = await apiClient.delete(
        ApiConstants.notifications.campaignDetail(deletingCampaign.id)
      );

      if (response.data?.status === 'success') {
        toast.success('Campaign deleted successfully!');
        setIsDeleteModalOpen(false);
        setDeletingCampaign(null);
        fetchCampaigns();
      } else {
        toast.error(response.data?.message || 'Failed to delete campaign');
      }
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl font-black text-text-primary flex items-center space-x-2">
            <Bell className="w-6 h-6 text-accent" />
            <span>Push Notification Center</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Compose and broadcast push notifications immediately or schedule them for Tennessee/SSC batches.
          </p>
        </div>
        <RefreshButton onRefresh={handleRefresh} isRefetching={isRefetching} />
      </div>



      {/* Main Grid split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Notification Composer */}
        <div className="lg:col-span-5 bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center space-x-2 border-b border-border/60 pb-3">
            <FileText className="w-5 h-5 text-accent" />
            <span>Compose Notification</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title input */}
            <div>
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider mb-1.5">
                Notification Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. TNPSC Group 2 Mock Test Published!"
                className="w-full px-4 py-2.5 rounded-xl border border-border/90 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm text-text-primary bg-cardBg"
              />
            </div>

            {/* Message Body input */}
            <div>
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider mb-1.5">
                Message Body *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Compose message description here..."
                className="w-full px-4 py-2.5 rounded-xl border border-border/90 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm text-text-primary bg-cardBg"
              />
            </div>

            {/* Optional PDF File Attachment */}
            <div>
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider mb-1.5">
                Attach PDF Document (Optional, Max 20MB)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 20 * 1024 * 1024) {
                      toast.error('PDF file size must not exceed 20MB.');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      return;
                    }
                    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
                      toast.error('Only PDF documents are allowed.');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      return;
                    }
                    setPdfFile(file);
                  }
                }}
              />

              {!pdfFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-border/90 hover:border-accent hover:bg-accent/5 text-text-secondary hover:text-accent text-xs font-bold transition-all flex items-center justify-center space-x-2"
                >
                  <Paperclip className="w-4 h-4" />
                  <span>Choose PDF Document to Attach</span>
                </button>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-accent/10 border border-accent/30 rounded-xl">
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-xs font-bold text-text-primary truncate">
                      {pdfFile.name}
                    </span>
                    <span className="text-[10px] text-text-secondary shrink-0">
                      ({(pdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 hover:bg-accent/20 rounded-lg text-text-secondary hover:text-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Targeting Option Selection */}
            <div>
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider mb-2">
                Target Audience Group
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['ALL', 'COURSE', 'BATCH', 'INDIVIDUAL'] as const).map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => {
                      setTargetGroup(group);
                      setTargetValue('');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center space-y-1 ${targetGroup === group
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'border-border/95 text-text-secondary hover:bg-background-end/40'
                      }`}
                  >
                    {group === 'ALL' && <Users className="w-4 h-4" />}
                    {group === 'COURSE' && <GraduationCap className="w-4 h-4" />}
                    {group === 'BATCH' && <Calendar className="w-4 h-4" />}
                    {group === 'INDIVIDUAL' && <User className="w-4 h-4" />}
                    <span>{group === 'ALL' ? 'All Students' : group === 'COURSE' ? 'Course-wise' : group === 'BATCH' ? 'Batch-wise' : 'Individual'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Value Input Dropdowns */}
            {targetGroup === 'BATCH' && (
              <div>
                <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider mb-1.5">
                  Select Target Batch *
                </label>
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border/90 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm bg-cardBg text-text-primary font-semibold"
                >
                  <option value="">-- Choose Batch --</option>
                  {BATCH_TYPE_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Value Input Dropdowns */}
            {targetGroup === 'COURSE' && (
              <div>
                <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider mb-1.5">
                  Select Target Course *
                </label>
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border/90 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm bg-cardBg text-text-primary"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.length === 0 ? (
                    <option value="" disabled>No active courses available</option>
                  ) : (
                    (Array.isArray(courses) ? courses : []).map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {targetGroup === 'INDIVIDUAL' && (
              <div>
                <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider mb-1.5">
                  Select Student Recipient
                </label>
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border/90 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm bg-cardBg text-text-primary"
                >
                  <option value="">-- Choose Student --</option>
                  {(Array.isArray(students) ? students : []).map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scheduling Config */}
            <div className="border-t border-border/70 pt-4 space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 rounded text-accent focus:ring-accent border-border/90"
                />
                <span className="text-sm font-bold text-text-primary">Schedule for Future Delivery</span>
              </label>

              {isScheduled && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider mb-1.5">
                    Delivery Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/90 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm bg-cardBg text-text-primary"
                  />
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-3 bg-accent text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 disabled:opacity-60"
            >
              {isScheduled ? <Calendar className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              <span>{submitLoading ? 'Processing...' : isScheduled ? 'Schedule Campaign' : 'Broadcast Now'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Campaigns & Scheduled list logs */}
        <div className="lg:col-span-7 bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col h-full">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center space-x-2 border-b border-border/60 pb-3">
            <Clock className="w-5 h-5 text-accent" />
            <span>Campaign Log & Queue</span>
          </h2>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <Bell className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm text-text-secondary font-medium">No notification campaigns created yet.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/75 text-xs text-text-secondary font-extrabold uppercase tracking-wider">
                    <th className="pb-3 pr-2">Campaign Details</th>
                    <th className="pb-3 px-2">Target</th>
                    <th className="pb-3 px-2">Scheduled / Sent At</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 pl-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {(Array.isArray(campaigns) ? campaigns : []).map((camp) => (
                    <tr key={camp.id} className="hover:bg-background-end/40 transition-colors">
                      <td className="py-3.5 pr-2 max-w-xs">
                        <p className="font-bold text-text-primary truncate">{camp.title}</p>
                        <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{camp.body}</p>
                        {camp.pdfUrl && (
                          <a
                            href={camp.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[11px] font-bold text-accent hover:underline mt-1.5 bg-accent/10 px-2 py-0.5 rounded-md"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>View Attached PDF</span>
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-secondary-container text-text-primary capitalize">
                          {camp.targetGroup === 'BATCH'
                            ? `Batch: ${camp.targetValue || 'All'}`
                            : camp.targetGroup === 'COURSE'
                            ? 'Course'
                            : camp.targetGroup.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-xs text-text-secondary font-medium whitespace-nowrap">
                        {new Date(camp.scheduledAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-2 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${camp.status === 'SENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : camp.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-250 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-amber-50 text-amber-700 border border-amber-250 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}>
                          <span>{camp.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 pl-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(camp)}
                            title="Edit Campaign"
                            className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-secondary transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingCampaign(camp);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete Campaign"
                            className="p-1.5 rounded-lg text-text-secondary hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Campaign Modal */}
      {isEditModalOpen && editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    Edit Notification Campaign
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${editingCampaign.status === 'SENT'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                      {editingCampaign.status}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {editingCampaign.status === 'PENDING' ? 'Scheduled Broadcast' : 'Delivered Announcement'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCampaign(null);
                }}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={(e) => handleEditSubmit(e, false)} className="p-6 space-y-4">
              {/* Notice for SENT vs PENDING */}
              {editingCampaign.status === 'SENT' ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    This notification has already been broadcasted. Editing will update the announcement text in students' <strong>In-App Notification Center</strong>.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    This notification is scheduled. You can update the content, target audience, reschedule the time, or send it immediately.
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Notification Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Notification title..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background-end rounded-xl border border-border/80 text-sm focus:outline-none focus:border-accent text-text-primary"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Message Body <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Notification body..."
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background-end rounded-xl border border-border/80 text-sm focus:outline-none focus:border-accent text-text-primary resize-none"
                />
              </div>

              {/* Target Audience (only editable if PENDING) */}
              {editingCampaign.status === 'PENDING' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Target Audience
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditTargetGroup('ALL');
                          setEditTargetValue('');
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${editTargetGroup === 'ALL'
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'border-border/80 text-text-secondary hover:border-border'
                          }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>All Students</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditTargetGroup('COURSE');
                          setEditTargetValue('');
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${editTargetGroup === 'COURSE'
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'border-border/80 text-text-secondary hover:border-border'
                          }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Course</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditTargetGroup('BATCH');
                          setEditTargetValue('');
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${editTargetGroup === 'BATCH'
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'border-border/80 text-text-secondary hover:border-border'
                          }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Batch</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditTargetGroup('INDIVIDUAL');
                          setEditTargetValue('');
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${editTargetGroup === 'INDIVIDUAL'
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'border-border/80 text-text-secondary hover:border-border'
                          }`}
                      >
                        <User className="w-4 h-4" />
                        <span>Single Student</span>
                      </button>
                    </div>
                  </div>

                  {editTargetGroup === 'BATCH' && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        Select Batch
                      </label>
                      <select
                        value={editTargetValue}
                        onChange={(e) => setEditTargetValue(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background-end rounded-xl border border-border/80 text-sm focus:outline-none focus:border-accent text-text-primary font-semibold"
                      >
                        <option value="">-- Choose a batch --</option>
                        {BATCH_TYPE_OPTIONS.map((b) => (
                          <option key={b.value} value={b.value}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {editTargetGroup === 'COURSE' && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        Select Course
                      </label>
                      <select
                        value={editTargetValue}
                        onChange={(e) => setEditTargetValue(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background-end rounded-xl border border-border/80 text-sm focus:outline-none focus:border-accent text-text-primary"
                      >
                        <option value="">-- Choose a course --</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {editTargetGroup === 'INDIVIDUAL' && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        Select Student
                      </label>
                      <select
                        value={editTargetValue}
                        onChange={(e) => setEditTargetValue(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background-end rounded-xl border border-border/80 text-sm focus:outline-none focus:border-accent text-text-primary"
                      >
                        <option value="">-- Choose a student --</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name} ({student.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Reschedule Date & Time */}
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                      Scheduled Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editScheduledAt}
                      onChange={(e) => setEditScheduledAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background-end rounded-xl border border-border/80 text-sm focus:outline-none focus:border-accent text-text-primary"
                    />
                  </div>
                </>
              )}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCampaign(null);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-secondary rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {editingCampaign.status === 'PENDING' && (
                    <button
                      type="button"
                      disabled={editSubmitLoading}
                      onClick={(e) => handleEditSubmit(e, true)}
                      className="px-4 py-2.5 bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Now</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={editSubmitLoading}
                    className="px-5 py-2.5 bg-accent text-white hover:bg-accent-onContainer text-xs font-bold rounded-xl shadow-md shadow-accent/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {editSubmitLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Campaign Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCampaign(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Notification Campaign"
        message={`Are you sure you want to delete "${deletingCampaign?.title || 'this campaign'}"? This action cannot be undone.`}
        confirmText="Delete Campaign"
        isLoading={deleteLoading}
        type="danger"
      />
    </div>
  );
}
