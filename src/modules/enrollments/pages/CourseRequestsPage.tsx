import { useState } from 'react';
import { useEnrollmentRequests, useProcessEnrollmentRequest } from '../../../core/api/endpoints';
import type { EnrollmentRequest } from '../../../core/types';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Loader2,
  AlertCircle,
  Filter,
  UserCheck,
  BookOpen
} from 'lucide-react';

export default function CourseRequestsPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const statusFilter = activeTab === 'ALL' ? undefined : activeTab;
  const { data: requests = [], isLoading, isError, error } = useEnrollmentRequests(statusFilter);
  const processMutation = useProcessEnrollmentRequest();

  const filteredRequests = requests.filter((req) => {
    const studentName = req.student?.name?.toLowerCase() || '';
    const studentEmail = req.student?.email?.toLowerCase() || '';
    const courseTitle = req.course?.title?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return studentName.includes(search) || studentEmail.includes(search) || courseTitle.includes(search);
  });

  const handleOpenActionModal = (request: EnrollmentRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNote('');
  };

  const handleConfirmAction = () => {
    if (!selectedRequest || !actionType) return;
    processMutation.mutate(
      {
        id: selectedRequest.id,
        action: actionType,
        adminNote: adminNote.trim() ? adminNote.trim() : undefined,
      },
      {
        onSuccess: () => {
          setSelectedRequest(null);
          setActionType(null);
          setAdminNote('');
        },
      }
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-accent" />
            Course Access Requests
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Review and approve student course purchase and enrollment requests
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-cardBg p-4 rounded-xl border border-border shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 bg-background-start p-1 rounded-lg border border-border">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === tab
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-cardBg/50'
              }`}
            >
              {tab === 'ALL' ? 'All Requests' : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by student or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-background-start border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-cardBg rounded-xl border border-border">
          <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
          <p className="text-xs text-text-secondary">Loading requests...</p>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">{(error as any)?.message || 'Failed to load requests'}</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-cardBg rounded-xl border border-border text-center">
          <Filter className="w-10 h-10 text-text-secondary/40 mb-3" />
          <p className="text-sm font-semibold text-text-primary">No requests found</p>
          <p className="text-xs text-text-secondary mt-1">There are no {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} requests matching your filter.</p>
        </div>
      ) : (
        <div className="bg-cardBg rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-primary">
              <thead className="bg-background-start border-b border-border text-text-secondary font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Course</th>
                  <th className="px-6 py-3.5">Requested Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-background-start/50 transition-colors">
                    {/* Student */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{req.student?.name || 'Unknown Student'}</div>
                      <div className="text-text-secondary text-[11px] mt-0.5">{req.student?.email || '-'}</div>
                    </td>

                    {/* Course */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {req.course?.thumbnail ? (
                          <img
                            src={req.course.thumbnail}
                            alt=""
                            className="w-10 h-7 object-cover rounded border border-border"
                          />
                        ) : (
                          <div className="w-10 h-7 bg-background-start border border-border rounded flex items-center justify-center text-text-secondary">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-medium">{req.course?.title || 'Unknown Course'}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-text-secondary">
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {req.status === 'PENDING' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenActionModal(req, 'approve')}
                            className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(req, 'reject')}
                            className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-text-secondary text-xs italic">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve / Reject Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-cardBg border border-border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Approve Course Request
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-500" />
                  Reject Course Request
                </>
              )}
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed">
              {actionType === 'approve'
                ? `Approving this request will immediately enroll ${selectedRequest.student?.name || 'the student'} into "${selectedRequest.course?.title || 'the course'}".`
                : `Are you sure you want to reject ${selectedRequest.student?.name || 'the student'}'s request for "${selectedRequest.course?.title || 'the course'}"?`}
            </p>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Admin Note (Optional)
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Enter note or reason..."
                className="w-full p-2.5 text-xs bg-background-start border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                disabled={processMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary bg-background-start border border-border rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={processMutation.isPending}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg flex items-center transition-colors shadow-sm ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {processMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
