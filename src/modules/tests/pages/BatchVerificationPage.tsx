import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Save, X, Trash2, Plus, Sparkles, Check, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { apiClient } from '../../../core/api/endpoints';

interface ParsedQuestion {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  format: 'STANDARD' | 'ASSERTION_REASON' | 'DATA_INTERPRETATION' | 'READING_COMPREHENSION' | 'COLUMN_MATCHING' | 'PARA_REARRANGEMENT' | 'WORD_SWAP' | 'ERROR_DETECTION';
  sequenceNo: number;
  questionTextEn?: string;
  questionTextTa?: string;
  assertion?: string;
  reason?: string;
  sharedContextEn?: string;
  sharedContextTa?: string;
  tableData?: string[][];
  options?: any;
  correctOptionId?: string;
  correctOptionIds?: any;
  images?: any;
  subjectId?: string;
  topicId?: string;
  examCategory: string;
  difficulty: string;
  correctMarks: number;
  wrongMarks: number;
  negativeEnabled: boolean;
  explanationEn?: string;
  explanationTa?: string;
  parseWarnings?: string[];
  rejectionNote?: string;
}

export default function BatchVerificationPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<any>(null);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Staging form states
  const [format, setFormat] = useState<ParsedQuestion['format']>('STANDARD');
  const [questionTextEn, setQuestionTextEn] = useState('');
  const [questionTextTa, setQuestionTextTa] = useState('');
  const [assertion, setAssertion] = useState('');
  const [reason, setReason] = useState('');
  const [sharedContextEn, setSharedContextEn] = useState('');
  const [sharedContextTa, setSharedContextTa] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [correctMarks, setCorrectMarks] = useState(1);
  const [wrongMarks, setWrongMarks] = useState(0);
  const [negativeEnabled, setNegativeEnabled] = useState(false);
  const [explanationEn, setExplanationEn] = useState('');
  const [explanationTa, setExplanationTa] = useState('');

  // Options edit
  const [options, setOptions] = useState<any[]>([]);
  const [correctOptionId, setCorrectOptionId] = useState('');

  // Table Data spreadsheet representation
  const [tableData, setTableData] = useState<string[][]>([]);

  // Images state
  const [images, setImages] = useState<{ url: string; caption?: string }[]>([]);

  // Batch details fetch
  const fetchDetails = async () => {
    try {
      const res = await apiClient.get(`/questions/parsed-batches/${batchId}`);
      setBatch(res.data.data);
      const qList = res.data.data.questions || [];
      setQuestions(qList);
      if (qList.length > 0) {
        loadQuestion(qList[0]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [batchId]);

  // Load selected question into form states
  const loadQuestion = (q: ParsedQuestion) => {
    setFormat(q.format);
    setQuestionTextEn(q.questionTextEn || '');
    setQuestionTextTa(q.questionTextTa || '');
    setAssertion(q.assertion || '');
    setReason(q.reason || '');
    setSharedContextEn(q.sharedContextEn || '');
    setSharedContextTa(q.sharedContextTa || '');
    setDifficulty(q.difficulty);
    setCorrectMarks(q.correctMarks);
    setWrongMarks(q.wrongMarks);
    setNegativeEnabled(q.negativeEnabled);
    setExplanationEn(q.explanationEn || '');
    setExplanationTa(q.explanationTa || '');
    setCorrectOptionId(q.correctOptionId || '');
    setOptions(q.options || []);
    setTableData(q.tableData || []);
    setImages(q.images || []);
  };

  const currentQuestion = questions[selectedIdx];

  const handleSelectQuestion = (idx: number) => {
    setSelectedIdx(idx);
    loadQuestion(questions[idx]);
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return; // Don't interrupt text input
      }
      if (e.key === 'ArrowUp' && selectedIdx > 0) {
        handleSelectQuestion(selectedIdx - 1);
      } else if (e.key === 'ArrowDown' && selectedIdx < questions.length - 1) {
        handleSelectQuestion(selectedIdx + 1);
      } else if (e.key === 'a' || e.key === 'A') {
        handleApprove();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, questions]);

  const handleSaveDraft = async () => {
    if (!currentQuestion) return;
    const body = {
      format,
      questionTextEn,
      questionTextTa: questionTextTa || null,
      assertion: format === 'ASSERTION_REASON' ? assertion : null,
      reason: format === 'ASSERTION_REASON' ? reason : null,
      sharedContextEn: ['READING_COMPREHENSION', 'DATA_INTERPRETATION'].includes(format) ? sharedContextEn : null,
      sharedContextTa: ['READING_COMPREHENSION', 'DATA_INTERPRETATION'].includes(format) ? sharedContextTa : null,
      tableData: format === 'DATA_INTERPRETATION' ? tableData : null,
      options,
      correctOptionId,
      difficulty,
      correctMarks,
      wrongMarks,
      negativeEnabled,
      explanationEn,
      explanationTa,
      images,
    };

    try {
      const res = await apiClient.put(`/questions/parsed-questions/${currentQuestion.id}`, body);
      // update state list
      const updatedList = [...questions];
      updatedList[selectedIdx] = res.data.data;
      setQuestions(updatedList);
    } catch (err) {
      alert('Failed to save draft');
    }
  };

  const handleApprove = async () => {
    if (!currentQuestion) return;
    await handleSaveDraft();
    try {
      await apiClient.patch(`/questions/parsed-questions/${currentQuestion.id}/approve`);
      // Update local status
      const updatedList = [...questions];
      updatedList[selectedIdx].status = 'APPROVED';
      setQuestions(updatedList);

      // Auto advance
      if (selectedIdx < questions.length - 1) {
        handleSelectQuestion(selectedIdx + 1);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve question');
    }
  };

  const handleReject = async () => {
    if (!currentQuestion) return;
    const reasonNote = prompt('Enter rejection note:');
    if (reasonNote === null) return;

    try {
      await apiClient.patch(`/questions/parsed-questions/${currentQuestion.id}/reject`, {
        rejection_note: reasonNote,
      });
      const updatedList = [...questions];
      updatedList[selectedIdx].status = 'REJECTED';
      updatedList[selectedIdx].rejectionNote = reasonNote;
      setQuestions(updatedList);
    } catch (err) {
      alert('Failed to reject question');
    }
  };

  const handleBulkApprove = async () => {
    if (!confirm('Approve all pending questions without warnings?')) return;
    try {
      const res = await apiClient.post(`/questions/parsed-batches/${batchId}/approve-all`);
      alert(`Bulk approval completed. Approved: ${res.data.data.approved}, Skipped: ${res.data.data.skipped}`);
      fetchDetails();
    } catch (err) {
      alert('Bulk approval failed');
    }
  };

  const handleOptionChange = (idx: number, field: string, val: string) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], [field]: val };
    setOptions(updated);
  };

  const handleAddOption = () => {
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const nextLabel = labels[options.length] || 'X';
    setOptions([
      ...options,
      { id: `opt_${nextLabel.toLowerCase()}`, label: nextLabel, text_en: '', text_ta: null },
    ]);
  };

  const handleRemoveOption = (idx: number) => {
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
  };

  // Table Data Handlers
  const handleTableCellChange = (rowIdx: number, colIdx: number, val: string) => {
    const updated = tableData.map((row, r) =>
      row.map((cell, c) => (r === rowIdx && c === colIdx ? val : cell))
    );
    setTableData(updated);
  };

  const handleAddTableRow = () => {
    const colCount = tableData[0]?.length || 3;
    setTableData([...tableData, Array(colCount).fill('')]);
  };

  const handleAddTableCol = () => {
    const updated = tableData.map((row) => [...row, '']);
    setTableData(updated);
  };

  const handleRemoveTableRow = (idx: number) => {
    setTableData(tableData.filter((_, i) => i !== idx));
  };


  // Images Handlers
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileObj = e.target.files[0];
      const formData = new FormData();
      formData.append('file', fileObj);
      formData.append('subfolder', 'question-images');

      try {
        const res = await apiClient.post('/study-materials/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setImages([...images, { url: res.data.data.url, caption: '' }]);
      } catch (err) {
        alert('Failed to upload image');
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background-start">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background-start">
      {/* Top Header */}
      <header className="h-16 bg-cardBg border-b border-border/80 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/tests')} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div>
            <h1 className="text-md font-extrabold text-text-primary truncate max-w-sm">
              Verify Ingestion: {batch?.fileName}
            </h1>
            <p className="text-xs text-text-secondary">Category: {batch?.examCategory}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleBulkApprove}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-green-500/10 flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Approve All without Warnings</span>
          </button>
        </div>
      </header>

      {/* Main Split Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Question List */}
        <aside className="w-80 border-r border-border/80 bg-cardBg flex flex-col">
          <div className="p-4 border-b border-border/80 bg-background-end/20">
            <p className="text-xs font-bold text-text-secondary uppercase">Staging Questions ({questions.length})</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {questions.map((q, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuestion(idx)}
                  className={`w-full text-left p-4 transition-all flex items-start justify-between ${
                    isSelected ? 'bg-secondary' : 'hover:bg-secondary/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-text-primary">Q{q.sequenceNo}</span>
                      <span className="text-[10px] uppercase tracking-wide font-extrabold text-text-secondary bg-background-start border border-border/85 px-1.5 py-0.5 rounded">
                        {q.format.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 max-w-[200px]">
                      {q.questionTextEn || q.assertion || 'No English text parsed'}
                    </p>
                    {q.parseWarnings && q.parseWarnings.length > 0 && (
                      <span className="inline-flex items-center text-[10px] text-amber-600 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {q.parseWarnings[0]}
                      </span>
                    )}
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    {q.status === 'APPROVED' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : q.status === 'REJECTED' ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse mt-1.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Pane - Verification Editor Form */}
        <main className="flex-1 overflow-y-auto p-6 bg-background-start/30">
          {currentQuestion ? (
            <div className="max-w-4xl mx-auto bg-cardBg border border-border/80 rounded-2xl shadow-sm p-6 space-y-6">
              {/* Question Meta Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full bg-background-start border border-border/80 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent font-semibold"
                  >
                    <option value="STANDARD">Standard MCQ</option>
                    <option value="ASSERTION_REASON">Assertion & Reason</option>
                    <option value="DATA_INTERPRETATION">Data Interpretation</option>
                    <option value="READING_COMPREHENSION">Reading Comprehension</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-background-start border border-border/80 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent font-semibold"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Marks</label>
                    <input
                      type="number"
                      step="0.5"
                      value={correctMarks}
                      onChange={(e) => setCorrectMarks(parseFloat(e.target.value) || 1)}
                      className="w-full bg-background-start border border-border/80 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Negative</label>
                    <input
                      type="number"
                      step="0.25"
                      value={wrongMarks}
                      onChange={(e) => setWrongMarks(parseFloat(e.target.value) || 0)}
                      className="w-full bg-background-start border border-border/80 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Shared Context area for RC/DI */}
              {['READING_COMPREHENSION', 'DATA_INTERPRETATION'].includes(format) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                      Shared Passage / Context (English)
                    </label>
                    <textarea
                      rows={5}
                      value={sharedContextEn}
                      onChange={(e) => setSharedContextEn(e.target.value)}
                      className="w-full bg-background-start border border-border/80 rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:border-accent font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                      Shared Passage / Context (Tamil)
                    </label>
                    <textarea
                      rows={5}
                      value={sharedContextTa}
                      onChange={(e) => setSharedContextTa(e.target.value)}
                      className="w-full bg-background-start border border-border/80 rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:border-accent font-sans"
                    />
                  </div>
                </div>
              )}

              {/* Assertion & Reason inputs */}
              {format === 'ASSERTION_REASON' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                      Assertion (A)
                    </label>
                    <textarea
                      rows={3}
                      value={assertion}
                      onChange={(e) => setAssertion(e.target.value)}
                      className="w-full bg-background-start border border-border/80 rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                      Reason (R)
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-background-start border border-border/80 rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}

              {/* Table Data Spreadsheet Editor */}
              {format === 'DATA_INTERPRETATION' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-secondary uppercase">Table Data Grid</label>
                    <div className="space-x-2">
                      <button
                        onClick={handleAddTableRow}
                        className="bg-secondary text-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-background-end transition-all"
                      >
                        + Add Row
                      </button>
                      <button
                        onClick={handleAddTableCol}
                        className="bg-secondary text-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-background-end transition-all"
                      >
                        + Add Column
                      </button>
                    </div>
                  </div>

                  <div className="border border-border/80 rounded-xl overflow-x-auto bg-background-start/30 p-2">
                    <table className="min-w-full divide-y divide-border/60">
                      <tbody>
                        {tableData.map((row, rowIdx) => (
                          <tr key={rowIdx} className="divide-x divide-border/60">
                            {row.map((cell, colIdx) => (
                              <td key={colIdx} className="p-1">
                                <input
                                  type="text"
                                  value={cell}
                                  onChange={(e) => handleTableCellChange(rowIdx, colIdx, e.target.value)}
                                  className="w-full bg-transparent border-0 focus:ring-1 focus:ring-accent text-xs p-1.5"
                                  placeholder={rowIdx === 0 ? `Header ${colIdx + 1}` : `Row ${rowIdx}`}
                                />
                              </td>
                            ))}
                            <td className="p-1 text-center w-8">
                              <button
                                onClick={() => handleRemoveTableRow(rowIdx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Core Question Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    Question Text (English)
                  </label>
                  <textarea
                    rows={3}
                    value={questionTextEn}
                    onChange={(e) => setQuestionTextEn(e.target.value)}
                    className="w-full bg-background-start border border-border/80 rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    Question Text (Tamil)
                  </label>
                  <textarea
                    rows={3}
                    value={questionTextTa}
                    onChange={(e) => setQuestionTextTa(e.target.value)}
                    className="w-full bg-background-start border border-border/80 rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Options Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-secondary uppercase">Answer Options</label>
                  <button
                    onClick={handleAddOption}
                    className="text-primary text-xs font-bold hover:underline"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="space-y-3">
                  {options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-start space-x-3 bg-background-start/30 p-3 rounded-xl border border-border/80">
                      <input
                        type="radio"
                        name="correct_option"
                        checked={correctOptionId === opt.id}
                        onChange={() => setCorrectOptionId(opt.id)}
                        className="mt-4 text-accent"
                      />
                      <span className="font-extrabold text-sm mt-3 w-4">{opt.label}</span>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={opt.text_en}
                          placeholder="Option text (English)"
                          onChange={(e) => handleOptionChange(idx, 'text_en', e.target.value)}
                          className="w-full bg-cardBg border border-border/60 rounded-lg px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          value={opt.text_ta || ''}
                          placeholder="Option text (Tamil)"
                          onChange={(e) => handleOptionChange(idx, 'text_ta', e.target.value)}
                          className="w-full bg-cardBg border border-border/60 rounded-lg px-3 py-2 text-xs"
                        />
                      </div>

                      <button
                        onClick={() => handleRemoveOption(idx)}
                        className="text-red-500 hover:text-red-700 p-1.5 mt-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Manager */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-text-secondary uppercase">Attached Images</label>
                <div className="flex flex-wrap gap-4 items-center">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group w-24 h-24 border border-border/80 rounded-xl overflow-hidden shadow-sm">
                      <img src={img.url} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <label className="w-24 h-24 border-2 border-dashed border-border/80 hover:border-accent rounded-xl flex flex-col items-center justify-center cursor-pointer bg-background-start/30 transition-colors">
                    <input type="file" onChange={handleUploadImage} className="hidden" accept="image/*" />
                    <Plus className="w-5 h-5 text-text-secondary" />
                    <span className="text-[10px] text-text-secondary mt-1 font-semibold">Upload Image</span>
                  </label>
                </div>
              </div>

              {/* Explanations Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    Explanation (English)
                  </label>
                  <textarea
                    rows={3}
                    value={explanationEn}
                    onChange={(e) => setExplanationEn(e.target.value)}
                    className="w-full bg-background-start border border-border/80 rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    Explanation (Tamil)
                  </label>
                  <textarea
                    rows={3}
                    value={explanationTa}
                    onChange={(e) => setExplanationTa(e.target.value)}
                    className="w-full bg-background-start border border-border/80 rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Staging Actions panel */}
              <div className="flex items-center justify-between border-t border-border/40 pt-6">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSelectQuestion(selectedIdx - 1)}
                    disabled={selectedIdx === 0}
                    className="p-2 border border-border/80 rounded-xl hover:bg-secondary disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleSelectQuestion(selectedIdx + 1)}
                    disabled={selectedIdx === questions.length - 1}
                    className="p-2 border border-border/80 rounded-xl hover:bg-secondary disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-bold text-text-secondary">
                    Question {selectedIdx + 1} of {questions.length}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleReject}
                    className="border border-red-500/30 hover:bg-red-500/10 text-red-500 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                  >
                    Reject Question
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="border border-border/80 hover:bg-secondary text-text-primary text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Draft</span>
                  </button>
                  <button
                    onClick={handleApprove}
                    className="bg-primary hover:bg-accent text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Verify & Approve</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-text-secondary">
              No question loaded
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
