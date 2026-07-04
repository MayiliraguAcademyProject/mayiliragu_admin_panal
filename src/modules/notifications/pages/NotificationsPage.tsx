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
  CheckCircle, 
  AlertCircle,
  FileText,
  GraduationCap
} from 'lucide-react';

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
  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetGroup, setTargetGroup] = useState<'ALL' | 'BATCH' | 'INDIVIDUAL'>('ALL');
  const [targetValue, setTargetValue] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  // Data State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      if (response.data?.status === 'success') {
        setCampaigns(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get(ApiConstants.courses.base);
      // Backend list course response might wrap inside data or data.courses
      const courseList = response.data?.data || response.data || [];
      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get(ApiConstants.students.base);
      const studentList = response.data?.data || response.data || [];
      setStudents(Array.isArray(studentList) ? studentList : []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Title and Message Body are required.' });
      return;
    }

    if (targetGroup !== 'ALL' && !targetValue) {
      setMessage({ type: 'error', text: `Please select a target ${targetGroup.toLowerCase()}.` });
      return;
    }

    if (isScheduled && !scheduledAt) {
      setMessage({ type: 'error', text: 'Please select a scheduled date and time.' });
      return;
    }

    setSubmitLoading(true);
    setMessage(null);

    try {
      let response;
      if (isScheduled) {
        response = await apiClient.post(ApiConstants.notifications.campaigns, {
          title,
          body,
          targetGroup,
          targetValue: targetGroup === 'ALL' ? null : targetValue,
          scheduledAt: new Date(scheduledAt).toISOString(),
        });
      } else {
        response = await apiClient.post(ApiConstants.notifications.sendImmediate, {
          title,
          body,
          targetGroup,
          targetValue: targetGroup === 'ALL' ? null : targetValue,
        });
      }

      if (response.data?.status === 'success') {
        setMessage({
          type: 'success',
          text: isScheduled 
            ? 'Campaign scheduled successfully!' 
            : 'Push notifications dispatched successfully!'
        });
        // Reset form
        setTitle('');
        setBody('');
        setTargetValue('');
        setIsScheduled(false);
        setScheduledAt('');
        fetchCampaigns();
      } else {
        setMessage({ type: 'error', text: response.data?.message || 'Something went wrong.' });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to process push notification request.' 
      });
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
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

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

            {/* Targeting Option Selection */}
            <div>
              <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider mb-2">
                Target Audience Group
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ALL', 'BATCH', 'INDIVIDUAL'] as const).map((group) => (
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
                    {group === 'BATCH' && <GraduationCap className="w-4 h-4" />}
                    {group === 'INDIVIDUAL' && <User className="w-4 h-4" />}
                    <span>{group === 'ALL' ? 'All Students' : group === 'BATCH' ? 'Batch-wise' : 'Individual'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Value Input Dropdowns */}
            {targetGroup === 'BATCH' && (
              <div>
                <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider mb-1.5">
                  Select Target Course/Batch
                </label>
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border/90 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm bg-cardBg text-text-primary"
                >
                  <option value="">-- Choose Course/Batch --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
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
                  {students.map((student) => (
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
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-background-end/40 transition-colors">
                      <td className="py-3.5 pr-2">
                        <p className="font-bold text-text-primary">{camp.title}</p>
                        <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{camp.body}</p>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-secondary-container text-text-primary capitalize">
                          {camp.targetGroup.toLowerCase()}
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
