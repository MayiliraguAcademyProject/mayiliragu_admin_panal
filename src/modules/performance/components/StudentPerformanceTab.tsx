import { useState, useMemo, useEffect, useRef } from 'react';
import type { StudentTestAttempt } from '../../../core/types';
import {
  useBatchOmrSubmissions,
  useTestBatchesList,
} from '../../test-batches/services/test-batch-api';
import type { TestBatchOmrSubmissionItem } from '../../test-batches/types';
import {
  Users,
  Search,
  Award,
  Clock,
  TrendingUp,
  X,
  Eye,
  ChevronRight,
  ArrowUpDown,
  Download,
  BookOpen,
  Layers,
  ExternalLink,
  FileCheck2,
} from 'lucide-react';
import AttemptDetailsModal from './AttemptDetailsModal';

interface StudentPerformanceTabProps {
  attempts: StudentTestAttempt[];
  isLoading: boolean;
  preSelectedStudent?: string;
  onClearPreSelectedStudent?: () => void;
}

interface StudentAggregatedSummary {
  studentId: string;
  studentName: string;
  studentEmail: string;
  batchNames: string[];
  totalOnlineAttempts: number;
  totalOmrSubmissions: number;
  totalTests: number;
  avgScore: number;
  avgAccuracy: number;
  passedCount: number;
  passRate: number;
  bestScore: number;
  totalTimeTaken: number;
  attempts: StudentTestAttempt[];
  omrSubmissions: TestBatchOmrSubmissionItem[];
}

