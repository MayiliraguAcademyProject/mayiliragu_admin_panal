import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useQuestionsList, 
  useQuestionStats, 
  useCoursesList, 
  useCourseDetail,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useTestsList,
  useCreateTest,
  useUpdateTest,
  useDeleteTest,
  useTestDetail,
  useExamCategories,
  useCreateCategory,
  useTestAnalytics,
  useAllTestAttempts
} from '../../../core/api/endpoints';
import { exportQuestionsToExcel } from '../../../core/api/endpoints';
import { type Question, type Test } from '../../../core/types';
import QuestionFormModal from '../components/QuestionFormModal';
import BulkImportModal from '../components/BulkImportModal';
import TestBuilderWizardModal from '../components/TestBuilderWizardModal';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import ConnectionModal from '../components/ConnectionModal';
import CategoryModal from '../components/CategoryModal';
import { 
  FileText, 
  Search, 
  RotateCw, 
  Plus, 
  Trash2, 
  BookOpen, 
  ChevronRight,
  Upload,
  Download, 
  GraduationCap, 
  Landmark, 
  Award,
  AlertCircle,
  TrendingUp,
  Users,
  CheckCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';

// Map icon name string to Lucide component
const iconMap: Record<string, any> = {
  GraduationCap: GraduationCap,
  Landmark: Landmark,
  FileText: FileText,
  Award: Award,
};

export default function TestsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bank' | 'connect' | 'builder' | 'analytics'>('bank');

  // Zustand Store replaced with API queries/mutations
  const { data: categories = [] } = useExamCategories();
  const createCategoryMutation = useCreateCategory();

  const subjects = useMemo(() => {
    return categories.flatMap((cat) => cat.subjects || []);
  }, [categories]);

  const topics = useMemo(() => {
    return subjects.flatMap((sub) => sub.topics || []);
  }, [subjects]);

  // Local state for filters (Question Bank)
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Difficulty: All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // New connection form state
  const [newConnCourseId, setNewConnCourseId] = useState('');
  const [newConnModuleId, setNewConnModuleId] = useState('');
  const [newConnTestId, setNewConnTestId] = useState('');

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('GraduationCap');

  // React Query queries
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuestionStats();
  const { data: questions = [], isLoading: isQuestionsLoading, refetch: refetchQuestions } = useQuestionsList({
    subject: selectedSubject,
    type: selectedType,
    difficulty: selectedDifficulty,
    search: searchQuery,
  });

  const { data: coursesData } = useCoursesList(1, 50);
  const { data: selectedCourseDetail } = useCourseDetail(newConnCourseId);
  const { data: analyticsStats, refetch: refetchAnalytics } = useTestAnalytics();
  const { data: attempts = [], refetch: refetchAttempts } = useAllTestAttempts();

  const handleRefreshAll = () => {
    refetchStats();
    refetchQuestions();
    refetchAnalytics();
    refetchAttempts();
  };

  // Question CRUD Mutations & State
  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined);
  const [questionIdToDelete, setQuestionIdToDelete] = useState<string | null>(null);

  const handleExportQuestions = async () => {
    try {
      setIsExporting(true);
      await exportQuestionsToExcel({
        subject: selectedSubject,
        type: selectedType,
        difficulty: selectedDifficulty,
        search: searchQuery
      });
    } catch (err) {
      console.error('Failed to export questions:', err);
      alert('Failed to export questions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateQuestionClick = () => {
    setEditingQuestion(undefined);
    setIsQuestionModalOpen(true);
  };

  const handleEditQuestionClick = (q: Question) => {
    setEditingQuestion(q);
    setIsQuestionModalOpen(true);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestionIdToDelete(id);
  };

  const handleConfirmDeleteQuestion = async () => {
    if (questionIdToDelete) {
      await deleteQuestionMutation.mutateAsync(questionIdToDelete);
    }
  };

  const handleQuestionSubmit = async (data: any) => {
    if (editingQuestion) {
      await updateQuestionMutation.mutateAsync({ id: editingQuestion.id, data });
    } else {
      await createQuestionMutation.mutateAsync(data);
    }
    setIsQuestionModalOpen(false);
    setEditingQuestion(undefined);
  };

  const { data: tests = [], isLoading: isTestsLoading } = useTestsList();
  const createTestMutation = useCreateTest();
  const updateTestMutation = useUpdateTest();
  const deleteTestMutation = useDeleteTest();

  // Derive connections from tests
  const connections = useMemo(() => {
    return tests
      .filter((t) => t.course_id !== null && t.course_id !== undefined)
      .map((t) => {
        const course = coursesData?.data.find((c) => c.id === t.course_id);
        const module = course?.modules?.find((m) => m.id === t.module_id);
        return {
          id: t.id,
          courseId: t.course_id!,
          courseTitle: course?.title || 'Unknown Course',
          moduleId: t.module_id || undefined,
          moduleTitle: module?.title || 'Entire Course Syllabus',
          testTitle: t.title,
          questionCount: `${t.question_count || 0} Questions`,
          status: t.is_published ? 'Active' : 'Draft',
        };
      });
  }, [tests, coursesData]);

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | undefined>(undefined);
  const { data: editingTestDetail } = useTestDetail(editingTestId);

  const handleCreateTestClick = () => {
    setEditingTestId(undefined);
    setIsTestModalOpen(true);
  };

  const handleEditTestClick = (t: Test) => {
    setEditingTestId(t.id);
    setIsTestModalOpen(true);
  };

  const handleDeleteTest = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      await deleteTestMutation.mutateAsync(id);
    }
  };

  const handleTestSubmit = async (data: any) => {
    if (editingTestId) {
      await updateTestMutation.mutateAsync({ id: editingTestId, data });
    } else {
      await createTestMutation.mutateAsync(data);
    }
    setIsTestModalOpen(false);
    setEditingTestId(undefined);
  };

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnCourseId || !newConnTestId) return;

    await updateTestMutation.mutateAsync({
      id: newConnTestId,
      data: {
        course_id: newConnCourseId,
        module_id: newConnModuleId || null,
      },
    });

    setIsConnectionModalOpen(false);
    setNewConnCourseId('');
    setNewConnModuleId('');
    setNewConnTestId('');
  };

  const deleteConnection = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this connection?')) {
      await updateTestMutation.mutateAsync({
        id,
        data: {
          course_id: null,
          module_id: null,
        },
      });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatDescription) return;
    await createCategoryMutation.mutateAsync({
      name: newCatName,
      description: newCatDescription,
      iconName: newCatIcon,
    });
    setIsCategoryModalOpen(false);
    setNewCatName('');
    setNewCatDescription('');
  };

  const getSubjectCount = (categoryId: string) => {
    return subjects.filter((s) => s.categoryId === categoryId).length;
  };

  const getTopicCount = (categoryId: string) => {
    const subIds = subjects.filter((s) => s.categoryId === categoryId).map((s) => s.id);
    return topics.filter((t) => subIds.includes(t.subjectId)).length;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-gradient-to-br from-background-start via-[#EFF5FF] to-background-end">
      
      {/* Sub-Navigation Tabs */}
      <div className="bg-cardBg border-b border-border/40 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {(['bank', 'connect', 'builder', 'analytics'] as const).map((tab) => {
            const labels = {
              bank: 'Question Bank',
              connect: 'Course Connect',
              builder: 'Test Builder',
              analytics: 'Test Analytics',
            };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-accent/10 border-accent text-accent shadow-xs'
                    : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleRefreshAll}
          className="p-2 bg-slate-50 border border-border/40 hover:border-slate-350 hover:bg-slate-100 rounded-xl text-text-secondary transition-colors"
          title="Refresh Data"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* ========================================== */}
        {/* TAB 1: QUESTION BANK */}
        {/* ========================================== */}
        {activeTab === 'bank' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Questions', val: stats?.total ?? 0, icon: QuestionIcon, color: 'text-blue-500 bg-blue-500/10' },
                { label: 'Published', val: stats?.published ?? 0, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
                { label: 'Drafts', val: stats?.draft ?? 0, icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
                { label: 'Subjects Covered', val: stats?.subjects ?? 0, icon: BookOpen, color: 'text-purple-500 bg-purple-500/10' },
              ].map((c, idx) => (
                <div key={idx} className="bg-cardBg border border-border/45 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-xs text-text-secondary font-semibold">{c.label}</p>
                    {isStatsLoading ? (
                      <div className="h-6 w-12 bg-slate-100 animate-pulse rounded-md mt-1" />
                    ) : (
                      <p className="text-xl font-black text-text-primary mt-0.5">{c.val}</p>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-xl ${c.color}`}>
                    <c.icon className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-cardBg border border-border/45 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-xs">
              <div className="flex-1 flex items-center bg-slate-50 border border-border/50 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search questions by text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-text-primary placeholder-gray-400 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-border/50 rounded-xl text-xs font-bold text-text-secondary outline-none focus:border-accent"
                >
                  <option value="All Subjects">All Subjects</option>
                  <option value="Indian Polity">Indian Polity</option>
                  <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                  <option value="General English">General English</option>
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-border/50 rounded-xl text-xs font-bold text-text-secondary outline-none focus:border-accent"
                >
                  <option value="All Types">All Types</option>
                  <option value="Single Choice">Single Choice</option>
                  <option value="Multi-Select">Multi-Select</option>
                  <option value="True / False">True / False</option>
                  <option value="Fill in the Blank">Fill in the Blank</option>
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-border/50 rounded-xl text-xs font-bold text-text-secondary outline-none focus:border-accent"
                >
                  <option value="Difficulty: All">Difficulty: All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <button
                  onClick={() => setIsBulkImportOpen(true)}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-border/50 text-text-secondary font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import</span>
                </button>

                <button
                  onClick={handleExportQuestions}
                  disabled={isExporting}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-border/50 text-text-secondary font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                </button>

                <button
                  onClick={handleCreateQuestionClick}
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-accent/15 transition-all ml-auto md:ml-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Question</span>
                </button>
              </div>
            </div>

            {/* Questions Table */}
            <div className="bg-cardBg border border-border/45 rounded-3xl overflow-hidden shadow-xs">
              {isQuestionsLoading ? (
                <div className="p-12 space-y-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-12 bg-slate-50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : questions.length === 0 ? (
                <div className="p-16 text-center space-y-2">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
                  <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">No Questions Found</h4>
                  <p className="text-xs text-text-secondary">Try adjusting your filters or search keywords.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-55 border-b border-border/40 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        <th className="py-3 px-5 w-12 text-center">#</th>
                        <th className="py-3 px-4">Question Text</th>
                        <th className="py-3 px-4 w-40">Subject</th>
                        <th className="py-3 px-4 w-32">Type</th>
                        <th className="py-3 px-4 w-28">Difficulty</th>
                        <th className="py-3 px-4 w-24">Status</th>
                        <th className="py-3 px-4 w-24 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {questions.map((q, idx) => {
                        const difficultyColors: Record<string, string> = {
                          easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          medium: 'bg-amber-50 text-amber-700 border-amber-200',
                          hard: 'bg-rose-50 text-rose-700 border-rose-200',
                        };
                        return (
                          <tr key={q.id} className="hover:bg-slate-50/50 transition-colors text-xs font-medium text-text-primary">
                            <td className="py-4 px-5 text-center text-text-secondary font-bold">{idx + 1}</td>
                            <td className="py-4 px-4 space-y-1 max-w-lg">
                              <p className="font-extrabold text-text-primary leading-relaxed">{q.question_text_en}</p>
                              {q.question_text_ta && (
                                <p className="text-[11px] text-text-secondary leading-relaxed font-semibold font-sans">{q.question_text_ta}</p>
                              )}
                            </td>
                            <td className="py-4 px-4 text-text-secondary font-bold uppercase tracking-wider text-[10px]">
                              {q.subject_id || 'General'}
                            </td>
                            <td className="py-4 px-4 text-text-secondary font-semibold uppercase tracking-wider text-[10px]">
                              {q.type.replace('_', ' ')}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 border rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                difficultyColors[q.difficulty] || 'bg-slate-50 text-slate-700'
                              }`}>
                                {q.difficulty}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                q.is_published ? 'bg-emerald-500/10 text-emerald-700' : 'bg-slate-100 text-text-secondary'
                              }`}>
                                {q.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleEditQuestionClick(q)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:border-accent hover:text-accent font-bold text-[10px] transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:border-rose-400 hover:text-rose-600 font-bold text-[10px] transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: COURSE CONNECT */}
        {/* ========================================== */}
        {activeTab === 'connect' && (
          <div className="space-y-8 animate-fade-in">
            {/* Action panel */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-text-primary tracking-tight">
                  Course Connections & Taxonomy
                </h3>
                <p className="text-xs text-text-secondary font-semibold mt-0.5">
                  Link assessments to syllabus modules and manage exam categories.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-slate-900/10 transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>

                <button
                  onClick={() => setIsConnectionModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-accent hover:bg-accent-onContainer text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-accent/15 transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Connection</span>
                </button>
              </div>
            </div>

            {/* Exam Categories */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">Exam Categories</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const IconComponent = iconMap[cat.iconName] || GraduationCap;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => navigate(`/tests/category/${cat.id}`)}
                      className="bg-cardBg border border-border/45 hover:border-accent hover:shadow-lg hover:shadow-accent/5 rounded-3xl p-5 cursor-pointer transition-all duration-200 group flex items-start justify-between"
                    >
                      <div className="space-y-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-sm text-text-primary group-hover:text-accent transition-colors truncate">
                            {cat.name}
                          </h5>
                          <p className="text-[11px] text-text-secondary line-clamp-2 mt-1 font-medium leading-relaxed">
                            {cat.description}
                          </p>
                          <p className="text-[10px] text-accent font-extrabold uppercase tracking-wider mt-1.5">
                            {getSubjectCount(cat.id)} Subjects • {getTopicCount(cat.id)} Topics
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all mt-2.5 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Connections */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">Active Course Linkings</h4>
              <div className="bg-cardBg border border-border/45 rounded-3xl overflow-hidden shadow-xs">
                {connections.length === 0 ? (
                  <div className="p-12 text-center text-text-secondary">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs font-semibold">No active connections found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-55 border-b border-border/40 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          <th className="py-3 px-5">Course Title</th>
                          <th className="py-3 px-4">Syllabus Module</th>
                          <th className="py-3 px-4">Connected Assessment</th>
                          <th className="py-3 px-4 w-36">Size</th>
                          <th className="py-3 px-4 w-28">Status</th>
                          <th className="py-3 px-5 w-20 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {connections.map((conn) => (
                          <tr key={conn.id} className="hover:bg-slate-50/50 transition-colors text-xs font-semibold text-text-primary">
                            <td className="py-4 px-5 truncate max-w-xs">{conn.courseTitle}</td>
                            <td className="py-4 px-4 text-text-secondary font-medium truncate max-w-xs">
                              {conn.moduleTitle || 'Entire Course Syllabus'}
                            </td>
                            <td className="py-4 px-4 text-accent font-extrabold">{conn.testTitle}</td>
                            <td className="py-4 px-4 text-text-secondary font-bold text-[10px] uppercase tracking-wider">
                              {conn.questionCount}
                            </td>
                            <td className="py-4 px-4">
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                {conn.status}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-center">
                              <button
                                onClick={() => deleteConnection(conn.id)}
                                className="p-1.5 rounded-xl hover:bg-red-50 text-text-secondary hover:text-red-650 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: TEST BUILDER */}
        {/* ========================================== */}
        {activeTab === 'builder' && (
          <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Test Assessment Profiles</h3>
                <p className="text-[11px] text-text-secondary font-medium mt-0.5">
                  Compile question bank subsets into time-restricted test packages.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateTestClick}
                className="px-4 py-2 bg-accent hover:bg-accent/90 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-accent/15 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Test Assessment</span>
              </button>
            </div>

            <div className="bg-cardBg border border-border/45 rounded-3xl overflow-hidden shadow-xs">
              {isTestsLoading ? (
                <div className="p-12 space-y-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-12 bg-slate-50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : tests.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-gray-400 flex items-center justify-center mx-auto shadow-inner">
                    <BookOpen className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">No Assessments Found</h4>
                    <p className="text-[11px] text-text-secondary max-w-xs mx-auto mt-1 leading-relaxed">
                      Build your first practice test or quiz by picking questions from the Question Bank.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-55 border-b border-border/40 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        <th className="py-3.5 px-5 w-12 text-center">#</th>
                        <th className="py-3.5 px-4">Test Title</th>
                        <th className="py-3.5 px-4 w-32">Duration</th>
                        <th className="py-3.5 px-4 w-32">Questions / Marks</th>
                        <th className="py-3.5 px-4 w-28">Passing score</th>
                        <th className="py-3.5 px-4 w-24">Status</th>
                        <th className="py-3.5 px-4 w-24 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {tests.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors text-xs font-medium text-text-primary">
                          <td className="py-4 px-5 text-center text-text-secondary font-bold">{idx + 1}</td>
                          <td className="py-4 px-4 space-y-0.5">
                            <p className="font-extrabold text-text-primary leading-snug">{t.title}</p>
                            {t.description && (
                              <p className="text-[10px] text-text-secondary font-medium truncate max-w-sm">{t.description}</p>
                            )}
                          </td>
                          <td className="py-4 px-4 text-text-secondary font-bold text-[10px] uppercase tracking-wider">
                            {t.duration} Minutes
                          </td>
                          <td className="py-4 px-4 space-y-0.5">
                            <p className="font-extrabold text-text-primary">{t.question_count || 0} Questions</p>
                            <p className="text-[10px] text-text-secondary font-medium">{t.total_marks || 0} Marks Total</p>
                          </td>
                          <td className="py-4 px-4 text-text-secondary font-bold">
                            {t.cutoff_marks}%
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              t.is_published ? 'bg-emerald-500/10 text-emerald-700' : 'bg-slate-100 text-text-secondary'
                            }`}>
                              {t.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleEditTestClick(t)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:border-accent hover:text-accent font-bold text-[10px] transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTest(t.id)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:border-rose-450 hover:text-rose-600 font-bold text-[10px] transition-colors"
                            >
                              Delete
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
        )}

        {/* ========================================== */}
        {/* TAB 4: TEST ANALYTICS */}
        {/* ========================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            {/* Visual Analytics overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Test Submissions', val: (analyticsStats?.total_submissions ?? 0).toLocaleString(), icon: Users, delta: 'Total attempts', color: 'text-blue-500 bg-blue-500/10' },
                { label: 'Avg. Accuracy Rate', val: `${analyticsStats?.avg_accuracy ?? 0}%`, icon: Award, delta: 'All questions', color: 'text-emerald-500 bg-emerald-500/10' },
                { label: 'Active Test Takers', val: (analyticsStats?.active_takers ?? 0).toLocaleString(), icon: TrendingUp, delta: 'Unique students', color: 'text-purple-500 bg-purple-500/10' },
              ].map((c, idx) => (
                <div key={idx} className="bg-cardBg border border-border/45 rounded-2xl p-5 flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <p className="text-[11px] text-text-secondary font-bold uppercase tracking-wider">{c.label}</p>
                    <p className="text-2xl font-black text-text-primary">{c.val}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">{c.delta}</p>
                  </div>
                  <div className={`p-3 rounded-2xl ${c.color}`}>
                    <c.icon className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-cardBg border border-border/40 rounded-3xl overflow-hidden shadow-xs">
              <div className="p-6 border-b border-border/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Student Performance Log</h3>
                  <p className="text-[11px] text-text-secondary font-medium mt-0.5">
                    Real-time detailed scoreboard of student test attempts.
                  </p>
                </div>
              </div>

              {attempts.length === 0 ? (
                <div className="p-12 text-center text-text-secondary font-bold text-xs">
                  No student attempts recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-55 border-b border-border/40 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        <th className="py-3 px-5">Student</th>
                        <th className="py-3 px-4">Test Title</th>
                        <th className="py-3 px-4 text-center">Score</th>
                        <th className="py-3 px-4 text-center">Accuracy</th>
                        <th className="py-3 px-4 text-center">Duration</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {attempts.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50/50 transition-colors text-xs font-semibold text-text-primary">
                          <td className="py-4 px-5">
                            <div>
                              <p className="font-extrabold">{att.studentName}</p>
                              <p className="text-[10px] text-text-secondary font-medium">{att.studentEmail}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-accent font-extrabold">{att.testTitle}</td>
                          <td className="py-4 px-4 text-center font-bold">{att.totalScore} pts</td>
                          <td className="py-4 px-4 text-center font-bold text-emerald-600">{att.accuracy}%</td>
                          <td className="py-4 px-4 text-center text-text-secondary font-bold">
                            {Math.floor(att.timeTaken / 60)}m {att.timeTaken % 60}s
                          </td>
                          <td className="py-4 px-4 text-text-secondary font-medium">
                            {new Date(att.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-4 px-5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              att.passed ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700'
                            }`}>
                              {att.passed ? 'Passed' : 'Failed'}
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
        )}

      </div>

      {/* ========================================== */}
      {/* DIALOG MODALS */}
      {/* ========================================== */}

      {/* New Connection Modal */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onSubmit={handleCreateConnection}
        courses={coursesData?.data || []}
        selectedCourseDetail={selectedCourseDetail}
        newConnCourseId={newConnCourseId}
        setNewConnCourseId={setNewConnCourseId}
        newConnModuleId={newConnModuleId}
        setNewConnModuleId={setNewConnModuleId}
        newConnTestId={newConnTestId}
        setNewConnTestId={setNewConnTestId}
        tests={tests}
      />

      {/* Add Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCreateCategory}
        newCatName={newCatName}
        setNewCatName={setNewCatName}
        newCatDescription={newCatDescription}
        setNewCatDescription={setNewCatDescription}
        newCatIcon={newCatIcon}
        setNewCatIcon={setNewCatIcon}
      />

      <QuestionFormModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        onSubmit={handleQuestionSubmit}
        question={editingQuestion}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={handleRefreshAll}
      />

      <TestBuilderWizardModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSubmit={handleTestSubmit}
        test={editingTestDetail}
      />

      <ConfirmModal
        isOpen={questionIdToDelete !== null}
        onClose={() => setQuestionIdToDelete(null)}
        onConfirm={handleConfirmDeleteQuestion}
        title="Delete Question"
        message="Are you sure you want to permanently delete this question from the database? This action cannot be undone."
      />

    </div>
  );
}
