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
  Paperclip,
  X
} from 'lucide-react';
import RefreshButton from '../../../shared/components/RefreshButton';
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

export default function NotificationsPage() {
  const toast = useToast();
  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [targetGroup, setTargetGroup] = useState<'ALL' | 'COURSE' | 'INDIVIDUAL'>('ALL');
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
              <div className="grid grid-cols-3 gap-2">
                {(['ALL', 'COURSE', 'INDIVIDUAL'] as const).map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => {
                      setTargetGroup(group);
                      setTargetValue('');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center space-y-1 ${
                      targetGroup === group
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'border-border/95 text-text-secondary hover:bg-background-end/40'
                    }`}
                  >
                    {group === 'ALL' && <Users className="w-4 h-4" />}
                    {group === 'COURSE' && <GraduationCap className="w-4 h-4" />}
                    {group === 'INDIVIDUAL' && <User className="w-4 h-4" />}
                    <span>{group === 'ALL' ? 'All Students' : group === 'COURSE' ? 'Course-wise' : 'Individual'}</span>
                  </button>
                ))}
              </div>
            </div>

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
                    <th className="pb-3 pl-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {(Array.isArray(campaigns) ? campaigns : []).map((camp) => (
                    <tr key={camp.id} className="hover:bg-background-end/40 transition-colors">
                      <td className="py-3.5 pr-2">
                        <p className="font-bold text-text-primary">{camp.title}</p>
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
                      <td className="py-3.5 px-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-secondary-container text-text-primary capitalize">
                          {camp.targetGroup === 'COURSE' || camp.targetGroup === 'BATCH' ? 'Course' : camp.targetGroup.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-xs text-text-secondary font-medium">
                        {new Date(camp.scheduledAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 pl-2 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${
                          camp.status === 'SENT' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' 
                            : camp.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-250'
                            : 'bg-amber-50 text-amber-700 border border-amber-250'
                        }`}>
                          <span>{camp.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
