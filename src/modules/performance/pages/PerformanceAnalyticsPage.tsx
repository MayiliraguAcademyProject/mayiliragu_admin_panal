import { useState } from 'react';
import { useAllTestAttempts } from '../../../core/api/endpoints';
import { Award, Layers, Users, FileSpreadsheet } from 'lucide-react';
import TestResultsTab from '../components/TestResultsTab';
import TestBatchesTab from '../components/TestBatchesTab';
import StudentPerformanceTab from '../components/StudentPerformanceTab';

type PerformanceTab = 'results' | 'batches' | 'students';

export default function PerformanceAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<PerformanceTab>('results');
  const [selectedBatch, setSelectedBatch] = useState<'ALL' | 'REGULAR' | 'WEEKEND' | 'EVENING'>('ALL');
  const [preSelectedStudent, setPreSelectedStudent] = useState<string>('');

  const { data: attempts = [], isLoading, refetch, isRefetching } = useAllTestAttempts(
    selectedBatch === 'ALL' ? undefined : selectedBatch
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in text-text-primary min-h-screen">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-text-primary">
          <Award className="w-6 h-6 text-accent" /> Test Results & Student Marks
        </h1>
        <p className="text-xs text-text-secondary font-semibold">
          Comprehensive performance analytics: monitor test results, examine test batch marksheets, and inspect student performance dossiers.
        </p>
      </div>

      {/* Modern Tab Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-border/80 w-fit max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'results'
              ? 'bg-white text-text-primary shadow-sm border border-border/60'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-accent" />
          <span>Test Results</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'batches'
              ? 'bg-white text-text-primary shadow-sm border border-border/60'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Layers className="w-4 h-4 text-accent" />
          <span>Test Batches</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'students'
              ? 'bg-white text-text-primary shadow-sm border border-border/60'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users className="w-4 h-4 text-accent" />
          <span>Student Performance</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'results' && (
        <TestResultsTab
          attempts={attempts}
          isLoading={isLoading}
          refetch={refetch}
          isRefetching={isRefetching}
          selectedBatch={selectedBatch}
          onSelectBatch={setSelectedBatch}
          onSelectStudent={(studentName) => {
            setPreSelectedStudent(studentName);
            setActiveTab('students');
          }}
        />
      )}

      {activeTab === 'batches' && (
        <TestBatchesTab
          onSelectStudent={(studentName) => {
            setPreSelectedStudent(studentName);
            setActiveTab('students');
          }}
        />
      )}

      {activeTab === 'students' && (
        <StudentPerformanceTab
          attempts={attempts}
          isLoading={isLoading}
          preSelectedStudent={preSelectedStudent}
          onClearPreSelectedStudent={() => setPreSelectedStudent('')}
        />
      )}
    </div>
  );
}
