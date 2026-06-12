import { useState } from 'react';
import { useFacultyClassAnalytics, useAdminBatchComparisons } from '../../../core/api/endpoints';
import {
  Sparkles,
  Users,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';

export default function PerformanceAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'faculty' | 'admin'>('faculty');
  const [selectedBatch, setSelectedBatch] = useState<string>('Morning Batch 2026');

  // API hooks
  const { data: facultyData, isLoading: isFacultyLoading } = useFacultyClassAnalytics(selectedBatch);
  const { data: adminData, isLoading: isAdminLoading } = useAdminBatchComparisons();

  const classAverage = facultyData?.data?.classAverage ?? 0;
  const atRiskCount = facultyData?.data?.atRiskCount ?? 0;
  const weakTopics = facultyData?.data?.weakTopics ?? [];
  const students = facultyData?.data?.students ?? [];

  const batchesList = ['Morning Batch 2026', 'Evening Batch 2026', 'Hybrid Batch 2026'];
  const batchComparisons = adminData?.data ?? [];

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-fade-in text-text-primary">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-accent" /> Performance Analytics
        </h1>
        <p className="text-xs text-text-secondary mt-1 font-semibold">
          Monitor class learning statistics, track at-risk students, analyze weak topics, and compare batch-wise achievements.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/80 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('faculty')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${
            activeTab === 'faculty'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faculty: Class Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${
            activeTab === 'admin'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Admin: Batch Comparisons</span>
        </button>
      </div>

      {/* TAB CONTENT: FACULTY CLASS ANALYTICS */}
      {activeTab === 'faculty' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-cardBg border border-border/70 p-4 rounded-2xl">
            <div className="text-xs font-bold text-text-secondary">Select Classroom Batch</div>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-4 py-2 border rounded-xl text-xs font-bold bg-white border-border focus:ring-accent outline-none text-text-primary"
            >
              {batchesList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {isFacultyLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Aggregated Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-cardBg border border-border p-5 rounded-2xl flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Class Average Readiness</div>
                    <div className="text-2xl font-black mt-0.5">{classAverage}%</div>
                  </div>
                </div>

                <div className="bg-cardBg border border-border p-5 rounded-2xl flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-650">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">At-Risk Students (&lt;50% Score)</div>
                    <div className="text-2xl font-black mt-0.5">{atRiskCount}</div>
                  </div>
                </div>

                <div className="bg-cardBg border border-border p-5 rounded-2xl flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Total Active Students</div>
                    <div className="text-2xl font-black mt-0.5">{students.length}</div>
                  </div>
                </div>
              </div>

              {/* Classroom insights columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weak Topics list */}
                <div className="bg-cardBg border border-border p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-text-primary tracking-tight">Classroom Weak Areas (Aggregated)</h3>
                  {weakTopics.length === 0 ? (
                    <p className="text-xs text-text-secondary font-semibold py-6 text-center">No weak areas identified yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {weakTopics.map((wt: any) => (
                        <div key={wt.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-text-primary">{wt.name}</span>
                            <span className="text-red-650 font-bold">{wt.count} students failing</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (wt.count / students.length) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* At-Risk Warning list */}
                <div className="bg-cardBg border border-border p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-text-primary tracking-tight">At-Risk Interventions Required</h3>
                  {students.filter((s: any) => s.readinessScore < 50).length === 0 ? (
                    <p className="text-xs text-green-650 font-bold py-6 text-center">All students are above the 50% safety margin! 🎉</p>
                  ) : (
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                      {students
                        .filter((s: any) => s.readinessScore < 50)
                        .map((s: any) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-3 border border-red-200/60 bg-red-50/20 rounded-xl"
                          >
                            <div>
                              <div className="text-xs font-extrabold text-text-primary">{s.name}</div>
                              <div className="text-[10px] text-text-secondary mt-0.5">{s.email}</div>
                            </div>
                            <span className="px-2.5 py-1 bg-red-100 text-red-750 text-[10px] font-black rounded-lg">
                              {s.readinessScore}% Readiness
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Full Classroom student log */}
              <div className="bg-cardBg border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border/80">
                  <h3 className="text-sm font-black text-text-primary tracking-tight">Classroom Performance Roster</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-border text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Readiness (%)</th>
                        <th className="p-4">Performance (Avg)</th>
                        <th className="p-4">Active Streak</th>
                        <th className="p-4">Total Study Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {students.map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-50/40 transition-all font-semibold">
                          <td className="p-4 font-black text-text-primary">{s.name}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded font-black ${
                                s.readinessScore >= 80
                                  ? 'bg-green-100 text-green-750'
                                  : s.readinessScore >= 50
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-755'
                              }`}
                            >
                              {s.readinessScore}%
                            </span>
                          </td>
                          <td className="p-4">{s.performanceScore}%</td>
                          <td className="p-4">{s.streak} Days</td>
                          <td className="p-4">{s.studyHours} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ADMIN BATCH COMPARISONS */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-text-secondary">Batch Comparison Overview</h2>

          {isAdminLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : batchComparisons.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-white/40">
              <p className="text-xs text-text-secondary font-semibold">No batch aggregates available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {batchComparisons.map((bc: any) => (
                <div key={bc.batch} className="bg-cardBg border border-border p-6 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-sm text-text-primary">{bc.batch}</h3>
                    <span className="text-[10px] text-text-secondary font-bold">
                      {bc.studentCount} Active Students
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Readiness average */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-text-secondary">Average Exam Readiness</span>
                        <span className="text-accent font-black">{bc.averageReadiness}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className="bg-accent h-2.5 rounded-full"
                          style={{ width: `${bc.averageReadiness}%` }}
                        />
                      </div>
                    </div>

                    {/* Study hours average */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-text-secondary">Average Study Time</span>
                        <span className="text-blue-700 font-black">{bc.averageStudyHours} hrs / student</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${Math.min(100, (bc.averageStudyHours / 100) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
