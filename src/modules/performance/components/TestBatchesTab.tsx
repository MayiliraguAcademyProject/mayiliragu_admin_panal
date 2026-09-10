import { useState, useMemo } from 'react';
import {
  useTestBatchesList,
  useTestBatchDetail,
  useBatchEnrollments,
  useBatchOmrSubmissions,
} from '../../test-batches/services/test-batch-api';
import {
  Layers,
  FileCheck2,
  Users,
  Award,
  Download,
  Search,
  ExternalLink,
  BookOpen,
  ArrowUpDown,
  Loader2,
} from 'lucide-react';
import RefreshButton from '../../../shared/components/RefreshButton';
interface TestBatchesTabProps {
  onSelectStudent?: (studentName: string) => void;
}

export default function TestBatchesTab({ onSelectStudent }: TestBatchesTabProps = {}) {
  const {
    data: batches = [],
    isLoading: isBatchesLoading,
    refetch: refetchBatches,
    isRefetching: isRefetchingBatches,
  } = useTestBatchesList();

  // Selected test batch
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // Auto-select first batch if not selected
  const activeBatchId = selectedBatchId || (batches.length > 0 ? batches[0].id : '');
  const activeBatch = useMemo(() => batches.find(b => b.id === activeBatchId), [batches, activeBatchId]);

  // Queries for the active batch
  const {
    data: batchDetail,
    refetch: refetchBatchDetail,
  } = useTestBatchDetail(activeBatchId);

  const {
    data: enrollments = [],
    isLoading: isEnrollmentsLoading,
    refetch: refetchEnrollments,
  } = useBatchEnrollments(activeBatchId);

  const {
    data: omrSubmissions = [],
    isLoading: isOmrLoading,
    refetch: refetchOmr,
    isRefetching: isRefetchingOmr,
  } = useBatchOmrSubmissions(activeBatchId);

  // Filters for OMR submissions
  const [omrSearch, setOmrSearch] = useState('');
  const [selectedPaperFilter, setSelectedPaperFilter] = useState('All Papers');
  const [omrSortBy, setOmrSortBy] = useState<'marks-desc' | 'marks-asc' | 'date-desc' | 'name-asc'>('marks-desc');

  // Unique papers in this batch (from both batch detail structure and submissions)
  const uniquePapers = useMemo(() => {
    const titles = new Set<string>();
    if (batchDetail?.categories) {
      for (const cat of batchDetail.categories) {
        if (cat.questionPapers) {
          for (const p of cat.questionPapers) {
            if (p.title) titles.add(p.title);
          }
        }
      }
    }
    for (const s of omrSubmissions) {
      const title = s.paperTitle || s.paper?.title;
      if (title) titles.add(title);
    }
    return Array.from(titles).sort();
  }, [batchDetail, omrSubmissions]);

  // Total papers count
  const totalPapersCount = useMemo(() => {
    if (batchDetail?.categories) {
      const count = batchDetail.categories.reduce((acc, cat) => acc + (cat.questionPapers?.length || 0), 0);
      if (count > 0) return count;
    }
    if (activeBatch?.totalQuestionPapers !== undefined && activeBatch.totalQuestionPapers > 0) {
      return activeBatch.totalQuestionPapers;
    }
    return uniquePapers.length;
  }, [batchDetail, activeBatch, uniquePapers]);

  // Process and sort OMR submissions with rank
  const rankedSubmissions = useMemo(() => {
    const list = omrSubmissions.filter(sub => {
      const paperName = sub.paperTitle || sub.paper?.title || '';
      if (selectedPaperFilter !== 'All Papers' && paperName !== selectedPaperFilter) {
        return false;
      }
      if (omrSearch.trim()) {
        const q = omrSearch.toLowerCase();
        const studentName = (sub.studentName || sub.student?.name || sub.student?.fullName || '').toLowerCase();
        const studentEmail = (sub.studentEmail || sub.student?.email || '').toLowerCase();
        const categoryName = (sub.categoryName || '').toLowerCase();
        if (
          !studentName.includes(q) &&
          !studentEmail.includes(q) &&
          !paperName.toLowerCase().includes(q) &&
          !categoryName.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const marksA = a.totalMarks !== null && a.totalMarks !== undefined ? a.totalMarks : -1;
      const marksB = b.totalMarks !== null && b.totalMarks !== undefined ? b.totalMarks : -1;

      if (omrSortBy === 'marks-desc') return marksB - marksA;
      if (omrSortBy === 'marks-asc') return marksA - marksB;
      if (omrSortBy === 'date-desc') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      if (omrSortBy === 'name-asc') {
        const nameA = a.studentName || a.student?.name || '';
        const nameB = b.studentName || b.student?.name || '';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
  }, [omrSubmissions, selectedPaperFilter, omrSearch, omrSortBy]);

  // Batch stats summary
  const batchStats = useMemo(() => {
    const totalEnrolled = enrollments.length;
    const totalSubmissions = omrSubmissions.length;
    const scoredSubmissions = omrSubmissions.filter(s => s.totalMarks !== null && s.totalMarks !== undefined);
    const avgScore = scoredSubmissions.length > 0
      ? Math.round(scoredSubmissions.reduce((sum, s) => sum + (s.totalMarks || 0), 0) / scoredSubmissions.length)
      : 0;
    const topScore = scoredSubmissions.length > 0
      ? Math.max(...scoredSubmissions.map(s => s.totalMarks || 0))
      : 0;

    return { totalEnrolled, totalSubmissions, avgScore, topScore };
  }, [enrollments, omrSubmissions]);

  const handleRefreshAll = () => {
    refetchBatches();
    if (activeBatchId) {
      refetchBatchDetail();
      refetchEnrollments();
      refetchOmr();
    }
  };

  const handleExportBatchCSV = () => {
    if (rankedSubmissions.length === 0) return;
    const headers = ['Rank', 'Student Name', 'Student Email', 'Question Paper', 'Category', 'Marks Scored', 'Submitted Date'];
    const rows = rankedSubmissions.map((s, idx) => [
      idx + 1,
      `"${(s.studentName || s.student?.name || 'Student').replace(/"/g, '""')}"`,
      `"${(s.studentEmail || s.student?.email || '').replace(/"/g, '""')}"`,
      `"${(s.paperTitle || s.paper?.title || 'Question Paper').replace(/"/g, '""')}"`,
      `"${(s.categoryName || '').replace(/"/g, '""')}"`,
      s.totalMarks !== null && s.totalMarks !== undefined ? s.totalMarks : 'Ungraded',
      `"${new Date(s.submittedAt).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const cleanTitle = (activeBatch?.title || 'batch').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `test_batch_${cleanTitle}_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isLoading = isBatchesLoading || isEnrollmentsLoading || isOmrLoading;

  return (
    <div className="space-y-8 animate-fade-in text-text-primary">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" /> Test Batches & Cohort Performance
          </h2>
          <p className="text-xs text-text-secondary mt-0.5 font-medium">
            Monitor dedicated test batch enrollments, OMR test scores, marksheets, and compare academic cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportBatchCSV}
            disabled={rankedSubmissions.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white hover:bg-slate-50 text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-text-primary"
            title="Download Test Batch Marksheet as CSV"
          >
            <Download className="w-4 h-4 text-accent" />
            <span>Export Batch CSV</span>
          </button>
          <RefreshButton onRefresh={handleRefreshAll} isRefetching={isRefetchingBatches || isRefetchingOmr} />
        </div>
      </div>

      {/* Academic Cohort Comparisons Section (Commented out per request) */}
      {/*
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-accent" /> Academic Cohorts Comparison
          </h3>
          <span className="text-[11px] text-text-secondary font-semibold">Active Student Cohorts</span>
        </div>

        {isCohortsLoading ? (
          <div className="p-6 rounded-2xl bg-cardBg border border-border flex items-center justify-center gap-2 text-xs text-text-secondary font-bold">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span>Loading cohort metrics...</span>
          </div>
        ) : cohortComparisons.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {['REGULAR', 'WEEKEND', 'EVENING', 'TESTBATCH'].map(batchName => (
              <div key={batchName} className="p-4 rounded-2xl bg-cardBg border border-border space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-text-primary">{batchName} Batch</span>
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                </div>
                <div className="text-2xl font-black text-text-primary">--%</div>
                <div className="text-[10px] text-text-secondary font-semibold">Average Readiness Score</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cohortComparisons.map(item => (
              <div
                key={item.batch}
                className="p-5 rounded-2xl bg-cardBg border border-border space-y-3 shadow-sm hover:border-accent/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-text-primary tracking-wide">{item.batch} Batch</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                    <Users className="w-3 h-3" /> {item.studentCount} Students
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-text-primary">{item.averageReadiness}%</span>
                    <span className="text-xs font-bold text-accent flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Readiness
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-accent h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(item.averageReadiness, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-text-secondary font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-text-secondary/70" /> Avg Study Hours:
                  </span>
                  <strong className="text-text-primary font-black">{item.averageStudyHours} hrs/day</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      */}

      {/* Dedicated Test Batch Selector & Detail */}
      <div className="bg-cardBg border border-border p-6 rounded-3xl space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-accent">Selected Test Batch</span>
            <div className="flex items-center gap-3">
              <select
                value={activeBatchId}
                onChange={e => {
                  setSelectedBatchId(e.target.value);
                  setSelectedPaperFilter('All Papers');
                }}
                disabled={batches.length === 0}
                className="px-4 py-2.5 border rounded-2xl text-sm font-extrabold bg-white border-border focus:ring-2 focus:ring-accent outline-none text-text-primary cursor-pointer max-w-sm"
              >
                {batches.length === 0 && <option>No Test Batches Available</option>}
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.targetCategory || 'TNPSC'})
                  </option>
                ))}
              </select>
              {activeBatch && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-text-secondary">
                  {activeBatch.targetCategory}
                </span>
              )}
            </div>
          </div>

          {activeBatch?.description && (
            <p className="text-xs text-text-secondary max-w-md line-clamp-2">
              {activeBatch.description}
            </p>
          )}
        </div>

        {/* Batch Overview KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-border bg-slate-50 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Enrolled Students</div>
              <div className="text-xl font-black text-text-primary mt-0.5">{batchStats.totalEnrolled}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-slate-50 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Papers in Batch</div>
              <div className="text-xl font-black text-text-primary mt-0.5">{totalPapersCount}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-slate-50 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">OMR Submissions</div>
              <div className="text-xl font-black text-text-primary mt-0.5">{batchStats.totalSubmissions}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-slate-50 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Avg Batch Marks</div>
              <div className="text-xl font-black text-text-primary mt-0.5">
                {batchStats.avgScore} <span className="text-xs text-text-secondary font-bold">(Top: {batchStats.topScore})</span>
              </div>
            </div>
          </div>
        </div>

        {/* OMR Results and Submissions Table Toolbar */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search student or paper in this batch..."
                value={omrSearch}
                onChange={e => setOmrSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs font-semibold bg-white border-border focus:ring-2 focus:ring-accent outline-none text-text-primary"
              />
            </div>

            <div className="flex items-center gap-2.5">
              {/* Paper Filter */}
              <select
                value={selectedPaperFilter}
                onChange={e => setSelectedPaperFilter(e.target.value)}
                className="px-3 py-2 border rounded-xl text-xs font-bold bg-white border-border focus:ring-2 focus:ring-accent outline-none text-text-primary cursor-pointer max-w-[200px] truncate"
              >
                <option value="All Papers">All Papers ({uniquePapers.length})</option>
                {uniquePapers.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {/* Sort by */}
              <div className="flex items-center gap-1 bg-white border border-border rounded-xl px-2.5 py-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-text-secondary" />
                <select
                  value={omrSortBy}
                  onChange={e => setOmrSortBy(e.target.value as any)}
                  className="text-xs font-bold bg-transparent outline-none text-text-primary cursor-pointer border-none py-1"
                >
                  <option value="marks-desc">Marks: High to Low</option>
                  <option value="marks-asc">Marks: Low to High</option>
                  <option value="date-desc">Submitted: Newest First</option>
                  <option value="name-asc">Student: Name A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* OMR Submissions Table */}
          {isLoading ? (
            <div className="p-12 text-center bg-slate-50 border border-border rounded-2xl flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
              <span className="text-xs font-bold text-text-secondary">Loading batch test submissions...</span>
            </div>
          ) : rankedSubmissions.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-dashed border-border rounded-2xl space-y-2">
              <FileCheck2 className="w-8 h-8 text-text-secondary/60 mx-auto" />
              <h4 className="text-xs font-black text-text-primary">No Test Batch Submissions Found</h4>
              <p className="text-[11px] text-text-secondary max-w-sm mx-auto">
                {omrSubmissions.length === 0
                  ? 'No students have submitted OMR answer sheets for this test batch yet.'
                  : 'No submissions match your search query or paper filter.'}
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                      <th className="p-3.5 text-center w-14">Rank</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Question Paper</th>
                      <th className="p-3.5">Total Marks</th>
                      <th className="p-3.5">OMR Sheet</th>
                      <th className="p-3.5">Submitted At</th>
                      <th className="p-3.5 text-center">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {rankedSubmissions.map((sub, idx) => {
                      const studentName = sub.studentName || sub.student?.name || sub.student?.fullName || 'Student';
                      const studentEmail = sub.studentEmail || sub.student?.email || '';
                      const paperTitle = sub.paperTitle || sub.paper?.title || 'Question Paper';
                      const categoryName = sub.categoryName || '';

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5 text-center font-black">
                            {idx === 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs">
                                🥇
                              </span>
                            ) : idx === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 border border-slate-300 text-xs">
                                🥈
                              </span>
                            ) : idx === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs">
                                🥉
                              </span>
                            ) : (
                              <span className="text-text-secondary font-bold">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div
                              className={`font-extrabold text-text-primary text-sm ${
                                onSelectStudent ? 'cursor-pointer hover:text-accent hover:underline' : ''
                              }`}
                              onClick={() => onSelectStudent && onSelectStudent(studentName)}
                              title={onSelectStudent ? 'View student performance dossier' : undefined}
                            >
                              {studentName}
                            </div>
                            {studentEmail && <div className="text-[11px] text-text-secondary">{studentEmail}</div>}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-text-primary max-w-[240px] truncate" title={paperTitle}>
                              {paperTitle}
                            </div>
                            {categoryName && (
                              <div className="text-[10px] text-text-secondary font-medium truncate max-w-[240px]" title={categoryName}>
                                {categoryName}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            {sub.totalMarks !== null && sub.totalMarks !== undefined ? (
                              <span className="font-black text-sm text-text-primary bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                {sub.totalMarks} Marks
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Ungraded
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {sub.omrFileUrl ? (
                              <a
                                href={sub.omrFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-border text-xs font-bold text-accent hover:bg-orange-50 transition-all shadow-sm"
                              >
                                <span>View OMR</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-text-secondary text-[11px]">No file</span>
                            )}
                          </td>
                          <td className="p-3.5 text-text-secondary text-[11px]">
                            {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-3.5 text-center">
                            {onSelectStudent && (
                              <button
                                onClick={() => onSelectStudent(studentName)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-white hover:bg-orange-50 hover:border-accent/60 text-accent font-bold text-xs transition-all shadow-sm"
                                title="Open Student Report Card"
                              >
                                <Users className="w-3 h-3" />
                                <span>Dossier</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
