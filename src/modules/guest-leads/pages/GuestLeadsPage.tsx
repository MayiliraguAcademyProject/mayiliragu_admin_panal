import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Globe,
  Building2,
  CheckCircle2,
  Search,
  RefreshCw,
  Download,
  Phone,
  MessageCircle,
  MapPin,
  BookOpen,
  Edit3,
  Trash2,
  X,
  Clock,
  Filter,
  Save,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../../../core/api/client';
import { useToast } from '../../../shared/context';

interface GuestLead {
  id: string;
  name: string;
  phoneNumber: string;
  place: string;
  targetCourse: string;
  studyMode: 'ONLINE' | 'OFFLINE';
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadStats {
  total: number;
  newLeads: number;
  contacted: number;
  converted: number;
  closed: number;
  online: number;
  offline: number;
}

export default function GuestLeadsPage() {
  const toast = useToast();
  const [leads, setLeads] = useState<GuestLead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    newLeads: 0,
    contacted: 0,
    converted: 0,
    closed: 0,
    online: 0,
    offline: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [studyModeFilter, setStudyModeFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Selected Lead for Notes / Edit Modal
  const [selectedLead, setSelectedLead] = useState<GuestLead | null>(null);
  const [editStatus, setEditStatus] = useState<GuestLead['status']>('NEW');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {
        page: currentPage,
        limit: 15,
      };

      if (search.trim()) params.search = search.trim();
      if (studyModeFilter !== 'ALL') params.studyMode = studyModeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await apiClient.get('/admin/guest-leads', { params });
      if (response.data?.data) {
        const resData = response.data.data;
        setLeads(resData.data || []);
        if (resData.meta) {
          setTotalPages(resData.meta.totalPages || 1);
          setTotalLeads(resData.meta.total || 0);
        }
        if (resData.stats) {
          setStats(resData.stats);
        }
      }
    } catch (error: any) {
      console.error('Failed to load guest leads:', error);
      toast.error('Failed to load guest inquiries');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, studyModeFilter, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (leadId: string, newStatus: GuestLead['status']) => {
    try {
      await apiClient.patch(`/admin/guest-leads/${leadId}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      fetchLeads();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    try {
      setIsSavingNotes(true);
      const response = await apiClient.patch(`/admin/guest-leads/${selectedLead.id}`, {
        status: editStatus,
        adminNotes: editNotes,
      });
      if (response.data?.data) {
        toast.success('Counselor notes updated');
        setSelectedLead(null);
        fetchLeads();
      }
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Are you sure you want to remove this guest inquiry?')) return;
    try {
      await apiClient.delete(`/admin/guest-leads/${leadId}`);
      toast.success('Lead deleted successfully');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (studyModeFilter !== 'ALL') params.studyMode = studyModeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await apiClient.get('/admin/guest-leads/export', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mayiliragu_guest_leads_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV Export downloaded successfully');
    } catch (error) {
      toast.error('Failed to export leads CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const openWhatsApp = (phone: string, name: string, course: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(
      `Vanakkam ${name}! This is Mayiliragu Academy regarding your inquiry for ${course}. How can we assist you today?`
    );
    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
  };

  const openEditModal = (lead: GuestLead) => {
    setSelectedLead(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.adminNotes || '');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Guest Inquiries & Leads</h1>
          <p className="text-sm text-text-secondary mt-1">
            Track, filter, and counsel potential students exploring Mayiliragu Academy courses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeads}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-text-secondary bg-surface hover:bg-surface-hover border border-border rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Inquiries</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{stats.total}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">New / Pending</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{stats.newLeads}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Online vs Offline</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-blue-600">{stats.online} <span className="text-xs font-normal text-text-secondary">Onl</span></span>
              <span className="text-gray-300">/</span>
              <span className="text-lg font-bold text-purple-600">{stats.offline} <span className="text-xs font-normal text-text-secondary">Off</span></span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Converted</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.converted}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by name, phone, place, course..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-surface text-sm text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Study Mode Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-text-secondary" />
            <select
              value={studyModeFilter}
              onChange={(e) => {
                setStudyModeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-surface text-xs font-medium text-text-primary border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
            >
              <option value="ALL">All Study Modes</option>
              <option value="ONLINE">🌐 Online Only</option>
              <option value="OFFLINE">🏛️ Offline Classroom</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-surface text-xs font-medium text-text-primary border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New Inquiries</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CONVERTED">Converted</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface/80 text-text-secondary text-xs uppercase font-semibold border-b border-border">
                <th className="py-3.5 px-4">Visitor / Student</th>
                <th className="py-3.5 px-4">Contact & Actions</th>
                <th className="py-3.5 px-4">Place</th>
                <th className="py-3.5 px-4">Target Course</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Counselor Notes</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-text-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                      <span>Loading guest inquiries...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-text-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-text-secondary opacity-40" />
                      <span className="font-medium">No guest inquiries found</span>
                      <p className="text-xs text-text-secondary">New submissions from mobile app guests will appear here automatically.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface/50 transition-colors">
                    {/* Visitor */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center">
                          {lead.name ? lead.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{lead.name}</p>
                          <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact & WhatsApp / Call Actions */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <p className="font-medium text-text-primary text-xs tracking-wide">{lead.phoneNumber}</p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openWhatsApp(lead.phoneNumber, lead.name, lead.targetCourse)}
                            title="Chat on WhatsApp"
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-xs font-medium rounded transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </button>
                          <a
                            href={`tel:${lead.phoneNumber}`}
                            title="Direct Phone Call"
                            className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-xs font-medium rounded transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Place */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-text-secondary text-xs">
                        <MapPin className="w-3.5 h-3.5 text-text-secondary opacity-70" />
                        <span>{lead.place || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Target Course */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600">
                        <BookOpen className="w-3 h-3" />
                        {lead.targetCourse || 'General'}
                      </span>
                    </td>

                    {/* Mode */}
                    <td className="py-3.5 px-4">
                      {lead.studyMode === 'ONLINE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600">
                          <Globe className="w-3 h-3" /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-600">
                          <Building2 className="w-3 h-3" /> Offline
                        </span>
                      )}
                    </td>

                    {/* Status Selector */}
                    <td className="py-3.5 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border border-border focus:outline-none ${
                          lead.status === 'NEW'
                            ? 'bg-amber-500/15 text-amber-700'
                            : lead.status === 'CONTACTED'
                            ? 'bg-blue-500/15 text-blue-700'
                            : lead.status === 'CONVERTED'
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : 'bg-gray-500/15 text-gray-700'
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openEditModal(lead)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-text-secondary hover:text-accent bg-surface hover:bg-surface-hover border border-border rounded transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        {lead.adminNotes ? 'View Notes' : '+ Add Note'}
                      </button>
                    </td>

                    {/* Delete Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-1 text-text-secondary hover:text-red-600 rounded transition-colors"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
          <p>
            Showing <span className="font-semibold text-text-primary">{leads.length}</span> of{' '}
            <span className="font-semibold text-text-primary">{totalLeads}</span> inquiries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1.5 rounded bg-surface border border-border hover:bg-surface-hover disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1.5 rounded bg-surface border border-border hover:bg-surface-hover disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Counselor Notes & Edit Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-text-primary text-base">Inquiry Details & Notes</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {selectedLead.name} &bull; {selectedLead.phoneNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 text-text-secondary hover:text-text-primary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-surface p-3 rounded-lg border border-border text-xs">
                <div>
                  <span className="text-text-secondary block">Place:</span>
                  <span className="font-semibold text-text-primary">{selectedLead.place || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Course Interest:</span>
                  <span className="font-semibold text-text-primary">{selectedLead.targetCourse || 'General'}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Study Mode:</span>
                  <span className="font-semibold text-text-primary">{selectedLead.studyMode}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Received On:</span>
                  <span className="font-semibold text-text-primary">
                    {new Date(selectedLead.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Follow-up Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="NEW">NEW - Pending Follow-up</option>
                  <option value="CONTACTED">CONTACTED - Call / WhatsApp Completed</option>
                  <option value="CONVERTED">CONVERTED - Enrolled as Student</option>
                  <option value="CLOSED">CLOSED - Not Interested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Counselor Remarks / Follow-up Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Record summary of conversation with student, batch preference, fee discussion, etc..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
                />
              </div>
            </div>

            <div className="p-4 bg-surface border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSavingNotes ? 'Saving...' : 'Save Remarks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
