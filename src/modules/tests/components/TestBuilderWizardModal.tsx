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
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useQuestionsList, useQuestionBatches, useExamCategories } from '../../../core/api/endpoints';
import type { Question, Test } from '../../../core/types';
import { useToast } from '../../../shared/context';

interface TestBuilderWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  test?: Test;
  isLoading?: boolean;
  preSelectedQuestions?: Question[];
  prefilledTitle?: string;
  prefilledSubjectId?: string;
  prefilledCategoryId?: string;
  prefilledBatchName?: string;
  prefilledSections?: any[];
}

export default function TestBuilderWizardModal({
  isOpen,
  onClose,
  onSubmit,
  test,
  isLoading = false,
  preSelectedQuestions,
  prefilledTitle,
  prefilledSubjectId,
  prefilledCategoryId,
  prefilledBatchName,
  prefilledSections,
}: TestBuilderWizardModalProps) {
  const toast = useToast();
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const isSubmitting = internalSubmitting || isLoading;
  const [step, setStep] = useState(1);
  const { data: categories = [] } = useExamCategories();
  const { data: questionBatches = [] } = useQuestionBatches();

  const subjects = useMemo(() => {
    return categories.flatMap((cat) => cat.subjects || []);
  }, [categories]);

  const topics = useMemo(() => {
    return subjects.flatMap((sub) => sub.topics || []);
  }, [subjects]);

  // Step 1: Test Mode State ('SUBJECT_WISE' | 'TEST_SERIES')
  const [testMode, setTestMode] = useState<'SUBJECT_WISE' | 'TEST_SERIES'>('SUBJECT_WISE');

  // Step 2: Metadata State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number | string>(60);
  const [cutoffMarks, setCutoffMarks] = useState<number | string>(35);
  const [categoryId, setCategoryId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [targetCategory, setTargetCategory] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSectioned, setIsSectioned] = useState(false);
  const [sections, setSections] = useState<Array<{ id?: string; tempId?: string; name: string; order: number; duration: number; cutoff_marks: number; total_marks: number }>>([]);

  // Step 3: Selected Questions State
  // Array of questions in order
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Step 3 Filters
  const [repoSubject, setRepoSubject] = useState('all');
  const [repoType, setRepoType] = useState('all');
  const [repoDifficulty, setRepoDifficulty] = useState('all');
  const [repoSourceBatch, setRepoSourceBatch] = useState('all');
  const [repoUnusedOnly, setRepoUnusedOnly] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [randomCount, setRandomCount] = useState(5);

  // Fetch all questions matching filters
  const { data: repositoryQuestions = [], isLoading: isRepoLoading } = useQuestionsList({
    subject: repoSubject !== 'all' ? repoSubject : undefined,
    type: repoType !== 'all' ? repoType : undefined,
    difficulty: repoDifficulty !== 'all' ? repoDifficulty : undefined,
    sourceBatch: repoSourceBatch !== 'all' ? repoSourceBatch : undefined,
    unusedOnly: repoUnusedOnly ? true : undefined,
  });

  // Client side search matching
  const filteredRepoQuestions = useMemo(() => {
    return repositoryQuestions.filter((q) => {
      const textEn = q.question_text_en || q.questionTextEn || '';
      const textTa = q.question_text_ta || q.questionTextTa || '';
      if (!repoSearch) return true;
      const searchLower = repoSearch.toLowerCase();
      return (
        textEn.toLowerCase().includes(searchLower) ||
        textTa.toLowerCase().includes(searchLower)
      );
    });
  }, [repositoryQuestions, repoSearch]);

  // Helper to format ISO string to input[type="datetime-local"] format (local time)
  const formatToDatetimeLocal = (isoString?: string | null) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Load test if editing or pre-filled from upload
  useEffect(() => {
    if (test) {
      const mode = test.test_mode || (test.is_sectioned ? 'TEST_SERIES' : 'SUBJECT_WISE');
      setTestMode(mode);
      setTitle(test.title);
      setDescription(test.description || '');
      setDuration(test.duration);
      setCutoffMarks(test.cutoff_marks);
      setCategoryId(test.category_id || '');
      setSubjectId(test.subject_id || '');
      setTopicId(test.topic_id || '');
      setIsPublished(test.is_published);
      setIsPaid(test.is_paid || false);
      setTargetCategory(test.target_category || '');
      setScheduledAt(formatToDatetimeLocal(test.scheduled_at));
      setIsSectioned(mode === 'TEST_SERIES' ? true : (test.is_sectioned || false));
      if (test.sections && test.sections.length > 0) {
        setSections(test.sections.map((s: any) => ({
          id: s.id,
          name: s.name,
          order: s.order,
          duration: s.duration,
          cutoff_marks: s.cutoff_marks,
          total_marks: s.total_marks
        })));
      } else if (mode === 'TEST_SERIES') {
        setSections([
          { tempId: 'sec_1', name: 'Section 1', order: 0, duration: 20, cutoff_marks: 35, total_marks: 0 },
          { tempId: 'sec_2', name: 'Section 2', order: 1, duration: 20, cutoff_marks: 35, total_marks: 0 }
        ]);
      } else {
        setSections([]);
      }
      if (test.questions) {
        // Sort by order and set
        const sorted = [...test.questions].sort((a, b) => a.order - b.order);
        setSelectedQuestions(sorted);
      }
      setStep(1);
    } else if (preSelectedQuestions && preSelectedQuestions.length > 0) {
      // 1-Click Fast-Track Flow from PDF Parser / Upload
      const isMultiSubject = !prefilledSubjectId;
      const initialMode = isMultiSubject ? 'TEST_SERIES' : 'SUBJECT_WISE';
      setTestMode(initialMode);
      setTitle(prefilledTitle || (isMultiSubject ? 'New Mock Test Series' : 'New Practice Test'));
      setDescription(`Comprehensive test with ${preSelectedQuestions.length} questions from ${prefilledBatchName || 'uploaded questions'}.`);
      setDuration(Math.max(10, Math.round(preSelectedQuestions.length * 1.5)));
      setCutoffMarks(Math.max(1, Math.round(preSelectedQuestions.length * 0.4)));
      setCategoryId(prefilledCategoryId || '');
      setSubjectId(prefilledSubjectId || '');
      setTopicId('');
      setIsPublished(true);
      setIsPaid(false);
      setTargetCategory(prefilledCategoryId || '');
      setScheduledAt('');
      
      if (prefilledSections && prefilledSections.length > 0) {
        setIsSectioned(true);
        setTestMode('TEST_SERIES');
        const formattedSections = prefilledSections.map((s: any, idx: number) => ({
          tempId: s.id || `sec_${idx + 1}`,
          name: s.name || `Section ${idx + 1}`,
          order: idx,
          duration: Number(s.duration) || 20,
          cutoff_marks: Number(s.cutoff_marks) || 35,
          total_marks: Number(s.total_marks) || 0
        }));
        setSections(formattedSections);
        const totalDuration = prefilledSections.reduce((sum: number, s: any) => sum + (Number(s.duration) || 0), 0);
        if (totalDuration > 0) {
          setDuration(totalDuration);
        }

        const mapped = preSelectedQuestions.map((q: any, qIdx: number) => {
          const qNum = q.number || (qIdx + 1);
          const matchingSec = prefilledSections.find((s: any) =>
            (s.fromNumber && s.toNumber && qNum >= s.fromNumber && qNum <= s.toNumber) ||
            (s.name && q.sectionName && s.name.trim().toLowerCase() === q.sectionName.trim().toLowerCase())
          ) || formattedSections[0];
          const matchedTempId = matchingSec.tempId || matchingSec.id || formattedSections[0].tempId;
          return {
            ...q,
            section_id: matchedTempId,
            section_temp_id: matchedTempId
          };
        });
        setSelectedQuestions(mapped);
      } else if (isMultiSubject) {
        setIsSectioned(true);
        const defaultSections = [
          { tempId: 'sec_1', name: 'Section 1 (e.g. Quantitative / Aptitude)', order: 0, duration: Math.max(10, Math.round(preSelectedQuestions.length * 0.75)), cutoff_marks: 35, total_marks: 0 },
          { tempId: 'sec_2', name: 'Section 2 (e.g. Reasoning / General Studies)', order: 1, duration: Math.max(10, Math.round(preSelectedQuestions.length * 0.75)), cutoff_marks: 35, total_marks: 0 }
        ];
        setSections(defaultSections);
        const mapped = preSelectedQuestions.map((q) => ({
          ...q,
          section_id: defaultSections[0].tempId,
          section_temp_id: defaultSections[0].tempId
        }));
        setSelectedQuestions(mapped);
      } else {
        setIsSectioned(false);
        setSections([]);
        setSelectedQuestions(preSelectedQuestions);
      }

      if (prefilledSubjectId) {
        setRepoSubject(prefilledSubjectId);
      }
      if (prefilledBatchName) {
        setRepoSourceBatch(prefilledBatchName);
      }
      setStep(1);
    } else {
      // Reset
      setTestMode('SUBJECT_WISE');
      setTitle('');
      setDescription('');
      setDuration(60);
      setCutoffMarks(35);
      setCategoryId('');
      setSubjectId('');
      setTopicId('');
      setIsPublished(false);
      setIsPaid(false);
      setTargetCategory('');
      setScheduledAt('');
      setIsSectioned(false);
      setSections([]);
      setSelectedQuestions([]);
      setRepoSubject('all');
      setRepoSourceBatch('all');
      setRepoUnusedOnly(false);
      setStep(1);
    }
  }, [test, isOpen, preSelectedQuestions, prefilledTitle, prefilledSubjectId, prefilledCategoryId, prefilledBatchName]);

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
    if (step === 1 && !testMode) {
      toast.error('Please select a test type');
      return;
    }
    if (step === 1) {
      if (testMode === 'TEST_SERIES') {
        setIsSectioned(true);
        if (sections.length === 0) {
          setSections([
            { tempId: 'sec_1', name: 'Section 1 (e.g. Quantitative)', order: 0, duration: 20, cutoff_marks: 35, total_marks: 0 },
            { tempId: 'sec_2', name: 'Section 2 (e.g. Reasoning)', order: 1, duration: 20, cutoff_marks: 35, total_marks: 0 }
          ]);
        }
      } else {
        setIsSectioned(false);
        setSections([]);
      }
    }
    if (step === 2 && !title.trim()) {
      toast.error('Test Title is required');
      return;
    }
    if (step === 2 && testMode === 'SUBJECT_WISE') {
      if (!subjectId) {
        toast.error('Subject is required for Subject-Wise tests');
        return;
      }
      // Auto-scope Step 3 repository to the subject selected in Step 2
      if (repoSubject === 'all' || !repoSubject) {
        setRepoSubject(subjectId);
      }
    }
    if (step === 2 && testMode === 'TEST_SERIES') {
      if (sections.length < 2) {
        toast.error('Test Series must have at least 2 sections');
        return;
      }
      const emptyName = sections.some(s => !s.name.trim());
      if (emptyName) {
        toast.error('All sections must have a valid name');
        return;
      }
    }
    if (step === 3 && selectedQuestions.length === 0) {
      toast.error('Please select at least one question for this test');
      return;
    }
    if (step === 3 && isSectioned) {
      // Check if any section has 0 questions
      const emptySection = sections.find(s => {
        const key = s.id || s.tempId || s.name;
        const count = selectedQuestions.filter(q => q.section_id === key || q.section_temp_id === key || q.section_id === s.id).length;
        return count === 0;
      });
      if (emptySection) {
        toast.error(`Section "${emptySection.name}" has 0 questions. All sections must have at least one question.`);
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
      section_id: testMode === 'TEST_SERIES' ? (q.section_id || null) : null,
      section_temp_id: testMode === 'TEST_SERIES' ? (q.section_temp_id || null) : null
    }));

    const payload = {
      title,
      description,
      duration: Number(duration),
      cutoff_marks: Number(cutoffMarks),
      total_marks: totalMarks,
      test_mode: testMode,
      testMode: testMode,
      course_id: null,
      module_id: null,
      category_id: testMode === 'SUBJECT_WISE' ? (categoryId || null) : null,
      subject_id: testMode === 'SUBJECT_WISE' ? (subjectId || null) : null,
      topic_id: testMode === 'SUBJECT_WISE' ? (topicId || null) : null,
      is_published: isPublished,
      is_paid: isPaid,
      target_category: testMode === 'TEST_SERIES' ? (targetCategory || null) : null,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      is_sectioned: testMode === 'TEST_SERIES',
      sections: testMode === 'TEST_SERIES' ? sections.map((s, idx) => ({
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

    setInternalSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setInternalSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl h-[88vh] bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
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
        <div className="flex border-b border-border/20 bg-slate-50/20 px-8 py-3 text-xs font-bold text-text-secondary overflow-x-auto">
          {[
            { num: 1, label: 'Test Mode', icon: Sparkles },
            { num: 2, label: 'Metadata & Scope', icon: Settings },
            { num: 3, label: 'Question Bank Selector', icon: BookOpen },
            { num: 4, label: 'Review & Publish', icon: CheckCircle }
          ].map((s) => (
            <div 
              key={s.num} 
              className={`flex items-center space-x-2 mr-8 transition-colors shrink-0 ${
                step === s.num ? 'text-accent' : step > s.num ? 'text-emerald-600' : ''
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span>Step {s.num}: {s.label}</span>
              {s.num < 4 && <span className="text-gray-300 ml-4 font-normal">/</span>}
            </div>
          ))}
        </div>

        {/* 1-Click Fast-Track Pre-fill Banner */}
        {prefilledBatchName && selectedQuestions.length > 0 && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Pre-filled from upload: <strong>{prefilledBatchName}</strong> ({selectedQuestions.length} Questions pre-selected in workspace)
              </span>
            </div>
            <span className="text-[9px] bg-emerald-200/70 px-2 py-0.5 rounded-md text-emerald-950 font-black uppercase tracking-wider">
              1-Click Fast Track
            </span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col p-6">
          
          {/* STEP 1: TEST MODE SELECTION */}
          {step === 1 && (
            <div className="flex-1 overflow-y-auto space-y-6 max-w-3xl mx-auto w-full py-6 flex flex-col justify-center">
              <div className="text-center space-y-2 mb-2">
                <h3 className="text-base font-black text-text-primary uppercase tracking-wider">
                  Select Test Architecture Mode
                </h3>
                <p className="text-xs text-text-secondary font-medium max-w-md mx-auto">
                  Choose whether this assessment is an isolated Subject Practice Quiz or a Full Mock Exam Series.
                </p>
              </div>

              {test && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Test mode is fixed for existing tests and cannot be changed after creation.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Option 1: Subject-Wise Practice */}
                <div
                  onClick={() => {
                    if (!test) {
                      setTestMode('SUBJECT_WISE');
                      setIsSectioned(false);
                      setSections([]);
                    }
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    testMode === 'SUBJECT_WISE'
                      ? 'border-accent bg-accent/5 shadow-md shadow-accent/10'
                      : 'border-border/60 bg-white hover:border-border hover:bg-slate-50/50'
                  } ${test ? 'cursor-not-allowed opacity-85' : ''}`}
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-text-primary">Subject-Wise Practice Quiz</h4>
                      <p className="text-[11px] text-text-secondary font-medium mt-1 leading-relaxed">
                        Targeted drills focusing on a single subject and topic with progressive difficulty levels (Easy / Medium / Hard).
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-[11px] font-extrabold text-text-secondary">
                    <span className="text-[10px] uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Single Subject</span>
                    {testMode === 'SUBJECT_WISE' && <span className="text-accent font-black">SELECTED ✓</span>}
                  </div>
                </div>

                {/* Option 2: Test Series */}
                <div
                  onClick={() => {
                    if (!test) {
                      setTestMode('TEST_SERIES');
                      setIsSectioned(true);
                      if (sections.length === 0) {
                        setSections([
                          { tempId: 'sec_1', name: 'Section 1 (e.g. Quantitative)', order: 0, duration: 20, cutoff_marks: 35, total_marks: 0 },
                          { tempId: 'sec_2', name: 'Section 2 (e.g. Reasoning)', order: 1, duration: 20, cutoff_marks: 35, total_marks: 0 }
                        ]);
                      }
                    }
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    testMode === 'TEST_SERIES'
                      ? 'border-accent bg-accent/5 shadow-md shadow-accent/10'
                      : 'border-border/60 bg-white hover:border-border hover:bg-slate-50/50'
                  } ${test ? 'cursor-not-allowed opacity-85' : ''}`}
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-text-primary">Full Mock Test Series</h4>
                      <p className="text-[11px] text-text-secondary font-medium mt-1 leading-relaxed">
                        Multi-subject exam simulation (Quant + Reasoning + English + CA) with section-wise timers, sectional cutoffs, and overall rankings.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-[11px] font-extrabold text-text-secondary">
                    <span className="text-[10px] uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Multi-Section Exam</span>
                    {testMode === 'TEST_SERIES' && <span className="text-accent font-black">SELECTED ✓</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: METADATA & SCOPE */}
          {step === 2 && (
            <div className="flex-1 overflow-y-auto space-y-6 max-w-3xl mx-auto w-full py-4">
              <div className="space-y-4">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">Test Title</label>
                  <input
                    type="text"
                    placeholder={testMode === 'TEST_SERIES' ? 'e.g. IBPS PO Prelims Mock Test 1' : 'e.g. Quantitative Aptitude - Data Interpretation Drill 1'}
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
                      <span>{testMode === 'TEST_SERIES' ? 'Total Duration (Sum of Sections)' : 'Duration (Minutes)'}</span>
                    </label>
                    <input
                      type="number"
                      value={duration}
                      disabled={testMode === 'TEST_SERIES'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDuration(val === '' ? '' : Math.max(1, Number(val)));
                      }}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-primary bg-slate-50/20 disabled:bg-slate-100 disabled:text-text-secondary"
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

                {/* Subject-Wise Scope connections */}
                {testMode === 'SUBJECT_WISE' && (
                  <div className="border-t border-border/40 pt-4 space-y-4">
                    <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-accent" />
                      <span>Subject & Topic Assignment</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Exam Category</label>
                        <select
                          value={categoryId}
                          onChange={(e) => {
                            setCategoryId(e.target.value);
                            setTargetCategory(e.target.value);
                            setSubjectId('');
                            setTopicId('');
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-primary bg-slate-50/20"
                        >
                          <option value="">Select Category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Subject (Required for Subject-Wise) */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                          Subject <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={subjectId}
                          onChange={(e) => {
                            setSubjectId(e.target.value);
                            setTopicId('');
                          }}
                          disabled={!categoryId}
                          className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-primary bg-slate-50/20 disabled:opacity-50"
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
                        <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Topic (Optional)</label>
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
                )}

                {/* Test Series Sections Configuration */}
                {testMode === 'TEST_SERIES' && (
                  <div className="border-t border-border/40 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center">
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-accent" />
                          <span>Test Series Sections Configuration</span>
                        </h4>
                        <p className="text-[10px] text-text-secondary font-medium">
                          Define timed subject sections (Minimum 2 required). E.g., Quant, Reasoning, English.
                        </p>
                      </div>
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

                    {sections.length < 2 && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 text-[11px] font-bold flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Test Series must have at least 2 sections configured.</span>
                      </div>
                    )}

                    {/* Table Header with clear labels */}
                    <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                      <span className="w-6 text-center">#</span>
                      <span className="flex-1">Section Name (Subject / Topic)</span>
                      <span className="w-32 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span>Timer (Mins)</span>
                      </span>
                      <span className="w-32 flex items-center space-x-1">
                        <Award className="w-3 h-3 text-emerald-500" />
                        <span>Cutoff Marks</span>
                      </span>
                      <span className="w-20 text-right pr-2">Reorder / Del</span>
                    </div>

                    <div className="space-y-2.5">
                      {sections.map((sec, idx) => (
                        <div key={sec.id || sec.tempId || idx} className="flex items-center gap-3 p-2.5 border border-border/60 rounded-xl bg-cardBg shadow-xs text-xs hover:border-accent/40 transition-colors">
                          <span className="font-extrabold text-accent w-6 text-center text-xs">{idx + 1}</span>
                          
                          {/* Section Name */}
                          <div className="flex-1">
                            <input
                              type="text"
                              value={sec.name}
                              placeholder="e.g. Quantitative Aptitude"
                              onChange={(e) => {
                                const newSecs = [...sections];
                                newSecs[idx].name = e.target.value;
                                setSections(newSecs);
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-border/60 rounded-lg text-xs font-bold text-text-primary outline-none focus:border-accent"
                            />
                          </div>

                          {/* Duration (Time in Minutes) */}
                          <div className="w-32 relative">
                            <input
                              type="number"
                              min="1"
                              value={sec.duration}
                              placeholder="20"
                              onChange={(e) => {
                                const newSecs = [...sections];
                                newSecs[idx].duration = Math.max(1, Number(e.target.value));
                                setSections(newSecs);
                              }}
                              className="w-full pl-2.5 pr-9 py-1.5 bg-slate-50 dark:bg-slate-900 border border-border/60 rounded-lg text-xs font-bold text-text-primary outline-none focus:border-accent"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-secondary pointer-events-none">
                              mins
                            </span>
                          </div>

                          {/* Cutoff Marks */}
                          <div className="w-32 relative">
                            <input
                              type="number"
                              min="0"
                              value={sec.cutoff_marks}
                              placeholder="35"
                              onChange={(e) => {
                                const newSecs = [...sections];
                                newSecs[idx].cutoff_marks = Math.max(0, Number(e.target.value));
                                setSections(newSecs);
                              }}
                              className="w-full pl-2.5 pr-11 py-1.5 bg-slate-50 dark:bg-slate-900 border border-border/60 rounded-lg text-xs font-bold text-text-primary outline-none focus:border-accent"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-secondary pointer-events-none">
                              marks
                            </span>
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
                              disabled={sections.length <= 2}
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

                {/* Test Access Control */}
                <div className="border-t border-border/40 pt-4 space-y-4">
                  <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-accent" />
                    <span>Access Control & Monetization</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Paid Test Access Toggle */}
                    <div className="space-y-1.5 col-span-2">
                      <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                        Test Pricing Tier
                      </label>
                      <div className="flex items-center space-x-3 p-3 bg-slate-50/40 rounded-xl border border-border/40">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPaid}
                            onChange={(e) => setIsPaid(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                        <div>
                          <p className="text-xs font-extrabold text-text-primary">
                            {isPaid ? 'Paid Students Only' : 'Free Test (All Students)'}
                          </p>
                          <p className="text-[10px] text-text-secondary font-medium">
                            {isPaid
                              ? 'Only enrolled students with completed fee payments can attempt this test.'
                              : 'All registered students can attempt this test.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: SPLIT-PANE WORKSPACE SELECTOR */}
          {step === 3 && (
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
                  <div className="grid grid-cols-4 gap-1.5">
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

                    <select
                      value={repoSourceBatch}
                      onChange={(e) => setRepoSourceBatch(e.target.value)}
                      className="px-2 py-1 bg-white border border-border/60 rounded-lg text-[10px] font-bold text-text-secondary outline-none focus:border-accent"
                    >
                      <option value="all">📁 All Batches</option>
                      {questionBatches.map((b) => (
                        <option key={b.name} value={b.name}>
                          📄 {b.name} ({b.count} Qs)
                        </option>
                      ))}
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

                    {/* Unused only toggle */}
                    <label className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white border border-border/70 rounded-xl text-[10px] font-extrabold text-text-secondary cursor-pointer hover:border-accent shrink-0">
                      <input
                        type="checkbox"
                        checked={repoUnusedOnly}
                        onChange={(e) => setRepoUnusedOnly(e.target.checked)}
                        className="rounded border-gray-300 text-accent focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="whitespace-nowrap">Unused Only</span>
                    </label>

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
                            <p className="font-extrabold text-text-primary truncate">{q.question_text_en || q.questionTextEn}</p>
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
                          <p className="font-extrabold text-text-primary truncate">{q.question_text_en || q.questionTextEn}</p>
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

          {/* STEP 4: REVIEW & PUBLISH */}
          {step === 4 && (
            <div className="flex-1 overflow-y-auto w-full py-4 px-2">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Spec Review */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="border border-border/65 rounded-3xl p-6 space-y-4 bg-slate-50/10 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
                        Test Specification Review
                      </h4>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        testMode === 'TEST_SERIES' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {testMode === 'TEST_SERIES' ? 'Full Mock Test Series' : 'Subject-Wise Practice'}
                      </span>
                    </div>

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
                          <span className="text-xs font-bold text-text-secondary">
                            Question {previewIndex + 1} of {selectedQuestions.length}
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
                      <div className="py-12 text-center text-text-secondary text-xs">
                        No questions selected to preview.
                      </div>
                    ) : (
                      (() => {
                        const q = selectedQuestions[previewIndex];
                        if (!q) return null;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-text-primary">
                                Question {previewIndex + 1}
                              </span>
                              {q.type && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                                  {q.type}
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
                              {(q.question_text_ta || q.questionTextTa) && (
                                <p className="text-xs font-semibold text-text-secondary leading-relaxed border-t border-border/20 pt-2 italic">
                                  {q.question_text_ta || q.questionTextTa}
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

            {step < 4 ? (
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
                disabled={isSubmitting}
                className="px-5 py-2 bg-accent hover:bg-accent-onContainer text-white text-xs font-bold rounded-xl shadow-md shadow-accent/15 transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{test ? 'Saving...' : 'Create & Publish'}</span>
                  </>
                ) : (
                  <span>{test ? 'Save Changes' : 'Create & Publish'}</span>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
