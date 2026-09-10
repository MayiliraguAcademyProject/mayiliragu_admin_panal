import { useEffect } from 'react';
import type { StudentTestAttempt } from '../../../core/types';
import { useTestAttemptDetails } from '../../../core/api/endpoints';
import {
  X,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  Award,
  Loader2,
  BookOpen,
  Check,
  AlertCircle
} from 'lucide-react';

interface AttemptDetailsModalProps {
  attempt: StudentTestAttempt | null;
  onClose: () => void;
}

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

export default function AttemptDetailsModal({ attempt, onClose }: AttemptDetailsModalProps) {
  useEffect(() => {
    if (!attempt) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attempt, onClose]);

  if (!attempt) return null;

  const { data: details, isLoading } = useTestAttemptDetails(attempt.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-cardBg border border-border rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between bg-white flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  attempt.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {attempt.passed ? 'Passed Attempt' : 'Failed Attempt'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                <Award className="w-3 h-3 text-amber-600" /> Rank #{attempt.rank}
              </span>
            </div>
            <h3 className="text-lg font-black text-text-primary tracking-tight">
              {attempt.studentName || 'Student'}
            </h3>
            <p className="text-xs text-text-secondary font-medium">{attempt.studentEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-2 rounded-xl hover:bg-slate-100 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-text-primary">
          {/* Test Meta info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Test Title</div>
              <div className="text-base font-extrabold text-text-primary mt-0.5">{attempt.testTitle}</div>
            </div>
            <div className="text-[11px] text-text-secondary font-semibold flex items-center gap-1.5 flex-shrink-0">
              <Calendar className="w-4 h-4 text-text-secondary/80" />
              <span>Submitted: {new Date(attempt.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl border border-border bg-white text-center shadow-sm">
              <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Score</div>
              <div className="text-2xl font-black text-text-primary mt-1">
                {attempt.totalScore}
                <span className="text-xs text-text-secondary font-bold"> / {attempt.totalMarks}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-white text-center shadow-sm">
              <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Accuracy</div>
              <div className="text-2xl font-black text-text-primary mt-1">{attempt.accuracy}%</div>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-white text-center shadow-sm">
              <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Time Taken</div>
              <div className="text-xl font-black text-text-primary mt-1 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-text-secondary/70" />
                {formatDuration(attempt.timeTaken)}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-white text-center shadow-sm">
              <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Pass Status</div>
              <div
                className={`text-base font-black mt-1.5 ${
                  attempt.passed ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {attempt.passed ? 'PASSED' : 'FAILED'}
              </div>
            </div>
          </div>

          {/* Breakdown summary */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-text-secondary">Question Breakdown</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-center">
                <div className="text-xl font-black text-green-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {attempt.correct}
                </div>
                <div className="text-[10px] font-bold text-green-700 uppercase mt-0.5">Correct Answers</div>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                <div className="text-xl font-black text-red-700 flex items-center justify-center gap-1">
                  <XCircle className="w-4 h-4" /> {attempt.wrong}
                </div>
                <div className="text-[10px] font-bold text-red-700 uppercase mt-0.5">Wrong Answers</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
                <div className="text-xl font-black text-slate-700 flex items-center justify-center gap-1">
                  <HelpCircle className="w-4 h-4" /> {attempt.skipped}
                </div>
                <div className="text-[10px] font-bold text-slate-700 uppercase mt-0.5">Skipped</div>
              </div>
            </div>
          </div>

          {/* Sections Breakdown if Sectioned */}
          {details?.sections && details.sections.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent" /> Section-wise Performance
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {details.sections.map((sec: any) => (
                  <div key={sec.section_id} className="p-3.5 rounded-xl border border-border bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-text-primary">{sec.name}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          sec.cutoff_met ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {sec.cutoff_met ? 'Cutoff Met' : 'Below Cutoff'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>Score: <strong className="text-text-primary">{sec.score_raw}</strong> / {sec.total_marks}</span>
                      <span>Cutoff: {sec.cutoff_marks}</span>
                      <span>Accuracy: <strong>{sec.accuracy}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Question Review List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-accent" /> Question Review & Solutions
              </div>
              {details?.questions && (
                <span className="text-[11px] font-bold text-text-secondary">
                  {details.questions.length} Questions
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-8 bg-slate-50 border border-border rounded-2xl space-x-2 text-xs font-bold text-text-secondary">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span>Loading full question responses and explanations...</span>
              </div>
            ) : !details?.questions || details.questions.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-secondary bg-slate-50 border border-border rounded-2xl">
                Question-level detail not available for this attempt.
              </div>
            ) : (
              <div className="space-y-3">
                {details.questions.map((q: any, idx: number) => {
                  const isCorrect = q.user_answer?.is_correct;
                  const isSkipped =
                    !q.user_answer ||
                    (!q.user_answer.selected_ids?.length &&
                      q.user_answer.boolean_answer === null &&
                      !q.user_answer.text_answer);

                  return (
                    <div
                      key={q.id || idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSkipped
                          ? 'border-slate-200 bg-slate-50/50'
                          : isCorrect
                          ? 'border-green-200 bg-green-50/20'
                          : 'border-red-200 bg-red-50/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-white border border-border flex items-center justify-center text-xs font-black text-text-primary">
                            {idx + 1}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              isSkipped
                                ? 'bg-slate-200 text-slate-700'
                                : isCorrect
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isSkipped ? (
                              <>
                                <HelpCircle className="w-3 h-3" /> Skipped
                              </>
                            ) : isCorrect ? (
                              <>
                                <Check className="w-3 h-3" /> Correct (+{q.user_answer?.marks_awarded || q.marks?.correct || 1})
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Wrong ({q.user_answer?.marks_awarded || -q.marks?.wrong || 0})
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Question Content */}
                      <p className="mt-2.5 text-xs font-bold text-text-primary leading-relaxed">
                        {q.question_text_en || q.question_text_ta || 'Question'}
                      </p>

                      {/* Options listing if choices available */}
                      {q.choices && q.choices.length > 0 && (
                        <div className="mt-3 space-y-1.5 pl-2 border-l-2 border-border/80">
                          {q.choices.map((c: any) => {
                            const isUserSelected = q.user_answer?.selected_ids?.includes(c.id);
                            const isRightAnswer = c.is_correct;

                            let optionStyle = 'bg-white border-border text-text-secondary';
                            if (isRightAnswer) {
                              optionStyle = 'bg-green-50 border-green-300 text-green-800 font-bold';
                            } else if (isUserSelected && !isRightAnswer) {
                              optionStyle = 'bg-red-50 border-red-300 text-red-800 font-bold';
                            }

                            return (
                              <div
                                key={c.id}
                                className={`text-xs px-3 py-2 rounded-xl border flex items-center justify-between gap-2 ${optionStyle}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-bold">{c.label || '•'}</span>
                                  <span>{c.text_en || c.text_ta}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px] font-black">
                                  {isUserSelected && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-text-primary">
                                      Student Answer
                                    </span>
                                  )}
                                  {isRightAnswer && (
                                    <span className="px-1.5 py-0.5 rounded bg-green-200 text-green-800">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation if present */}
                      {(q.explanation_en || q.explanation_ta) && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] space-y-1">
                          <div className="font-extrabold text-amber-900 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Explanation:
                          </div>
                          <p className="text-amber-950 leading-relaxed font-medium">
                            {q.explanation_en || q.explanation_ta}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end bg-slate-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
