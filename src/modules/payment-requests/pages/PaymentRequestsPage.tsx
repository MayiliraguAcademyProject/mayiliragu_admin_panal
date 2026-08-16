import { useState } from 'react';
import { useListPaymentRequests, useProcessPaymentRequest } from '../../../core/api/endpoints';
import type { PaymentRequest } from '../../../core/types';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Loader2,
  AlertCircle,
  Filter,
  CreditCard,
  Eye,
  Calendar,
  IndianRupee,
  Check,
  X
} from 'lucide-react';
import RefreshButton from '../../../shared/components/RefreshButton';

import { useToast } from '../../../shared/context';
import { extractErrorMessage } from '../../../shared/utils';

export default function PaymentRequestsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const statusFilter = activeTab === 'ALL' ? undefined : activeTab;
  const { data: requests = [], isLoading, isError, error, refetch, isRefetching } = useListPaymentRequests(statusFilter);
  const processMutation = useProcessPaymentRequest();

  const filteredRequests = requests.filter((req) => {
    const studentName = req.student?.name?.toLowerCase() || '';
    const studentEmail = req.student?.email?.toLowerCase() || '';
    const linkType = req.linkType?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return studentName.includes(search) || studentEmail.includes(search) || linkType.includes(search) || req.linkId.includes(search);
  });

  const handleOpenActionModal = (request: PaymentRequest, action: 'approve' | 'reject') => {
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
        onSuccess: (res: any) => {
          toast.success(res?.message || `Payment request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`);
          setSelectedRequest(null);
          setActionType(null);
          setAdminNote('');
        },
        onError: (err: any) => {
          toast.error(extractErrorMessage(err));
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
            <CreditCard className="w-7 h-7 text-accent" />
            QR Payment Verification
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Verify screenshot proofs and approve course or test batch enrollment access
          </p>
        </div>
        <RefreshButton onRefresh={refetch} isRefetching={isRefetching} />
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
            placeholder="Search by student or type..."
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
          <p className="text-xs text-text-secondary">Loading payment requests...</p>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">{(error as any)?.message || 'Failed to load requests'}</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-cardBg rounded-xl border border-border text-center">
          <Filter className="w-10 h-10 text-text-secondary/40 mb-3" />
          <p className="text-sm font-semibold text-text-primary">No payment requests found</p>
          <p className="text-xs text-text-secondary mt-1">There are no requests matching the selected status</p>
        </div>
      ) : (
        <div className="bg-cardBg rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-background-start text-[10px] font-black text-text-secondary uppercase tracking-wider">
                  <th className="p-4">Student</th>
                  <th className="p-4">Product Type</th>
                  <th className="p-4">Linked Item ID</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4 text-center">Receipt Proof</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-text-primary font-semibold">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/10 transition-colors">
                    <td className="p-4">
                      <div className="font-bold">{req.student?.name || 'Unknown Student'}</div>
                      <div className="text-[10px] text-text-secondary">{req.student?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide ${
                        req.linkType === 'COURSE' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {req.linkType}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-text-secondary select-all">
                      {req.linkId}
                    </td>
                    <td className="p-4 font-bold text-text-primary flex items-center space-x-0.5">
                      <IndianRupee className="w-3.5 h-3.5 text-text-secondary" />
                      <span>{req.amount}</span>
                    </td>
                    <td className="p-4 text-text-secondary">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {req.screenshotUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(req.screenshotUrl)}
                          className="inline-flex items-center space-x-1 text-xs text-accent hover:underline font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-text-secondary/60">No Image</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        {req.status === 'PENDING' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approved</span>
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-650 text-[10px] font-black uppercase tracking-wider">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenActionModal(req, 'approve')}
                            className="p-1.5 bg-green-500/10 hover:bg-green-500 text-green-600 hover:text-white rounded-lg transition-colors"
                            title="Approve & Enroll"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(req, 'reject')}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-650 hover:text-white rounded-lg transition-colors"
                            title="Reject Request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-text-secondary max-w-[150px] truncate" title={req.adminNote || undefined}>
                          {req.adminNote || <span className="italic text-text-secondary/40">No remarks</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl bg-cardBg border border-border/80 rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-black text-text-primary uppercase tracking-wider">UPI Transaction Proof Receipt</span>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="text-xs text-text-secondary hover:text-text-primary font-black"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              <img 
                src={previewImageUrl} 
                alt="Receipt Screenshot Preview" 
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Confirmation Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-cardBg border border-border/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                {actionType === 'approve' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                Confirm Payment {actionType === 'approve' ? 'Approval' : 'Rejection'}
              </h3>
              <p className="text-xs text-text-secondary mt-1 font-semibold">
                Are you sure you want to {actionType} this payment request? 
                {actionType === 'approve' && ' The student will be instantly enrolled.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                Admin Remarks (Optional)
              </label>
              <textarea
                placeholder="e.g. Transaction verified. / Screenshot unclear."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="w-full p-3 text-xs font-semibold rounded-xl border border-border outline-none focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20"
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
                className="px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={processMutation.isPending}
                className={`px-5 py-2 text-xs font-black text-white rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center space-x-1.5 ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-650 hover:bg-red-700'
                }`}
              >
                {processMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
