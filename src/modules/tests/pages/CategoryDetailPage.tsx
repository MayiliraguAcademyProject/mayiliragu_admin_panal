import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useQuestionsList,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useExamCategories,
  useCreateSubject,
  useCreateTopic
} from '../../../core/api/endpoints';
import { type Question, type ExamSubject, type ExamTopic } from '../../../core/types';
import QuestionFormModal from '../components/QuestionFormModal';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import SubjectModal from '../components/SubjectModal';
import TopicModal from '../components/TopicModal';
import { 
  ArrowLeft, 
  BookOpen, 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  AlertCircle
} from 'lucide-react';

export default function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  // Zustand Store replaced with API queries/mutations
  const { data: categories = [] } = useExamCategories();
  const createSubjectMutation = useCreateSubject();
  const createTopicMutation = useCreateTopic();

  const subjects = useMemo(() => {
    return categories.flatMap((cat) => cat.subjects || []);
  }, [categories]);

  const topics = useMemo(() => {
    return subjects.flatMap((sub) => sub.topics || []);
  }, [subjects]);

  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === categoryId);
  }, [categories, categoryId]);

  // Selected state
  const [selectedSub, setSelectedSub] = useState<ExamSubject | null>(null);
  const [selectedTop, setSelectedTop] = useState<ExamTopic | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  // Search & Filters state
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('Difficulty: All');
  const [typeFilter, setTypeFilter] = useState('All Types');

  // Modals state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newTopName, setNewTopName] = useState('');

  // Question CRUD Mutations & State
  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined);
  const [questionIdToDelete, setQuestionIdToDelete] = useState<string | null>(null);

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

  // Get subjects belonging to this category
  const categorySubjects = useMemo(() => {
    return subjects
      .filter((s) => s.categoryId === categoryId)
      .filter((s) => s.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()));
  }, [subjects, categoryId, subjectSearchQuery]);

  // Get topics belonging to expanding subject
  const currentTopics = useMemo(() => {
    return topics.filter((t) => t.subjectId === expandedSubId);
  }, [topics, expandedSubId]);

  // Questions hook (query all questions for this category/subject)
  const { data: allQuestions = [], isLoading: isQuestionsLoading } = useQuestionsList({
    subject: selectedSub?.name || undefined,
    type: typeFilter,
    difficulty: difficultyFilter,
  });

  // Client side matching logic to maintain full parity with category tags & text
  const filteredQuestions = useMemo(() => {
    if (!currentCategory) return [];

    return allQuestions.filter((q) => {
      // Filter by Exam Category String
      const catIdLower = currentCategory.id.toLowerCase();
      const examCatLower = q.exam_category.toLowerCase();
      const catNameLower = currentCategory.name.toLowerCase();

      let matchesCat = false;
      if (catIdLower.includes(examCatLower) || examCatLower.includes(catIdLower)) {
        matchesCat = true;
      } else if (catNameLower.includes(examCatLower) || examCatLower.includes(catNameLower)) {
        matchesCat = true;
      } else {
        // Tag checking
        const matchesTag = q.tags.some((tag) => {
          const tagLower = tag.toLowerCase();
          return catIdLower.includes(tagLower) || tagLower.includes(catIdLower) ||
                 catNameLower.includes(tagLower) || tagLower.includes(catNameLower);
        });
        if (matchesTag) matchesCat = true;
      }

      if (!matchesCat) return false;

      // Filter by topic if selected
      if (selectedTop) {
        const qTopicId = q.topic_id?.toLowerCase();
        const topName = selectedTop.name.toLowerCase();
        if (qTopicId && (qTopicId.includes(topName) || topName.includes(qTopicId))) {
          return true;
        }
        return q.tags.some((tag) => tag.toLowerCase().includes(topName));
      }

      return true;
    });
  }, [allQuestions, currentCategory, selectedSub, selectedTop]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !categoryId) return;
    await createSubjectMutation.mutateAsync({ categoryId, name: newSubName });
    setIsSubjectModalOpen(false);
    setNewSubName('');
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopName || !expandedSubId) return;
    await createTopicMutation.mutateAsync({ subjectId: expandedSubId, name: newTopName });
    setIsTopicModalOpen(false);
    setNewTopName('');
  };

  if (!currentCategory) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-text-primary">Category Not Found</h3>
        <button
          onClick={() => navigate('/tests')}
          className="px-4 py-2 bg-accent text-white font-bold rounded-xl text-xs"
        >
          Back to Tests
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50">
      
      {/* Header Panel */}
      <div className="bg-cardBg border-b border-border/40 px-6 py-4 flex items-center space-x-4 flex-shrink-0">
        <button
          onClick={() => navigate('/tests')}
          className="p-2 bg-slate-50 border border-border/40 hover:border-slate-350 hover:bg-slate-100 rounded-xl text-text-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-accent/10 border border-accent/25 rounded-md text-[9px] font-black text-accent uppercase tracking-wider">
              Exam Taxonomy
            </span>
            <span className="text-xs font-semibold text-text-secondary">/</span>
            <span className="text-xs font-semibold text-text-secondary">{currentCategory.name}</span>
          </div>
          <h2 className="text-lg font-black text-text-primary tracking-tight mt-0.5">
            {currentCategory.name} Syllabus Detail
          </h2>
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANE: SUBJECTS & TOPICS */}
        <div className="w-80 border-r border-border/40 bg-cardBg flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border/45 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
                Subjects Index
              </span>
              <button
                onClick={() => setIsSubjectModalOpen(true)}
                className="flex items-center space-x-1 text-accent hover:text-accent-onContainer text-xs font-extrabold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
            </div>

            <div className="flex items-center bg-slate-50 border border-border/50 rounded-xl px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Filter subjects..."
                value={subjectSearchQuery}
                onChange={(e) => setSubjectSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[11px] text-text-primary outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {categorySubjects.length === 0 ? (
              <p className="text-center text-[11px] text-text-secondary py-6">No subjects created yet.</p>
            ) : (
              categorySubjects.map((sub) => {
                const isExpanded = expandedSubId === sub.id;
                const isSelected = selectedSub?.id === sub.id && !selectedTop;
                return (
                  <div key={sub.id} className="space-y-1">
                    <div
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-accent/15 border-accent text-accent' 
                          : 'bg-transparent border-transparent text-text-primary hover:bg-slate-50'
                      }`}
                      onClick={() => {
                        setSelectedSub(sub);
                        setSelectedTop(null);
                        setExpandedSubId(isExpanded ? null : sub.id);
                      }}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{sub.name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedSubId(sub.id);
                            setIsTopicModalOpen(true);
                          }}
                          className="p-1 rounded-md hover:bg-slate-200/50 text-gray-400 hover:text-accent transition-colors"
                          title="Add Topic"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Topics Sub List */}
                    {isExpanded && (
                      <div className="pl-6 space-y-0.5 border-l border-slate-100 ml-4 mb-2 animate-slide-down">
                        {currentTopics.length === 0 ? (
                          <p className="text-[10px] text-text-secondary py-1 pl-2 font-medium">No topics added.</p>
                        ) : (
                          currentTopics.map((top) => {
                            const isTopSelected = selectedTop?.id === top.id;
                            return (
                              <div
                                key={top.id}
                                onClick={() => {
                                  setSelectedSub(sub);
                                  setSelectedTop(top);
                                }}
                                className={`p-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer truncate ${
                                  isTopSelected
                                    ? 'bg-slate-900 text-white font-extrabold'
                                    : 'text-text-secondary hover:bg-slate-50'
                                }`}
                              >
                                {top.name}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: QUESTIONS VIEW */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
          
          {/* Filters header card */}
          <div className="bg-cardBg border border-border/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
            <div>
              <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                {selectedTop ? `Topic: ${selectedTop.name}` : selectedSub ? `Subject: ${selectedSub.name}` : 'All Category Questions'}
              </h4>
              <p className="text-[11px] text-text-secondary font-medium mt-0.5">
                Displaying {filteredQuestions.length} matched questions.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCreateQuestionClick}
                className="px-3 py-1.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-accent/15 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-border/50 rounded-xl text-xs font-bold text-text-secondary outline-none focus:border-accent"
              >
                <option value="All Types">All Types</option>
                <option value="single_choice">Single Choice</option>
                <option value="multi_choice">Multi-Select</option>
                <option value="true_false">True / False</option>
                <option value="fill_in_blank">Fill in the Blank</option>
                <option value="descriptive">Descriptive</option>
              </select>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-border/50 rounded-xl text-xs font-bold text-text-secondary outline-none focus:border-accent"
              >
                <option value="Difficulty: All">Difficulty: All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Question List Card */}
          <div className="flex-1 bg-cardBg border border-border/45 rounded-3xl overflow-hidden shadow-xs">
            {isQuestionsLoading ? (
              <div className="p-12 space-y-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-12 bg-slate-50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto" />
                <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">No Syllabus Questions</h4>
                <p className="text-[11px] text-text-secondary max-w-xs mx-auto">
                  Create new questions in the Question Bank matching the subject query tag to display here.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto h-full max-h-full">
                 <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-55 border-b border-border/40 text-[10px] font-bold text-text-secondary uppercase tracking-wider sticky top-0 bg-slate-50/90 backdrop-blur-xs">
                      <th className="py-3 px-5 w-12 text-center">#</th>
                      <th className="py-3 px-4">Question Text</th>
                      <th className="py-3 px-4 w-32">Type</th>
                      <th className="py-3 px-4 w-28">Difficulty</th>
                      <th className="py-3 px-4 w-24">Status</th>
                      <th className="py-3 px-4 w-24 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredQuestions.map((q, idx) => {
                      const difficultyColors: Record<string, string> = {
                        easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        medium: 'bg-amber-50 text-amber-700 border-amber-200',
                        hard: 'bg-rose-50 text-rose-700 border-rose-200',
                      };
                      return (
                        <tr key={q.id} className="hover:bg-slate-50/50 transition-colors text-xs font-medium text-text-primary">
                          <td className="py-4 px-5 text-center text-text-secondary font-bold">{idx + 1}</td>
                          <td className="py-4 px-4 space-y-1">
                            <p className="font-extrabold text-text-primary leading-relaxed">{q.question_text_en}</p>
                            {q.question_text_ta && (
                              <p className="text-[11px] text-text-secondary leading-relaxed font-semibold font-sans">{q.question_text_ta}</p>
                            )}
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

      </div>

      {/* ========================================== */}
      {/* DIALOG MODALS */}
      {/* ========================================== */}

      {/* Add Subject Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSubmit={handleCreateSubject}
        categoryName={currentCategory.name}
        newSubName={newSubName}
        setNewSubName={setNewSubName}
      />

      {/* Add Topic Modal */}
      <TopicModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        onSubmit={handleCreateTopic}
        newTopName={newTopName}
        setNewTopName={setNewTopName}
      />

      <QuestionFormModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        onSubmit={handleQuestionSubmit}
        question={editingQuestion}
        defaultCategoryId={categoryId}
        defaultSubjectName={selectedSub?.name}
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
