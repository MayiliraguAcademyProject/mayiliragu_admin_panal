import { useState, useEffect, useMemo } from 'react';
import { useExamCategories } from '../../../core/api/endpoints';
import { type Question } from '../../../core/types';
import { X, Plus, Trash2 } from 'lucide-react';

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  question?: Question; // If provided, we are in Edit mode
  defaultCategoryId?: string;
  defaultSubjectName?: string;
}

const EMPTY_CATEGORIES: any[] = [];

export default function QuestionFormModal({
  isOpen,
  onClose,
  onSubmit,
  question,
  defaultCategoryId,
  defaultSubjectName,
}: QuestionFormModalProps) {
  const { data: categories = EMPTY_CATEGORIES } = useExamCategories();

  const subjects = useMemo(() => {
    return categories.flatMap((cat) => cat.subjects || []);
  }, [categories]);

  const topics = useMemo(() => {
    return subjects.flatMap((sub) => sub.topics || []);
  }, [subjects]);

  // Basic fields state
  const [type, setType] = useState('single_choice');
  const [questionTextEn, setQuestionTextEn] = useState('');
  const [questionTextTa, setQuestionTextTa] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [explanationEn, setExplanationEn] = useState('');
  const [explanationTa, setExplanationTa] = useState('');
  const [hint, setHint] = useState('');
  const [correctMarks, setCorrectMarks] = useState(1);
  const [wrongMarks, setWrongMarks] = useState(0);
  const [partialMarks, setPartialMarks] = useState(0);
  const [negativeEnabled, setNegativeEnabled] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Type specific fields state
  // 1. Choice Options
  const [options, setOptions] = useState<Array<{ id: string; label: string; text_en: string; text_ta: string; is_correct: boolean }>>([
    { id: 'opt_1', label: 'A', text_en: '', text_ta: '', is_correct: false },
    { id: 'opt_2', label: 'B', text_en: '', text_ta: '', is_correct: false },
  ]);
  // 2. True/False
  const [correctAnswer, setCorrectAnswer] = useState(true);
  // 3. Fill in the Blank
  const [acceptedAnswers, setAcceptedAnswers] = useState<Array<{ value: string; case_sensitive: boolean }>>([
    { value: '', case_sensitive: false }
  ]);
  const [modelAnswer, setModelAnswer] = useState('');
  const [wordLimit, setWordLimit] = useState(200);

  // Set defaults and populated edit values
  useEffect(() => {
    if (!isOpen) return;

    if (question) {
      setType(question.type || 'single_choice');
      setQuestionTextEn(question.question_text_en || '');
      setQuestionTextTa(question.question_text_ta || '');
      setDifficulty(question.difficulty || 'medium');
      setExplanationEn(question.explanation_en || '');
      setExplanationTa(question.explanation_ta || '');
      setHint(question.hint || '');
      setCorrectMarks(question.marks?.correct ?? 1);
      setWrongMarks(question.marks?.wrong ?? 0);
      setPartialMarks(question.marks?.partial ?? 0);
      setNegativeEnabled(!!question.marks?.negative_enabled);
      setIsPublished(!!question.is_published);

      // Find matching category/subject/topic from store if possible
      // Note: backend subjectId is stored as a string name or id
      if (question.exam_category) {
        const cat = categories.find(c => c.name === question.exam_category || c.id === question.exam_category);
        if (cat) setCategoryId(cat.id);
      }
      if (question.subject_id) {
        const sub = subjects.find(s => s.name === question.subject_id || s.id === question.subject_id);
        if (sub) setSubjectId(sub.id);
      }
      if (question.topic_id) {
        const top = topics.find(t => t.name === question.topic_id || t.id === question.topic_id);
        if (top) setTopicId(top.id);
      }

      // Type specific properties
      if (question.options) {
        setOptions(Array.isArray(question.options) ? question.options : []);
      }
      if (question.correct_answer !== undefined) {
        setCorrectAnswer(!!question.correct_answer);
      }
      if (question.accepted_answers) {
        setAcceptedAnswers(Array.isArray(question.accepted_answers) ? question.accepted_answers : []);
      }
      setModelAnswer(question.model_answer || '');
      setWordLimit(question.word_limit ?? 200);
    } else {
      // Create Mode
      setQuestionTextEn('');
      setQuestionTextTa('');
      setDifficulty('medium');
      setExplanationEn('');
      setExplanationTa('');
      setHint('');
      setCorrectMarks(1);
      setWrongMarks(0);
      setPartialMarks(0);
      setNegativeEnabled(false);
      setIsPublished(false);
      setType('single_choice');
      setOptions([
        { id: 'opt_1', label: 'A', text_en: '', text_ta: '', is_correct: false },
        { id: 'opt_2', label: 'B', text_en: '', text_ta: '', is_correct: false },
      ]);
      setCorrectAnswer(true);
      setAcceptedAnswers([{ value: '', case_sensitive: false }]);
      setModelAnswer('');
      setWordLimit(200);
      setCategoryId('');
      setSubjectId('');
      setTopicId('');
    }
  }, [question, isOpen]);

  // Set default category and subject for Create Mode once categories load
  useEffect(() => {
    if (isOpen && !question && categories.length > 0) {
      if (!categoryId) {
        if (defaultCategoryId) {
          setCategoryId(defaultCategoryId);
        } else {
          setCategoryId(categories[0].id);
        }
      }
    }
  }, [categories, isOpen, question, defaultCategoryId, categoryId]);

  // Set default subject name if provided
  useEffect(() => {
    if (isOpen && !question && subjects.length > 0 && defaultSubjectName && !subjectId) {
      const sub = subjects.find(s => s.name === defaultSubjectName);
      if (sub) setSubjectId(sub.id);
    }
  }, [subjects, isOpen, question, defaultSubjectName, subjectId]);

  // Set default subject if category changes
  useEffect(() => {
    if (!question && categoryId && subjects.length > 0) {
      const filteredSubjects = subjects.filter(s => s.categoryId === categoryId);
      if (filteredSubjects.length > 0 && !filteredSubjects.some(s => s.id === subjectId)) {
        setSubjectId(filteredSubjects[0].id);
      }
    }
  }, [categoryId, subjects, question, subjectId]);

  // Set default topic if subject changes
  useEffect(() => {
    if (!question && subjectId && topics.length > 0) {
      const filteredTopics = topics.filter(t => t.subjectId === subjectId);
      if (filteredTopics.length > 0 && !filteredTopics.some(t => t.id === topicId)) {
        setTopicId(filteredTopics[0].id);
      }
    }
  }, [subjectId, topics, question, topicId]);

  const handleAddOption = () => {
    const nextLabel = String.fromCharCode(65 + options.length); // A, B, C, D...
    setOptions([
      ...options,
      { id: `opt_${Date.now()}`, label: nextLabel, text_en: '', text_ta: '', is_correct: false }
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) return;
    const newOptions = options.filter((_, i) => i !== index).map((opt, i) => ({
      ...opt,
      label: String.fromCharCode(65 + i)
    }));
    setOptions(newOptions);
  };

  const handleOptionCorrectChange = (index: number, val: boolean) => {
    if (type === 'single_choice') {
      setOptions(options.map((opt, i) => ({
        ...opt,
        is_correct: i === index ? val : false
      })));
    } else {
      setOptions(options.map((opt, i) => ({
        ...opt,
        is_correct: i === index ? val : opt.is_correct
      })));
    }
  };

  const handleOptionTextChange = (index: number, lang: 'en' | 'ta', val: string) => {
    setOptions(options.map((opt, i) => ({
      ...opt,
      text_en: lang === 'en' ? (i === index ? val : opt.text_en) : opt.text_en,
      text_ta: lang === 'ta' ? (i === index ? val : opt.text_ta) : opt.text_ta,
    })));
  };

  const handleAddAcceptedAnswer = () => {
    setAcceptedAnswers([...acceptedAnswers, { value: '', case_sensitive: false }]);
  };

  const handleRemoveAcceptedAnswer = (index: number) => {
    setAcceptedAnswers(acceptedAnswers.filter((_, i) => i !== index));
  };

  const handleAcceptedAnswerChange = (index: number, field: 'value' | 'case_sensitive', val: any) => {
    setAcceptedAnswers(acceptedAnswers.map((ans, i) => {
      if (i === index) {
        return { ...ans, [field]: val };
      }
      return ans;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionTextEn || !categoryId) return;

    const selectedCategory = categories.find(c => c.id === categoryId);
    const selectedSubjectObj = subjects.find(s => s.id === subjectId);
    const selectedTopicObj = topics.find(t => t.id === topicId);

    // Dynamic schema validation & compile parameters
    const payload: any = {
      type,
      question_text_en: questionTextEn,
      question_text_ta: questionTextTa || undefined,
      exam_category: selectedCategory?.name || categoryId,
      subject_id: selectedSubjectObj?.name || undefined,
      topic_id: selectedTopicObj?.name || undefined,
      difficulty,
      explanation_en: explanationEn || undefined,
      explanation_ta: explanationTa || undefined,
      hint: hint || undefined,
      marks: {
        correct: Number(correctMarks),
        wrong: Number(wrongMarks),
        partial: Number(partialMarks),
        negative_enabled: negativeEnabled
      },
      is_published: isPublished,
      tags: selectedSubjectObj ? [selectedSubjectObj.name] : [],
    };

    if (type === 'single_choice' || type === 'multi_choice') {
      payload.options = options.map(opt => ({
        id: opt.id,
        label: opt.label,
        text_en: opt.text_en,
        text_ta: opt.text_ta,
        is_correct: opt.is_correct
      }));
      
      if (type === 'single_choice') {
        const correct = options.find(o => o.is_correct);
        payload.correct_option_id = correct?.id || undefined;
      } else {
        payload.correct_option_ids = options.filter(o => o.is_correct).map(o => o.id);
      }
    } else if (type === 'true_false') {
      payload.correct_answer = correctAnswer;
    } else if (type === 'fill_in_blank') {
      payload.accepted_answers = acceptedAnswers.filter(ans => ans.value.trim() !== '');
    } else if (type === 'descriptive') {
      payload.model_answer = modelAnswer || undefined;
      payload.word_limit = Number(wordLimit) || undefined;
    }

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="text-sm font-black text-slate-800">
              {question ? 'Edit Question' : 'Create New Question'}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
              Add bilingual assessments for tests and quizzes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Exam Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
              >
                <option value="">Select Subject</option>
                {subjects
                  .filter((s) => s.categoryId === categoryId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Topic
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Question Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                required
              >
                <option value="single_choice">Single Choice</option>
                <option value="multi_choice">Multi Choice</option>
                <option value="true_false">True / False</option>
                <option value="fill_in_blank">Fill in the Blank</option>
                <option value="descriptive">Descriptive</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Difficulty Level *
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Bilingual Question Text */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Question Text (English) *
              </label>
              <textarea
                value={questionTextEn}
                onChange={(e) => setQuestionTextEn(e.target.value)}
                rows={3}
                placeholder="Enter question text in English"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Question Text (Tamil - Translation)
              </label>
              <textarea
                value={questionTextTa}
                onChange={(e) => setQuestionTextTa(e.target.value)}
                rows={3}
                placeholder="Enter question translation in Tamil (optional)"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Dynamic Question Type Sub-Form */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-3">
              Answers & Options configuration
            </h4>

            {/* CHOICE OPTIONS */}
            {(type === 'single_choice' || type === 'multi_choice') && (
              <div className="space-y-4">
                {options.map((opt, index) => (
                  <div key={opt.id} className="flex items-start space-x-3 bg-white p-3 rounded-xl border border-slate-100">
                    <div className="pt-2">
                      <input
                        type={type === 'single_choice' ? 'radio' : 'checkbox'}
                        name="correct_option"
                        checked={opt.is_correct}
                        onChange={(e) => handleOptionCorrectChange(index, e.target.checked)}
                        className="w-4 h-4 text-accent border-slate-300 focus:ring-accent cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${opt.label} (English)`}
                        value={opt.text_en}
                        onChange={(e) => handleOptionTextChange(index, 'en', e.target.value)}
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                        required
                      />
                      <input
                        type="text"
                        placeholder={`Option ${opt.label} (Tamil)`}
                        value={opt.text_ta}
                        onChange={(e) => handleOptionTextChange(index, 'ta', e.target.value)}
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      disabled={options.length <= 2}
                      className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 pt-1.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center space-x-1 px-3 py-1.5 text-[10px] font-bold text-accent bg-accent/5 hover:bg-accent/10 rounded-lg border border-accent/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              </div>
            )}

            {/* TRUE / FALSE */}
            {type === 'true_false' && (
              <div className="flex items-center space-x-6">
                <span className="text-xs font-semibold text-slate-700">Correct Answer:</span>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(true)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      correctAnswer
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    True
                  </button>
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(false)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      !correctAnswer
                        ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    False
                  </button>
                </div>
              </div>
            )}

            {/* FILL IN THE BLANK */}
            {type === 'fill_in_blank' && (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 font-bold mb-2">
                  Define acceptable strings for the correct blank input
                </p>
                {acceptedAnswers.map((ans, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-100">
                    <input
                      type="text"
                      placeholder="Accepted correct word or phrase"
                      value={ans.value}
                      onChange={(e) => handleAcceptedAnswerChange(index, 'value', e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                      required
                    />
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ans.case_sensitive}
                        onChange={(e) => handleAcceptedAnswerChange(index, 'case_sensitive', e.target.checked)}
                        className="w-3.5 h-3.5 text-accent border-slate-300 focus:ring-accent"
                      />
                      <span className="text-[10px] font-bold text-slate-500 uppercase select-none">Case Sensitive</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveAcceptedAnswer(index)}
                      disabled={acceptedAnswers.length <= 1}
                      className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddAcceptedAnswer}
                  className="flex items-center space-x-1 px-3 py-1.5 text-[10px] font-bold text-accent bg-accent/5 hover:bg-accent/10 rounded-lg border border-accent/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Alternative Phrase</span>
                </button>
              </div>
            )}

            {/* DESCRIPTIVE */}
            {type === 'descriptive' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                    Word Limit (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 200"
                    value={wordLimit}
                    onChange={(e) => setWordLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                    Model Answer / Grading Rubric (Optional)
                  </label>
                  <textarea
                    placeholder="Enter reference model answer or grading rubric guidelines"
                    value={modelAnswer}
                    onChange={(e) => setModelAnswer(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Explanations & Hints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Explanation (English)
              </label>
              <textarea
                value={explanationEn}
                onChange={(e) => setExplanationEn(e.target.value)}
                rows={2}
                placeholder="Detailed explanations in English"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Explanation (Tamil)
              </label>
              <textarea
                value={explanationTa}
                onChange={(e) => setExplanationTa(e.target.value)}
                rows={2}
                placeholder="Detailed explanations in Tamil"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Hint
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Optional solver hint"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Correct Marks
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={correctMarks}
                  onChange={(e) => setCorrectMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Wrong Marks
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={wrongMarks}
                  onChange={(e) => setWrongMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Partial Marks
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={partialMarks}
                  onChange={(e) => setPartialMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium text-slate-700"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 border-t border-slate-100 pt-5">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={negativeEnabled}
                onChange={(e) => setNegativeEnabled(e.target.checked)}
                className="w-4 h-4 text-accent border-slate-300 rounded focus:ring-accent"
              />
              <span className="text-xs font-bold text-slate-700 uppercase">Enable Negative Marking</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 text-accent border-slate-300 rounded focus:ring-accent"
              />
              <span className="text-xs font-bold text-slate-700 uppercase">Publish Immediately</span>
            </label>
          </div>

        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl text-xs shadow-md shadow-accent/15 transition-all"
          >
            {question ? 'Save Changes' : 'Create Question'}
          </button>
        </div>

      </div>
    </div>
  );
}