export default function StudentPerformanceTab({
  attempts,
  isLoading,
  preSelectedStudent,
  onClearPreSelectedStudent,
}: StudentPerformanceTabProps) {
  const [searchQuery, setSearchQuery] = useState(preSelectedStudent || '');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All Batches');
  const [sortBy, setSortBy] = useState<'tests-desc' | 'accuracy-desc' | 'score-desc' | 'name-asc'>('tests-desc');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<StudentAggregatedSummary | null>(null);
  const [activeAttemptForReview, setActiveAttemptForReview] = useState<StudentTestAttempt | null>(null);

  // Fetch all OMR submissions across all test batches
  const { data: allOmrSubmissions = [] } = useBatchOmrSubmissions('all');
  const { data: testBatches = [] } = useTestBatchesList();

  // Keep search query synced with preSelectedStudent
  useEffect(() => {
    if (preSelectedStudent) {
      setSearchQuery(preSelectedStudent);
    }
  }, [preSelectedStudent]);

  // Aggregate student data from BOTH online attempts AND test batch OMR submissions
  const studentMap = useMemo(() => {
    const map = new Map<string, StudentAggregatedSummary>();

    // 1. Process online test attempts
    for (const att of attempts) {
      const key = (att.studentEmail || att.studentId || att.studentName || '').toLowerCase();
      if (!key) continue;

      if (!map.has(key)) {
        map.set(key, {
          studentId: att.studentId,
          studentName: att.studentName || 'Student',
          studentEmail: att.studentEmail,
          batchNames: [],
          totalOnlineAttempts: 0,
          totalOmrSubmissions: 0,
          totalTests: 0,
          avgScore: 0,
          avgAccuracy: 0,
          passedCount: 0,
          passRate: 0,
          bestScore: 0,
          totalTimeTaken: 0,
          attempts: [],
          omrSubmissions: [],
        });
      }

      const entry = map.get(key)!;
      entry.totalOnlineAttempts += 1;
      entry.attempts.push(att);
      if (att.passed) entry.passedCount += 1;
      if (att.totalScore > entry.bestScore) entry.bestScore = att.totalScore;
      entry.totalTimeTaken += att.timeTaken || 0;
    }

    // 2. Process Test Batch OMR Submissions
    for (const omr of allOmrSubmissions) {
      const studentName = omr.studentName || omr.student?.name || omr.student?.fullName || 'Student';
      const studentEmail = omr.studentEmail || omr.student?.email || '';
      const key = (studentEmail || omr.studentId || studentName).toLowerCase();
      if (!key) continue;

      if (!map.has(key)) {
        map.set(key, {
          studentId: omr.studentId,
          studentName,
          studentEmail,
          batchNames: [],
          totalOnlineAttempts: 0,
          totalOmrSubmissions: 0,
          totalTests: 0,
          avgScore: 0,
          avgAccuracy: 0,
          passedCount: 0,
          passRate: 0,
          bestScore: 0,
          totalTimeTaken: 0,
          attempts: [],
          omrSubmissions: [],
        });
      }

      const entry = map.get(key)!;
      entry.totalOmrSubmissions += 1;
      entry.omrSubmissions.push(omr);

      // Add batch title to student's batches if available
      const batchTitle = omr.batchTitle || '';
      if (batchTitle && !entry.batchNames.includes(batchTitle)) {
        entry.batchNames.push(batchTitle);
      }

      if (omr.totalMarks !== null && omr.totalMarks !== undefined) {
        if (omr.totalMarks > entry.bestScore) {
          entry.bestScore = omr.totalMarks;
        }
      }
    }

    // 3. Compute combined averages & totals
    for (const entry of map.values()) {
      entry.totalTests = entry.totalOnlineAttempts + entry.totalOmrSubmissions;

      // Online scores
      const onlineScoreSum = entry.attempts.reduce((sum, a) => sum + (a.totalScore || 0), 0);
      const onlineAccSum = entry.attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0);

      // OMR scores
      const scoredOmrs = entry.omrSubmissions.filter(s => s.totalMarks !== null && s.totalMarks !== undefined);
      const omrScoreSum = scoredOmrs.reduce((sum, s) => sum + (s.totalMarks || 0), 0);

      const totalScoredTests = entry.totalOnlineAttempts + scoredOmrs.length;
      if (totalScoredTests > 0) {
        entry.avgScore = Math.round(((onlineScoreSum + omrScoreSum) / totalScoredTests) * 10) / 10;
      } else {
        entry.avgScore = 0;
      }

      if (entry.totalOnlineAttempts > 0) {
        entry.avgAccuracy = Math.round(onlineAccSum / entry.totalOnlineAttempts);
        entry.passRate = Math.round((entry.passedCount / entry.totalOnlineAttempts) * 100);
      } else {
        entry.avgAccuracy = 0;
        entry.passRate = 0;
      }

      // Sort attempts chronologically
      entry.attempts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      entry.omrSubmissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }

    return Array.from(map.values());
  }, [attempts, allOmrSubmissions]);

  // Extract unique batch names for filter dropdown
  const uniqueBatchFilters = useMemo(() => {
    const set = new Set<string>();
    for (const b of testBatches) {
      if (b.title) set.add(b.title);
    }
    for (const s of studentMap) {
      for (const bn of s.batchNames) {
        set.add(bn);
      }
    }
    return Array.from(set).sort();
  }, [testBatches, studentMap]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    return studentMap
      .filter(s => {
        // Batch filter
        if (selectedBatchFilter !== 'All Batches') {
          if (!s.batchNames.includes(selectedBatchFilter)) {
            return false;
          }
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = s.studentName.toLowerCase().includes(q);
          const matchEmail = s.studentEmail.toLowerCase().includes(q);
          const matchBatch = s.batchNames.some(b => b.toLowerCase().includes(q));
          if (!matchName && !matchEmail && !matchBatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'tests-desc') return b.totalTests - a.totalTests;
        if (sortBy === 'accuracy-desc') return b.avgAccuracy - a.avgAccuracy;
        if (sortBy === 'score-desc') return b.avgScore - a.avgScore;
        if (sortBy === 'name-asc') return a.studentName.localeCompare(b.studentName);
        return 0;
      });
  }, [studentMap, searchQuery, selectedBatchFilter, sortBy]);

  const lastAutoOpenedStudentRef = useRef<string | null>(null);

  const handleCloseModal = () => {
    setSelectedStudentForModal(null);
    onClearPreSelectedStudent?.();
  };

  // Close modal on Escape key
  useEffect(() => {
    if (!selectedStudentForModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudentForModal]);

  // Auto-open dossier if user came from clicking a student and there is an exact single match (only once per preselected student)
  useEffect(() => {
    if (
      preSelectedStudent &&
      preSelectedStudent !== lastAutoOpenedStudentRef.current &&
      filteredStudents.length === 1 &&
      !selectedStudentForModal
    ) {
      lastAutoOpenedStudentRef.current = preSelectedStudent;
      setSelectedStudentForModal(filteredStudents[0]);
    }
  }, [preSelectedStudent, filteredStudents, selectedStudentForModal]);

  // High Performers KPI
  const topPerformersCount = useMemo(() => {
    return studentMap.filter(s => s.avgAccuracy >= 80 || s.avgScore >= 80).length;
  }, [studentMap]);

  const testBatchStudentsCount = useMemo(() => {
    return studentMap.filter(s => s.totalOmrSubmissions > 0 || s.batchNames.length > 0).length;
  }, [studentMap]);

  const handleExportStudentsCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = [
      'Rank',
      'Student Name',
      'Student Email',
      'Enrolled / Test Batches',
      'Total Tests Taken',
      'Online Tests',
      'Test Batch OMRs',
      'Average Accuracy (%)',
      'Average Score',
      'Pass Rate (%)',
      'Best Score',
      'Total Online Time (Sec)',
    ];
    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      `"${s.studentName.replace(/"/g, '""')}"`,
      `"${s.studentEmail.replace(/"/g, '""')}"`,
      `"${s.batchNames.join(', ').replace(/"/g, '""')}"`,
      s.totalTests,
      s.totalOnlineAttempts,
      s.totalOmrSubmissions,
      `${s.avgAccuracy}%`,
      s.avgScore,
      `${s.passRate}%`,
      s.bestScore,
      s.totalTimeTaken,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `student_performance_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in text-text-primary">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-text-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" /> Student Performance & Dossiers
          </h2>
          <p className="text-xs text-text-secondary mt-0.5 font-medium">
            Analyze individual student progress across online tests and test batch OMRs, track accuracy trends, and generate student report cards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportStudentsCSV}
            disabled={filteredStudents.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white hover:bg-slate-50 text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-text-primary"
            title="Download Student Performance List as CSV"
          >
            <Download className="w-4 h-4 text-accent" />
            <span>Export Students CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cardBg border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider truncate">Total Students Tested</div>
            <div className="text-2xl font-black mt-0.5">{studentMap.length}</div>
          </div>
        </div>

        <div className="bg-cardBg border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider truncate">Test Batch Students</div>
            <div className="text-2xl font-black mt-0.5">{testBatchStudentsCount}</div>
          </div>
        </div>

        <div className="bg-cardBg border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider truncate">High Performers (≥80%)</div>
            <div className="text-2xl font-black mt-0.5">{topPerformersCount}</div>
          </div>
        </div>

        <div className="bg-cardBg border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider truncate">Total Tests Logged</div>
            <div className="text-2xl font-black mt-0.5">{attempts.length + allOmrSubmissions.length}</div>
          </div>
        </div>
      </div>

      {/* Search, Batch Filter & Sort Bar */}
      <div className="bg-cardBg border border-border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search student by name, email, or batch..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs font-semibold bg-white border-border focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                if (onClearPreSelectedStudent) onClearPreSelectedStudent();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
              aria-label="Clear student search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Batch Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-border rounded-xl px-2.5 py-1.5">
            <Layers className="w-3.5 h-3.5 text-accent" />
            <select
              value={selectedBatchFilter}
              onChange={e => setSelectedBatchFilter(e.target.value)}
              className="text-xs font-bold bg-transparent outline-none text-text-primary cursor-pointer border-none py-1 max-w-[190px] truncate"
            >
              <option value="All Batches">All Batches</option>
              {uniqueBatchFilters.map(bn => (
                <option key={bn} value={bn}>
                  {bn}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 bg-white border border-border rounded-xl px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-secondary" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs font-bold bg-transparent outline-none text-text-primary cursor-pointer border-none py-1"
            >
              <option value="tests-desc">Tests Taken: Most First</option>
              <option value="accuracy-desc">Accuracy: Highest First</option>
              <option value="score-desc">Average Score: High to Low</option>
              <option value="name-asc">Student Name: A-Z</option>
            </select>
          </div>

          <div className="text-xs text-text-secondary font-semibold pl-1">
            <span className="font-extrabold text-text-primary">{filteredStudents.length}</span> students
          </div>
        </div>
      </div>

      {/* Student Directory Table */}
      {isLoading ? (
        <div className="p-16 text-center bg-cardBg border border-border rounded-2xl flex flex-col items-center justify-center space-y-2">
          <Clock className="w-6 h-6 text-accent animate-spin" />
          <span className="text-xs font-bold text-text-secondary">Loading students performance data...</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-cardBg space-y-2">
          <Users className="w-8 h-8 text-text-secondary/50 mx-auto" />
          <h3 className="text-sm font-black text-text-primary">No Students Found</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {studentMap.length === 0
              ? 'No student test attempts or test batch submissions recorded yet.'
              : 'No students match your current search and batch criteria.'}
          </p>
        </div>
      ) : (
        <div className="bg-cardBg border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                  <th className="p-4 text-center w-14">Rank</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Test Batch / Cohort</th>
                  <th className="p-4 text-center">Tests Taken</th>
                  <th className="p-4">Average Accuracy</th>
                  <th className="p-4">Average Score</th>
                  <th className="p-4">Pass Rate</th>
                  <th className="p-4 text-center">Report Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.studentId || s.studentEmail || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 text-center font-black">
                      {idx === 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-black text-xs border border-amber-300">
                          🥇
                        </span>
                      ) : idx === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-black text-xs border border-slate-300">
                          🥈
                        </span>
                      ) : idx === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 font-black text-xs border border-amber-200">
                          🥉
                        </span>
                      ) : (
                        <span className="text-text-secondary font-bold">#{idx + 1}</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-extrabold text-text-primary text-sm">{s.studentName}</div>
                      <div className="text-[11px] text-text-secondary">{s.studentEmail}</div>
                    </td>

                    {/* Batch Badges */}
                    <td className="p-4">
                      {s.batchNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {s.batchNames.map(bName => (
                            <span
                              key={bName}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-orange-50 text-orange-800 border border-orange-200 truncate"
                              title={bName}
                            >
                              <Layers className="w-2.5 h-2.5 text-accent" /> {bName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-secondary font-medium italic">Regular/Online</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 font-black text-xs text-text-primary">
                        <span>{s.totalTests}</span>
                        {s.totalOmrSubmissions > 0 && (
                          <span className="text-[10px] text-accent font-bold">
                            ({s.totalOmrSubmissions} OMR)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      {s.totalOnlineAttempts > 0 ? (
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span
                              className={
                                s.avgAccuracy >= 80
                                  ? 'text-green-700'
                                  : s.avgAccuracy >= 50
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                              }
                            >
                              {s.avgAccuracy}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                s.avgAccuracy >= 80
                                  ? 'bg-green-500'
                                  : s.avgAccuracy >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${s.avgAccuracy}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-text-secondary text-[11px] italic">OMR Only</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-black text-text-primary">{s.avgScore} Marks</div>
                      <div className="text-[10px] text-text-secondary font-semibold">Best: {s.bestScore}</div>
                    </td>

                    <td className="p-4">
                      {s.totalOnlineAttempts > 0 ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            s.passRate >= 75
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : s.passRate >= 50
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}
                        >
                          {s.passRate}% ({s.passedCount}/{s.totalOnlineAttempts})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {s.totalOmrSubmissions} Submissions
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedStudentForModal(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-white hover:bg-orange-50 hover:border-accent/60 text-accent font-bold text-xs transition-all shadow-sm"
                        title="Open Student Report Card"
                      >
                        <span>Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Dossier / Report Card Modal */}
      {selectedStudentForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={handleCloseModal}
        >
          <div
            className="bg-cardBg border border-border rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-start justify-between bg-white flex-shrink-0">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    Student Performance Report Card
                  </span>
                  {selectedStudentForModal.batchNames.map(bName => (
                    <span
                      key={bName}
                      className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3 text-accent" /> {bName}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-black text-text-primary tracking-tight">
                  {selectedStudentForModal.studentName}
                </h3>
                <p className="text-xs text-text-secondary font-medium">{selectedStudentForModal.studentEmail}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-text-secondary hover:text-text-primary p-2 rounded-xl hover:bg-slate-100 transition-all"
                aria-label="Dismiss Report Card"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-text-primary">
              {/* Highlights 4-box grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border border-border bg-slate-50 text-center shadow-sm">
                  <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Total Tests Taken</div>
                  <div className="text-2xl font-black text-text-primary mt-1">{selectedStudentForModal.totalTests}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">
                    {selectedStudentForModal.totalOnlineAttempts} Online | {selectedStudentForModal.totalOmrSubmissions} OMR
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-slate-50 text-center shadow-sm">
                  <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Average Accuracy</div>
                  <div className="text-2xl font-black text-green-700 mt-1">{selectedStudentForModal.avgAccuracy}%</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">Online Tests</div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-slate-50 text-center shadow-sm">
                  <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Average Score</div>
                  <div className="text-2xl font-black text-text-primary mt-1">
                    {selectedStudentForModal.avgScore}
                  </div>
                  <div className="text-[10px] text-text-secondary mt-0.5">Marks</div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-slate-50 text-center shadow-sm">
                  <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Best Marks Scored</div>
                  <div className="text-2xl font-black text-amber-600 mt-1">{selectedStudentForModal.bestScore}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">All-time High</div>
                </div>
              </div>

              {/* TEST BATCH OMR SUBMISSIONS SECTION */}
              <div className="p-5 rounded-2xl border border-border bg-white space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-accent" /> Test Batch OMR Submissions ({selectedStudentForModal.omrSubmissions.length})
                  </h4>
                  <span className="text-[11px] text-text-secondary font-semibold">Offline / Batch Papers</span>
                </div>

                {selectedStudentForModal.omrSubmissions.length === 0 ? (
                  <div className="p-5 text-center bg-slate-50 border border-dashed border-border rounded-xl text-xs text-text-secondary font-medium">
                    No Test Batch OMR submissions recorded for this student yet.
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-border text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                          <th className="p-3">Test Batch</th>
                          <th className="p-3">Question Paper</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Marks Scored</th>
                          <th className="p-3">OMR Sheet</th>
                          <th className="p-3">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {selectedStudentForModal.omrSubmissions.map(omr => {
                          const paperTitle = omr.paperTitle || omr.paper?.title || 'Question Paper';
                          const categoryName = omr.categoryName || '';
                          const batchTitle = omr.batchTitle || 'Test Batch';

                          return (
                            <tr key={omr.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-3 font-extrabold text-text-primary">{batchTitle}</td>
                              <td className="p-3 font-bold text-text-primary">{paperTitle}</td>
                              <td className="p-3 text-text-secondary text-[11px]">{categoryName || '—'}</td>
                              <td className="p-3">
                                {omr.totalMarks !== null && omr.totalMarks !== undefined ? (
                                  <span className="font-black text-sm text-text-primary bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    {omr.totalMarks} Marks
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                                    Ungraded
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                {omr.omrFileUrl ? (
                                  <a
                                    href={omr.omrFileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-border text-xs font-bold text-accent hover:bg-orange-50 transition-all shadow-sm"
                                  >
                                    <span>View OMR</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="text-text-secondary text-[11px]">No file</span>
                                )}
                              </td>
                              <td className="p-3 text-text-secondary text-[11px]">
                                {new Date(omr.submittedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Score Progression Trend across tests */}
              {selectedStudentForModal.attempts.length > 0 && (
                <div className="p-5 rounded-2xl border border-border bg-white space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-accent" /> Score Progression Timeline
                    </h4>
                    <span className="text-[11px] text-text-secondary font-semibold">
                      {selectedStudentForModal.attempts.length} Online Attempts Logged
                    </span>
                  </div>

                  {/* Visual score bars */}
                  <div className="space-y-2 pt-2">
                    {selectedStudentForModal.attempts.map((att, idx) => (
                      <div key={att.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="truncate max-w-[260px] text-text-primary" title={att.testTitle}>
                            #{idx + 1} {att.testTitle}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] text-text-secondary font-semibold">
                              {new Date(att.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-accent font-black">{att.totalScore} / {att.totalMarks} ({att.accuracy}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              att.accuracy >= 80 ? 'bg-green-500' : att.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(att.accuracy, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Attempts Table for this student */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary">
                  Complete Test Attempts History
                </h4>

                {selectedStudentForModal.attempts.length === 0 ? (
                  <div className="p-5 text-center bg-slate-50 border border-dashed border-border rounded-xl text-xs text-text-secondary font-medium">
                    No online mock test attempts recorded for this student.
                  </div>
                ) : (
                  <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-border text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                          <th className="p-3">Test Title</th>
                          <th className="p-3">Score</th>
                          <th className="p-3">Accuracy</th>
                          <th className="p-3">Breakdown</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Date</th>
                          <th className="p-3 text-center">Inspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {selectedStudentForModal.attempts.map(att => (
                          <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 font-bold text-text-primary max-w-[200px] truncate" title={att.testTitle}>
                              {att.testTitle}
                            </td>
                            <td className="p-3 font-black text-text-primary">
                              {att.totalScore} <span className="text-text-secondary text-[10px]">/ {att.totalMarks}</span>
                            </td>
                            <td className="p-3 font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                  att.accuracy >= 80 ? 'bg-green-100 text-green-700' : att.accuracy >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {att.accuracy}%
                              </span>
                            </td>
                            <td className="p-3 text-[11px] font-semibold text-text-secondary">
                              <span className="text-green-600 font-bold">{att.correct}C</span> /{' '}
                              <span className="text-red-500 font-bold">{att.wrong}W</span> /{' '}
                              <span>{att.skipped}S</span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  att.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {att.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </td>
                            <td className="p-3 text-[11px] text-text-secondary">
                              {new Date(att.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => setActiveAttemptForReview(att)}
                                className="p-1 rounded-lg border border-border hover:border-accent hover:text-accent text-text-secondary transition-all"
                                title="Review this test attempt"
                                aria-label="Inspect Test Attempt"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-end bg-slate-50 flex-shrink-0">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all shadow-sm"
              >
                Close Report Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal if clicked inside dossier */}
      <AttemptDetailsModal
        attempt={activeAttemptForReview}
        onClose={() => setActiveAttemptForReview(null)}
      />
    </div>
  );
}
