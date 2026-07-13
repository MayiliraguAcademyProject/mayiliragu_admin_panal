import { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  BookOpen, 
  Settings, 
  CheckCircle,
  HelpCircle,
  Clock,
  Award,
  Sparkles
} from 'lucide-react';
import { useQuestionsList, useExamCategories } from '../../../core/api/endpoints';
import type { Question, Test } from '../../../core/types';

interface TestBuilderWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  test?: Test;
}

export default function TestBuilderWizardModal({
  isOpen,
  onClose,
  onSubmit,
  test
}: TestBuilderWizardModalProps) {
  const [step, setStep] = useState(1);
  const { data: categories = [] } = useExamCategories();

  const subjects = useMemo(() => {
    return categories.flatMap((cat) => cat.subjects || []);
  }, [categories]);

  const topics = useMemo(() => {
    return subjects.flatMap((sub) => sub.topics || []);
  }, [subjects]);

  // Step 1: Metadata State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number | string>(60);
  const [cutoffMarks, setCutoffMarks] = useState<number | string>(35);
  const [categoryId, setCategoryId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSectioned, setIsSectioned] = useState(false);
  const [sections, setSections] = useState<Array<{ id?: string; tempId?: string; name: string; order: number; duration: number; cutoff_marks: number; total_marks: number }>>([]);

  // Step 2: Selected Questions State
  // Array of questions in order
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Step 2 Filters
  const [repoSubject, setRepoSubject] = useState('all');
  const [repoType, setRepoType] = useState('all');
  const [repoDifficulty, setRepoDifficulty] = useState('all');
  const [repoSearch, setRepoSearch] = useState('');
  const [randomCount, setRandomCount] = useState(5);

  // Fetch all questions matching filters
  const { data: repositoryQuestions = [], isLoading: isRepoLoading } = useQuestionsList({
    subject: repoSubject !== 'all' ? repoSubject : undefined,
    type: repoType !== 'all' ? repoType : undefined,
    difficulty: repoDifficulty !== 'all' ? repoDifficulty : undefined,
  });

  // Client side search matching
  const filteredRepoQuestions = useMemo(() => {
    return repositoryQuestions.filter((q) => {
      if (!repoSearch) return true;
      const searchLower = repoSearch.toLowerCase();
      return (
        q.question_text_en.toLowerCase().includes(searchLower) ||
        (q.question_text_ta && q.question_text_ta.toLowerCase().includes(searchLower))
      );
    });
  }, [repositoryQuestions, repoSearch]);

  // Load test if editing
  useEffect(() => {
    if (test) {
      setTitle(test.title);
      setDescription(test.description || '');
      setDuration(test.duration);
      setCutoffMarks(test.cutoff_marks);
      setCategoryId(test.category_id || '');
      setSubjectId(test.subject_id || '');
      setTopicId(test.topic_id || '');
      setIsPublished(test.is_published);
      setScheduledAt(test.scheduled_at ? test.scheduled_at.substring(0, 16) : '');
      setIsSectioned(test.is_sectioned || false);
      if (test.sections) {
        setSections(test.sections.map((s: any) => ({
          id: s.id,
          name: s.name,
          order: s.order,
          duration: s.duration,
          cutoff_marks: s.cutoff_marks,
          total_marks: s.total_marks
        })));
      } else {
        setSections([]);
      }
      if (test.questions) {
        // Sort by order and set
        const sorted = [...test.questions].sort((a, b) => a.order - b.order);
        setSelectedQuestions(sorted);
      }
    } else {
      // Reset
      setTitle('');
      setDescription('');
      setDuration(60);
      setCutoffMarks(35);
      setCategoryId('');
      setSubjectId('');
      setTopicId('');
      setIsPublished(false);
      setScheduledAt('');
      setIsSectioned(false);
      setSections([]);
      setSelectedQuestions([]);
      setStep(1);
    }
  }, [test, isOpen]);

  // Keep duration in sync with sum of section durations if sectioned
  useEffect(() => {
    if (isSectioned && sections.length > 0) {
      setDuration(sections.reduce((sum, s) => sum + s.duration, 0));
    }
  }, [isSectioned, sections]);

  // Dynamic sum of correct marks
  const totalMarks = useMemo(() => {
    return selectedQuestions.reduce((sum, q) => sum + (q.marks?.correct || 0), 0);
  }, [selectedQuestions]);

  const handleAddQuestion = (q: Question) => {
    if (selectedQuestions.some((item) => item.id === q.id)) return;
    const defaultSection = isSectioned && sections.length > 0 ? (sections[0].id || sections[0].tempId || sections[0].name) : null;
    const newQ = {
      ...q,
      section_id: defaultSection,
      section_temp_id: defaultSection
    };
    setSelectedQuestions([...selectedQuestions, newQ]);
  };

  const handleRemoveQuestion = (id: string) => {
    setSelectedQuestions(selectedQuestions.filter((q) => q.id !== id));
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const newItems = [...selectedQuestions];
    const temp = newItems[idx];
    newItems[idx] = newItems[idx - 1];
    newItems[idx - 1] = temp;
    setSelectedQuestions(newItems);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === selectedQuestions.length - 1) return;
    const newItems = [...selectedQuestions];
    const temp = newItems[idx];
    newItems[idx] = newItems[idx + 1];
    newItems[idx + 1] = temp;
    setSelectedQuestions(newItems);
  };

  const handleAddRandom = () => {
    const unselected = filteredRepoQuestions.filter(
      (q) => !selectedQuestions.some((selected) => selected.id === q.id)
    );

    // Shuffle and pick
    const shuffled = [...unselected].sort(() => 0.5 - Math.random());
    const toAdd = shuffled.slice(0, randomCount).map(q => {
      const defaultSection = isSectioned && sections.length > 0 ? (sections[0].id || sections[0].tempId || sections[0].name) : null;
      return {
        ...q,
        section_id: defaultSection,
        section_temp_id: defaultSection
      };
    });
    setSelectedQuestions([...selectedQuestions, ...toAdd]);
  };

  const handleSelectAll = () => {
    const defaultSection = isSectioned && sections.length > 0 ? (sections[0].id || sections[0].tempId || sections[0].name) : null;
    const unselected = filteredRepoQuestions.filter(
      (q) => !selectedQuestions.some((selected) => selected.id === q.id)
    );
    if (unselected.length === 0) return;

    const toAdd = unselected.map(q => ({
      ...q,
      section_id: defaultSection,
      section_temp_id: defaultSection
    }));
    setSelectedQuestions([...selectedQuestions, ...toAdd]);
  };

  const handleDeselectAll = () => {
    const filteredIds = new Set(filteredRepoQuestions.map((q) => q.id));
    setSelectedQuestions(selectedQuestions.filter((q) => !filteredIds.has(q.id)));
  };

  const handleNext = () => {
    if (step === 1 && !title.trim()) {
      alert('Test Title is required');
      return;
    }
    if (step === 1 && isSectioned) {
      if (sections.length === 0) {
        alert('Please define at least one section for a Sectioned Test');
        return;
      }
      const emptyName = sections.some(s => !s.name.trim());
      if (emptyName) {
        alert('All sections must have a valid name');
        return;
      }
    }
    if (step === 2 && selectedQuestions.length === 0) {
      alert('Please select at least one question for this test');
      return;
    }
    if (step === 2 && isSectioned) {
      // Check if any section has 0 questions
      const emptySection = sections.find(s => {
        const key = s.id || s.tempId || s.name;
        const count = selectedQuestions.filter(q => q.section_id === key || q.section_temp_id === key || q.section_id === s.id).length;
        return count === 0;
      });
      if (emptySection) {
        alert(`Section "${emptySection.name}" has 0 questions. All sections must have at least one question.`);
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSave = async () => {
    const questionsPayload = selectedQuestions.map((q, idx) => ({
      questionId: q.id,
      order: idx,
      section_id: q.section_id || null,
      section_temp_id: q.section_temp_id || null
    }));

    const payload = {
      title,
      description,
      duration: Number(duration),
      cutoff_marks: Number(cutoffMarks),
      total_marks: totalMarks,
      course_id: null,
      module_id: null,
      category_id: categoryId || null,
      subject_id: subjectId || null,
      topic_id: topicId || null,
      is_published: isPublished,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      is_sectioned: isSectioned,
      sections: isSectioned ? sections.map((s, idx) => ({
        id: s.id,
        tempId: s.tempId,
        name: s.name,
        order: idx,
        duration: Number(s.duration),
        cutoff_marks: Number(s.cutoff_marks),
        total_marks: selectedQuestions.filter(q => q.section_id === s.id || q.section_temp_id === s.tempId || q.section_id === s.name).reduce((sum, q) => sum + (q.marks?.correct || 0), 0)
      })) : [],
      questions: questionsPayload
    };

    await onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-6xl h-[88vh] bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-border/45 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-extrabold text-text-primary tracking-tight">
              {test ? 'Edit Test' : 'Test Builder Wizard'}
            </h3>
            <p className="text-xs text-text-secondary font-medium mt-0.5">
              Compile quiz templates, configure difficulty taxonomy, and publish test questions.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-gray-400 hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex border-b border-border/20 bg-slate-50/20 px-8 py-3 text-xs font-bold text-text-secondary">
          {[
            { num: 1, label: 'Metadata & Scope', icon: Settings },
            { num: 2, label: 'Question Bank Selector', icon: BookOpen },
            { num: 3, label: 'Review & Publish', icon: CheckCircle }
          ].map((s) => (
            <div 
              key={s.num} 
              className={`flex items-center space-x-2 mr-12 transition-colors ${
                step === s.num ? 'text-accent' : step > s.num ? 'text-emerald-600' : ''
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span>Step {s.num}: {s.label}</span>
              {s.num < 3 && <span className="text-gray-300 ml-4 font-normal">/</span>}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col p-6">
          
          {/* STEP 1: METADATA & SCOPE */}
          {step === 1 && (
            <div className="flex-1 overflow-y-auto space-y-6 max-w-2xl mx-auto w-full py-4">
              <div className="space-y-4">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">Test Title</label>
                  <input
                    type="text"
                    placeholder="e.g. UPSC Prelims - Indian Polity Quiz 1"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-primary bg-slate-50/20"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">Description</label>
                  <textarea
                    placeholder="Provide overview details, syllabus covered, instructions for students..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-semibold text-text-primary bg-slate-50/20"
                  />
                </div>

                {/* Duration & Cutoff */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-accent" />
                      <span>Duration (Minutes)</span>
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDuration(val === '' ? '' : Math.max(1, Number(val)));
                      }}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-primary bg-slate-50/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center">
                      <Award className="w-3.5 h-3.5 mr-1 text-accent" />
                      <span>Passing / Cutoff Score (%)</span>
                    </label>
                    <input
                      type="number"
                      value={cutoffMarks}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCutoffMarks(val === '' ? '' : Math.max(0, Number(val)));
                      }}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-primary bg-slate-50/20"
                    />
                  </div>
                </div>

                {/* Scheduled Date & Time */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-accent" />
                    <span>Scheduled Date & Time (Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-primary bg-slate-50/20"
                  />
                  <p className="text-[10px] text-text-secondary font-medium">
                    Leave blank to make this test immediately available to students.
                  </p>
                </div>

                {/* Scope connections */}
                <div className="border-t border-border/40 pt-4 space-y-4">
                  <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-accent" />
                    <span>Associate with Syllabus Connect</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Exam Category</label>
                      <select
                        value={categoryId}
                        onChange={(e) => {
                          setCategoryId(e.target.value);
                          setSubjectId('');
                          setTopicId('');
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-secondary bg-slate-50/20"
                      >
                        <option value="">None / General</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Subject</label>
                      <select
                        value={subjectId}
                        onChange={(e) => {
                          setSubjectId(e.target.value);
                          setTopicId('');
                        }}
                        disabled={!categoryId}
                        className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-secondary bg-slate-50/20 disabled:opacity-50"
                      >
                        <option value="">Select Subject</option>
                        {subjects
                          .filter((s) => s.categoryId === categoryId)
                          .map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                      </select>
                    </div>

                    {/* Topic */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Topic</label>
                      <select
                        value={topicId}
                        onChange={(e) => setTopicId(e.target.value)}
                        disabled={!subjectId}
                        className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-secondary bg-slate-50/20 disabled:opacity-50"
                      >
                        <option value="">Select Topic</option>
                        {topics
                          .filter((t) => t.subjectId === subjectId)
                          .map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sectioned Test Toggle */}
                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <div>
                    <h5 className="text-xs font-extrabold text-text-primary uppercase flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-accent" />
                      <span>Sectioned Test (e.g. Banking Format)</span>
                    </h5>
                    <p className="text-[10px] text-text-secondary font-medium">
                      Divide the test into multiple timed sections (Reasoning, Quant, English, etc.).
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isSectioned}
                      onChange={(e) => {
                        setIsSectioned(e.target.checked);
                        if (e.target.checked && sections.length === 0) {
                          setSections([{ tempId: 'sec_1', name: 'Section 1', order: 0, duration: 20, cutoff_marks: 35, total_marks: 0 }]);
                        }
                      }}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>

                {/* Section Manager UI */}
                {isSectioned && (
                  <div className="border border-border/40 rounded-2xl p-4 bg-slate-50/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">Test Sections</h5>
                      <button
                        type="button"
                        onClick={() => {
                          const nextOrder = sections.length;
                          setSections([
                            ...sections,
                            {
                              tempId: `sec_${Date.now()}`,
                              name: `Section ${nextOrder + 1}`,
                              order: nextOrder,
                              duration: 20,
                              cutoff_marks: 35,
                              total_marks: 0
                            }
                          ]);
                        }}
                        className="px-2.5 py-1 text-[10px] font-extrabold text-accent border border-accent/40 rounded-lg hover:bg-accent/5 transition-colors flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Section</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {sections.map((sec, idx) => (
                        <div key={sec.id || sec.tempId || idx} className="flex items-center gap-3 p-3 border border-border/50 rounded-xl bg-cardBg text-xs">
                          <span className="font-extrabold text-text-secondary w-4 text-center">{idx + 1}</span>
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={sec.name}
                              placeholder="Section Name"
                              onChange={(e) => {
                                const newSecs = [...sections];
                                newSecs[idx].name = e.target.value;
                                setSections(newSecs);
                              }}
                              className="px-2 py-1 bg-white border border-border/60 rounded-lg text-xs font-semibold text-text-primary outline-none focus:border-accent"
                            />
                            <input
                              type="number"
                              value={sec.duration}
                              placeholder="Duration (min)"
                              onChange={(e) => {
                                const newSecs = [...sections];
                                newSecs[idx].duration = Math.max(1, Number(e.target.value));
                                setSections(newSecs);
                              }}
                              className="px-2 py-1 bg-white border border-border/60 rounded-lg text-xs font-semibold text-text-primary outline-none focus:border-accent"
                            />
                            <input
                              type="number"
                              value={sec.cutoff_marks}
                              placeholder="Cutoff (%)"
                              onChange={(e) => {
                                const newSecs = [...sections];
                                newSecs[idx].cutoff_marks = Math.max(0, Number(e.target.value));
                                setSections(newSecs);
                              }}
                              className="px-2 py-1 bg-white border border-border/60 rounded-lg text-xs font-semibold text-text-primary outline-none focus:border-accent"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (idx === 0) return;
                                const newSecs = [...sections];
                                const temp = newSecs[idx];
                                newSecs[idx] = newSecs[idx - 1];
                                newSecs[idx - 1] = temp;
                                newSecs.forEach((s, i) => s.order = i);
                                setSections(newSecs);
                              }}
                              disabled={idx === 0}
                              className="p-1 text-text-secondary hover:text-accent disabled:opacity-20 transition-colors"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx === sections.length - 1) return;
                                const newSecs = [...sections];
                                const temp = newSecs[idx];
                                newSecs[idx] = newSecs[idx + 1];
                                newSecs[idx + 1] = temp;
                                newSecs.forEach((s, i) => s.order = i);
                                setSections(newSecs);
                              }}
                              disabled={idx === sections.length - 1}
                              className="p-1 text-text-secondary hover:text-accent disabled:opacity-20 transition-colors"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (sections.length <= 1) return;
                                if (confirm('Are you sure you want to delete this section? Linked questions will lose their section tag.')) {
                                  const newSecs = sections.filter((_, i) => i !== idx);
                                  newSecs.forEach((s, i) => s.order = i);
                                  setSections(newSecs);
                                }
                              }}
                              disabled={sections.length <= 1}
                              className="p-1 text-text-secondary hover:text-rose-500 disabled:opacity-20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* STEP 2: SPLIT-PANE WORKSPACE SELECTOR */}
          {step === 2 && (
            <div className="flex-1 flex overflow-hidden min-h-0 gap-6">
              
              {/* Left repository list */}
              <div className="w-1/2 border border-border/45 rounded-2xl bg-slate-50/10 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border/40 space-y-3 bg-slate-50/35">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center">
                      <BookOpen className="w-3.5 h-3.5 mr-1 text-accent" />
                      <span>Question Repository</span>
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-[10px] bg-accent/10 border border-accent/25 hover:bg-accent/20 px-2.5 py-0.5 rounded-md font-black text-accent uppercase tracking-wider transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-[10px] bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 px-2.5 py-0.5 rounded-md font-black text-rose-500 uppercase tracking-wider transition-colors"
                      >
                        Deselect All
                      </button>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-bold text-text-secondary">
                        {filteredRepoQuestions.length} Matches
                      </span>
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={repoSubject}
                      onChange={(e) => setRepoSubject(e.target.value)}
                      className="px-2 py-1 bg-white border border-border/60 rounded-lg text-[10px] font-bold text-text-secondary outline-none focus:border-accent"
                    >
                      <option value="all">All Subjects</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>

                    <select
                      value={repoType}
                      onChange={(e) => setRepoType(e.target.value)}
                      className="px-2 py-1 bg-white border border-border/60 rounded-lg text-[10px] font-bold text-text-secondary outline-none focus:border-accent"
                    >
                      <option value="all">All Types</option>
                      <option value="single_choice">Single Choice</option>
                      <option value="multi_choice">Multi-Select</option>
                      <option value="true_false">True / False</option>
                      <option value="fill_in_blank">Fill in Blank</option>
                      <option value="descriptive">Descriptive</option>
                    </select>

                    <select
                      value={repoDifficulty}
                      onChange={(e) => setRepoDifficulty(e.target.value)}
                      className="px-2 py-1 bg-white border border-border/60 rounded-lg text-[10px] font-bold text-text-secondary outline-none focus:border-accent"
                    >
                      <option value="all">All Difficulty</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search question text..."
                        value={repoSearch}
                        onChange={(e) => setRepoSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-border/70 rounded-xl text-[10px] font-bold text-text-primary outline-none focus:border-accent"
                      />
                    </div>

                    {/* Random auto-pick option */}
                    <div className="flex items-center space-x-1 border border-dashed border-accent/40 bg-accent/5 px-2 py-1 rounded-lg">
                      <input
                        type="number"
                        value={randomCount}
                        onChange={(e) => setRandomCount(Math.max(1, Number(e.target.value)))}
                        className="w-8 bg-white border border-border/60 rounded text-center text-[10px] font-bold py-0.5 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddRandom}
                        className="text-[9px] font-black text-accent uppercase tracking-wider"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                </div>

                {/* List container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {isRepoLoading ? (
                    <div className="space-y-3 py-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : filteredRepoQuestions.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      No matching questions found in Repository.
                    </div>
                  ) : (
                    filteredRepoQuestions.map((q) => {
                      const isAdded = selectedQuestions.some((item) => item.id === q.id);
                      return (
                        <div 
                          key={q.id}
                          className={`p-3 border rounded-xl flex items-center justify-between gap-3 text-xs bg-cardBg transition-all ${
                            isAdded ? 'border-emerald-300 bg-emerald-50/10' : 'border-border/60 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex-1 space-y-1 min-w-0">
                            <p className="font-extrabold text-text-primary truncate">{q.question_text_en}</p>
                            <div className="flex items-center space-x-2 text-[9px] font-bold text-text-secondary uppercase">
                              <span>{q.type.replace('_', ' ')}</span>
                              <span>•</span>
                              <span>Marks: {q.marks?.correct || 1}</span>
                              <span>•</span>
                              <span className="text-accent">{q.difficulty}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddQuestion(q)}
                            disabled={isAdded}
                            className={`p-1.5 rounded-lg border flex items-center justify-center transition-all ${
                              isAdded 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-not-allowed' 
                                : 'bg-slate-50 border-slate-200 text-text-primary hover:border-accent hover:text-accent'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right selected list */}
              <div className="w-1/2 border border-border/45 rounded-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-slate-50/25">
                  <div>
                    <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                      Selected Quiz Content
                    </h4>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Total: {selectedQuestions.length} Questions ({totalMarks} Marks)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-text-secondary uppercase">
                      Cutoff: {((Number(cutoffMarks) / 100) * totalMarks).toFixed(1)} / {totalMarks}
                    </span>
                  </div>
                </div>

                {/* Selected Questions re-order list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {selectedQuestions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                      <HelpCircle className="w-10 h-10 text-gray-300" />
                      <p className="text-xs font-bold text-text-secondary">Workspace is empty</p>
                      <p className="text-[10px] text-text-secondary max-w-[200px]">
                        Add questions from the repository or click "Auto" to populate the test set.
                      </p>
                    </div>
                  ) : (
                    selectedQuestions.map((q, idx) => (
                      <div 
                        key={q.id}
                        className="p-3 border border-border/60 rounded-xl bg-cardBg flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-extrabold text-text-secondary w-4 text-center">{idx + 1}</span>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-extrabold text-text-primary truncate">{q.question_text_en}</p>
                          <div className="flex items-center space-x-2 text-[9px] font-bold text-text-secondary uppercase">
                            <span>{q.type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{q.marks?.correct || 1} Marks</span>
                          </div>
                          {isSectioned && sections.length > 0 && (
                            <div className="flex items-center space-x-1.5 mt-1">
                              <span className="text-[9px] font-black text-text-secondary uppercase">Section:</span>
                              <select
                                value={q.section_id || q.section_temp_id || sections[0].id || sections[0].tempId || ''}
                                onChange={(e) => {
                                  const targetVal = e.target.value;
                                  setSelectedQuestions(selectedQuestions.map((item) => {
                                    if (item.id === q.id) {
                                      const matchingSec = sections.find(s => s.id === targetVal || s.tempId === targetVal || s.name === targetVal);
                                      return {
                                        ...item,
                                        section_id: matchingSec?.id || null,
                                        section_temp_id: matchingSec?.tempId || matchingSec?.id || null
                                      };
                                    }
                                    return item;
                                  }));
                                }}
                                className="px-1.5 py-0.5 bg-white border border-border/60 rounded text-[9px] font-bold text-text-secondary outline-none focus:border-accent"
                              >
                                {sections.map((s) => (
                                  <option key={s.id || s.tempId || s.name} value={s.id || s.tempId || s.name}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Order rearrangement controls */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 text-text-secondary hover:text-accent disabled:opacity-20 transition-colors"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === selectedQuestions.length - 1}
                            className="p-1 text-text-secondary hover:text-accent disabled:opacity-20 transition-colors"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(q.id)}
                            className="p-1 text-text-secondary hover:text-rose-500 transition-colors ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: REVIEW & PUBLISH */}
          {step === 3 && (
            <div className="flex-1 overflow-y-auto w-full py-4 px-2">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Spec Review */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="border border-border/65 rounded-3xl p-6 space-y-4 bg-slate-50/10 shadow-xs">
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-wider border-b border-border/40 pb-2">
                      Test Specification Review
                    </h4>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs font-medium text-text-secondary">
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Title</span>
                        <span className="font-extrabold text-text-primary">{title}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Duration</span>
                        <span className="font-extrabold text-text-primary">{duration} Minutes</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Total Questions</span>
                        <span className="font-extrabold text-text-primary">{selectedQuestions.length} Questions</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Total Marks</span>
                        <span className="font-extrabold text-text-primary">{totalMarks} Marks</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Cutoff Percent</span>
                        <span className="font-extrabold text-text-primary">{cutoffMarks}%</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Passing Score</span>
                        <span className="font-extrabold text-text-primary">
                          {((Number(cutoffMarks) / 100) * totalMarks).toFixed(1)} / {totalMarks} Marks
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Scheduled Date</span>
                        <span className="font-extrabold text-text-primary text-accent">
                          {scheduledAt ? new Date(scheduledAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          }) : 'Instant / Always Available'}
                        </span>
                      </div>
                    </div>

                    {isSectioned && sections.length > 0 && (
                      <div className="border-t border-border/40 pt-4 space-y-2">
                        <h5 className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">Sections Breakdown</h5>
                        <div className="space-y-2">
                          {sections.map((s, idx) => {
                            const key = s.id || s.tempId || s.name;
                            const count = selectedQuestions.filter(q => q.section_id === key || q.section_temp_id === key || q.section_id === s.id).length;
                            const marks = selectedQuestions.filter(q => q.section_id === key || q.section_temp_id === key || q.section_id === s.id).reduce((sum, q) => sum + (q.marks?.correct || 0), 0);
                            return (
                              <div key={idx} className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                                <span className="font-extrabold text-text-primary">{s.name}</span>
                                <span className="font-medium text-text-secondary">
                                  {s.duration} min | {count} Qs | {marks} Marks | Cutoff: {s.cutoff_marks}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-border/40 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-extrabold text-text-primary uppercase">Publish Test Profile</h5>
                          <p className="text-[10px] text-text-secondary font-medium">
                            If published, students will be able to take this assessment immediately.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Student Preview Simulator */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="border border-border/60 rounded-3xl p-6 bg-slate-50/30 flex flex-col space-y-4">
                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
                          Student Exam View Simulator
                        </h4>
                        <p className="text-[10px] text-text-secondary font-bold mt-0.5">
                          Verify layout, passage alignment, and options rendering
                        </p>
                      </div>
                      
                      {selectedQuestions.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            disabled={previewIndex === 0}
                            onClick={() => setPreviewIndex(prev => prev - 1)}
                            className="p-1 border border-border rounded-lg bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-[11px] font-black text-text-primary">
                            Q. {previewIndex + 1} of {selectedQuestions.length}
                          </span>
                          <button
                            type="button"
                            disabled={previewIndex === selectedQuestions.length - 1}
                            onClick={() => setPreviewIndex(prev => prev + 1)}
                            className="p-1 border border-border rounded-lg bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedQuestions.length === 0 ? (
                      <div className="text-center py-12 text-xs font-bold text-text-secondary">
                        No questions selected. Go back to Step 2 to add questions.
                      </div>
                    ) : (
                      (() => {
                        const q = selectedQuestions[previewIndex];
                        if (!q) return null;

                        return (
                          <div className="space-y-4">
                            {/* Question metadata badge */}
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-accent/10 text-accent uppercase border border-accent/20">
                                {q.type?.replace('_', ' ')}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-650 uppercase border border-slate-200">
                                {q.difficulty}
                              </span>
                              {q.marks?.correct !== undefined && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-700 uppercase border border-emerald-200">
                                  +{q.marks.correct} Marks
                                </span>
                              )}
                            </div>

                            {/* Shared Context / Passage */}
                            {(q.sharedContextEn || q.shared_context_en) && (
                              <div className="bg-white border border-border/60 rounded-2xl p-4 text-[11px] leading-relaxed text-text-secondary max-h-48 overflow-y-auto shadow-inner">
                                <div className="font-extrabold border-b border-border/30 pb-1 mb-2 text-[9px] uppercase tracking-wider text-text-primary">
                                  Common Passage / Directions
                                </div>
                                <div className="whitespace-pre-wrap">{q.sharedContextEn || q.shared_context_en}</div>
                              </div>
                            )}

                            {/* Table Data */}
                            {(q.tableData || q.table_data) && (
                              (() => {
                                let parsedTable = null;
                                const tableDataVal = q.tableData || q.table_data;
                                try {
                                  parsedTable = typeof tableDataVal === 'string' ? JSON.parse(tableDataVal) : tableDataVal;
                                } catch (e) {
                                  try {
                                    const rows = tableDataVal.split('\n').map((r: string) => r.split(/[,\t]/).map(c => c.trim()));
                                    if (rows.length > 0 && rows[0].length > 0) parsedTable = rows;
                                  } catch (err) {}
                                }

                                if (parsedTable && Array.isArray(parsedTable) && parsedTable.length > 0) {
                                  return (
                                    <div className="overflow-x-auto border border-border/80 rounded-xl shadow-xs">
                                      <table className="w-full text-left text-[10px] border-collapse bg-white">
                                        <tbody>
                                          {parsedTable.map((row: any, rIdx: number) => {
                                            const cells = Array.isArray(row) ? row : Object.values(row);
                                            return (
                                              <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-50 font-bold border-b border-border/60' : 'border-b border-border/30'}>
                                                {cells.map((cell: any, cIdx: number) => (
                                                  <td key={cIdx} className="p-2 border border-border/20 text-center text-text-primary font-medium">
                                                    {cell}
                                                  </td>
                                                ))}
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                }
                                return null;
                              })()
                            )}

                            {/* Image Assets */}
                            {(() => {
                              let imagesToRender: string[] = [];
                              if (q.question_image_url) {
                                imagesToRender.push(q.question_image_url);
                              }
                              
                              if (q.images) {
                                let parsedImages = q.images;
                                if (typeof parsedImages === 'string') {
                                  try { parsedImages = JSON.parse(parsedImages); } catch (e) {}
                                }
                                
                                if (Array.isArray(parsedImages)) {
                                  parsedImages.forEach(img => {
                                    const url = (img as any)?.url || img;
                                    if (typeof url === 'string' && url) imagesToRender.push(url);
                                  });
                                } else if (parsedImages && typeof parsedImages === 'object') {
                                  const url = (parsedImages as any).url;
                                  if (typeof url === 'string' && url) imagesToRender.push(url);
                                }
                              }
                              
                              // Deduplicate
                              imagesToRender = [...new Set(imagesToRender)];
                              
                              if (imagesToRender.length === 0) return null;
                              
                              return (
                                <div className="space-y-3">
                                  {imagesToRender.map((url, idx) => (
                                    <div key={idx} className="border border-border/60 rounded-2xl overflow-hidden max-h-56 bg-white flex justify-center p-2 shadow-xs">
                                      <img
                                        src={url}
                                        alt={`Question Asset ${idx + 1}`}
                                        className="max-h-52 w-auto object-contain"
                                      />
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}

                            {/* Question Text */}
                            <div className="space-y-2">
                              <p className="text-xs font-extrabold text-text-primary leading-relaxed whitespace-pre-wrap">
                                {q.question_text_en || q.questionTextEn}
                              </p>
                              {q.question_text_ta && (
                                <p className="text-xs font-semibold text-text-secondary leading-relaxed border-t border-border/20 pt-2 italic">
                                  {q.question_text_ta}
                                </p>
                              )}
                            </div>

                            {/* Options cards */}
                            {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="grid grid-cols-1 gap-2.5 pt-2">
                                {q.options.map((opt: any, oIdx: number) => (
                                  <div
                                    key={opt.id || oIdx}
                                    className="border rounded-xl p-3 flex items-start space-x-3 bg-white shadow-xs transition-colors border-border/80"
                                  >
                                    <div className="w-4 h-4 rounded-full border border-border bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <div className="w-2 h-2 rounded-full bg-transparent"></div>
                                    </div>
                                    <div className="text-[11px] leading-relaxed text-text-primary flex-1">
                                      <div className="flex items-start">
                                        <span className="font-extrabold text-accent mr-1">{opt.label || opt.key || String.fromCharCode(65 + oIdx)}.</span> 
                                        <span>{opt.text_en || opt.text}</span>
                                      </div>
                                      {(opt.image_url || opt.image || opt.imageUrl) && (
                                        <div className="mt-2 border border-border/40 rounded-lg overflow-hidden bg-white p-1 inline-block">
                                          <img src={opt.image_url || opt.image || opt.imageUrl} alt={`Option ${opt.label || String.fromCharCode(65 + oIdx)}`} className="max-h-24 w-auto object-contain" />
                                        </div>
                                      )}
                                    </div>
                                    {opt.is_correct && (
                                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold px-1.5 py-0.5 rounded-lg flex-shrink-0">
                                        CORRECT KEY
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-border/40 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 bg-white border border-border hover:bg-slate-50 text-xs font-bold rounded-xl text-text-secondary flex items-center space-x-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-border hover:bg-slate-50 text-xs font-bold rounded-xl text-text-secondary transition-colors"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-accent hover:bg-accent/90 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-accent/15"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-accent hover:bg-accent-onContainer text-white text-xs font-bold rounded-xl shadow-md shadow-accent/15 transition-all"
              >
                {test ? 'Save Changes' : 'Create & Publish'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
