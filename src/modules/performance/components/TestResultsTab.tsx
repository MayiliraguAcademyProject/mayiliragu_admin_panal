import { useState, useMemo } from 'react';
import type { StudentTestAttempt } from '../../../core/types';
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Target,
  FileSpreadsheet,
  ArrowUpDown,
  X,
  Eye,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import RefreshButton from '../../../shared/components/RefreshButton';
import AttemptDetailsModal from './AttemptDetailsModal';

const BATCH_OPTIONS = [
  { label: 'All Batches', value: 'ALL' },
  { label: 'Regular', value: 'REGULAR' },
  { label: 'Weekend', value: 'WEEKEND' },
  { label: 'Evening', value: 'EVENING' },
 // { label: 'Test Batch', value: 'TESTBATCH' },
] as const;

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (mins < 60) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

function renderRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-black text-xs border border-amber-300 shadow-sm" title="Rank 1">
        🥇 1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-xs border border-slate-300 shadow-sm" title="Rank 2">
        🥈 2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-800 font-black text-xs border border-amber-200 shadow-sm" title="Rank 3">
        🥉 3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-100 text-text-secondary font-black text-xs">
      #{rank}
    </span>
  );
}

function downloadMarksSheetCSV(attempts: StudentTestAttempt[], testFilter: string) {
  const headers = [
    'Rank',
    'Student Name',
    'Student Email',
    'Test Title',
    'Marks Scored',
    'Total Marks',
    'Accuracy (%)',
    'Correct Answers',
    'Wrong Answers',
    'Skipped Answers',
    'Status',
    'Time Taken (Sec)',
    'Submission Date'
  ];

  const rows = attempts.map(a => [
    a.rank,
    `"${(a.studentName || '').replace(/"/g, '""')}"`,
    `"${(a.studentEmail || '').replace(/"/g, '""')}"`,
    `"${(a.testTitle || '').replace(/"/g, '""')}"`,
    a.totalScore,
    a.totalMarks,
    `${a.accuracy}%`,
    a.correct,
    a.wrong,
    a.skipped,
    a.passed ? 'PASSED' : 'FAILED',
    a.timeTaken,
    `"${new Date(a.createdAt).toLocaleString()}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanTestName = testFilter !== 'All Tests' ? `_${testFilter.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  link.setAttribute('download', `test_marks_sheet${cleanTestName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface TestResultsTabProps {
  attempts: StudentTestAttempt[];
  isLoading: boolean;
  refetch: () => void;
  isRefetching: boolean;
  selectedBatch: typeof BATCH_OPTIONS[number]['value'];
  onSelectBatch: (b: typeof BATCH_OPTIONS[number]['value']) => void;
  onSelectStudent?: (studentNameOrEmail: string) => void;
}

export default function TestResultsTab({
  attempts,
  isLoading,
  refetch,
  isRefetching,
  selectedBatch,
  onSelectBatch,
  onSelectStudent,
}: TestResultsTabProps) {
  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTest, setSelectedTest] = useState('All Tests');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'rank-asc' | 'score-desc' | 'score-asc' | 'date-desc' | 'date-asc'>('rank-asc');

  // Modal state
  const [selectedAttempt, setSelectedAttempt] = useState<StudentTestAttempt | null>(null);

  // Extract unique tests for dropdown
  const uniqueTests = useMemo(() => {
    const titles = Array.from(new Set(attempts.map(a => a.testTitle).filter(Boolean)));
    return titles.sort((a, b) => a.localeCompare(b));
  }, [attempts]);

  // Filtered and sorted attempts
  const filteredAttempts = useMemo(() => {
    return attempts
      .filter(att => {
        // Test filter
        if (selectedTest !== 'All Tests' && att.testTitle !== selectedTest) {
          return false;
        }
        // Status filter
        if (statusFilter === 'passed' && !att.passed) return false;
        if (statusFilter === 'failed' && att.passed) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (att.studentName || '').toLowerCase().includes(q);
          const matchEmail = (att.studentEmail || '').toLowerCase().includes(q);
          const matchTest = (att.testTitle || '').toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchTest) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rank-asc') return a.rank - b.rank;
        if (sortBy === 'score-desc') return b.totalScore - a.totalScore;
        if (sortBy === 'score-asc') return a.totalScore - b.totalScore;
        if (sortBy === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return 0;
      });
  }, [attempts, selectedTest, statusFilter, searchQuery, sortBy]);

  // Calculate summary KPIs from filtered attempts
  const stats = useMemo(() => {
    const total = filteredAttempts.length;
    if (total === 0) {
      return { totalAttempts: 0, avgAccuracy: 0, passRate: 0, uniqueTakers: 0 };
    }
    const avgAccuracy = Math.round(filteredAttempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / total);
    const passedCount = filteredAttempts.filter(a => a.passed).length;
    const passRate = Math.round((passedCount / total) * 100);
    const uniqueTakers = new Set(filteredAttempts.map(a => a.studentId || a.studentEmail)).size;
    return { totalAttempts: total, avgAccuracy, passRate, uniqueTakers };
  }, [filteredAttempts]);

  return (
    <div className="space-y-6 animate-fade-in text-text-primary">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-text-primary">
            Student Test Results & Marksheets
          </h2>
          <p className="text-xs text-text-secondary mt-0.5 font-medium">
            Review test submissions, student rankings, score distributions, and inspect detailed answer sheets.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadMarksSheetCSV(filteredAttempts, selectedTest)}
            disabled={filteredAttempts.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white hover:bg-slate-50 text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-text-primary"
            title="Download Filtered Results as CSV"
          >
            <Download className="w-4 h-4 text-accent" />
            <span>Export CSV</span>
          </button>
          <RefreshButton onRefresh={refetch} isRefetching={isRefetching} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cardBg border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider truncate">Total Attempts</div>
            <div className="text-2xl font-black mt-0.5">{stats.totalAttempts.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-cardBg border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider truncate">Average Accuracy</div>
            <div className="text-2xl font-black mt-0.5">{stats.avgAccuracy}%</div>
          </div>
        </div>

        <div className="bg-cardBg border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider truncate">Pass Rate</div>
            <div className="text-2xl font-black mt-0.5">{stats.passRate}%</div>
          </div>
        </div>

        <div className="bg-cardBg border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider truncate">Active Test Takers</div>
            <div className="text-2xl font-black mt-0.5">{stats.uniqueTakers.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-cardBg border border-border p-4 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs font-semibold bg-white border-border focus:ring-2 focus:ring-accent focus:border-accent outline-none text-text-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Test filter dropdown */}
            <select
              value={selectedTest}
              onChange={e => setSelectedTest(e.target.value)}
              className="px-3.5 py-2.5 border rounded-xl text-xs font-bold bg-white border-border focus:ring-2 focus:ring-accent outline-none text-text-primary cursor-pointer max-w-[220px] truncate"
            >
              <option value="All Tests">All Tests ({uniqueTests.length})</option>
              {uniqueTests.map(test => (
                <option key={test} value={test}>
                  {test}
                </option>
              ))}
            </select>

            {/* Sorting selector */}
            <div className="flex items-center gap-1 bg-white border border-border rounded-xl px-2.5 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-text-secondary" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-xs font-bold bg-transparent outline-none text-text-primary cursor-pointer border-none py-1"
              >
                <option value="rank-asc">Rank: 1st to Last</option>
                <option value="score-desc">Marks: High to Low</option>
                <option value="score-asc">Marks: Low to High</option>
                <option value="date-desc">Date: Newest First</option>
                <option value="date-asc">Date: Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Batch Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
          <span className="text-[11px] font-bold text-text-secondary mr-1">Batch:</span>
          {BATCH_OPTIONS.map(b => (
            <button
              key={b.value}
              onClick={() => {
                onSelectBatch(b.value);
                setSelectedTest('All Tests');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedBatch === b.value
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-text-secondary'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Status Filter Tabs & Result Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-text-secondary mr-1">Status:</span>
            {(['all', 'passed', 'failed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-text-secondary'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="text-xs text-text-secondary font-semibold">
            Showing <span className="font-extrabold text-text-primary">{filteredAttempts.length}</span> of {attempts.length} attempts
          </div>
        </div>
      </div>

      {/* Main Results Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-cardBg border border-border rounded-2xl">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-xs text-text-secondary font-semibold">Loading test attempts and marks...</p>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-cardBg space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-text-secondary flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-text-primary">No Test Attempts Found</h3>
          <p className="text-xs text-text-secondary font-medium max-w-sm mx-auto">
            {attempts.length === 0
              ? 'No students have completed test attempts yet. As soon as students take tests in the mobile app, their scores and ranks will appear here.'
              : 'No test attempts match your current filter and search criteria. Try adjusting your search query or filters.'}
          </p>
          {(searchQuery || selectedTest !== 'All Tests' || statusFilter !== 'all' || selectedBatch !== 'ALL') && (
            <button
              onClick={() => {
                onSelectBatch('ALL');
                setSearchQuery('');
                setSelectedTest('All Tests');
                setStatusFilter('all');
              }}
              className="mt-2 text-xs text-accent font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-cardBg border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                  <th className="p-4 text-center w-16">Rank</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Test Title</th>
                  <th className="p-4">Marks Scored</th>
                  <th className="p-4">Accuracy</th>
                  <th className="p-4">Breakdown</th>
                  <th className="p-4">Time Taken</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {filteredAttempts.map(att => (
                  <tr key={att.id} className="hover:bg-slate-50/50 transition-colors font-medium">
                    {/* Rank */}
                    <td className="p-4 text-center">{renderRankBadge(att.rank)}</td>

                    {/* Student */}
                    <td className="p-4">
                      <div
                        className={`font-extrabold text-text-primary ${
                          onSelectStudent ? 'cursor-pointer hover:text-accent hover:underline' : ''
                        }`}
                        onClick={() => onSelectStudent && onSelectStudent(att.studentName || att.studentEmail)}
                        title={onSelectStudent ? 'View student performance' : undefined}
                      >
                        {att.studentName || 'Student'}
                      </div>
                      <div className="text-[11px] text-text-secondary">{att.studentEmail}</div>
                    </td>

                    {/* Test Title */}
                    <td className="p-4 font-bold text-text-primary max-w-[200px] truncate" title={att.testTitle}>
                      {att.testTitle}
                    </td>

                    {/* Marks Scored */}
                    <td className="p-4">
                      <span className="font-black text-text-primary text-sm">{att.totalScore}</span>
                      <span className="text-text-secondary text-[11px] font-semibold"> / {att.totalMarks}</span>
                    </td>

                    {/* Accuracy */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-black text-xs ${
                            att.accuracy >= 80
                              ? 'bg-green-100 text-green-700'
                              : att.accuracy >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {att.accuracy}%
                        </span>
                      </div>
                    </td>

                    {/* Question Breakdown */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span className="text-green-600 flex items-center gap-0.5" title="Correct">
                          <CheckCircle2 className="w-3 h-3" /> {att.correct}
                        </span>
                        <span className="text-red-500 flex items-center gap-0.5" title="Wrong">
                          <XCircle className="w-3 h-3" /> {att.wrong}
                        </span>
                        <span className="text-slate-400 flex items-center gap-0.5" title="Skipped">
                          <HelpCircle className="w-3 h-3" /> {att.skipped}
                        </span>
                      </div>
                    </td>

                    {/* Time Taken */}
                    <td className="p-4 text-text-secondary font-semibold flex-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-text-secondary/70" />
                        {formatDuration(att.timeTaken)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          att.passed
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {att.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-text-secondary text-[11px]">
                      {new Date(att.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Action */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedAttempt(att)}
                        className="p-1.5 rounded-lg border border-border hover:border-accent hover:text-accent text-text-secondary transition-all bg-white shadow-sm"
                        title="View Detailed Breakdown"
                        aria-label="View Attempt Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attempt Details Modal */}
      <AttemptDetailsModal
        attempt={selectedAttempt}
        onClose={() => setSelectedAttempt(null)}
      />
    </div>
  );
}
