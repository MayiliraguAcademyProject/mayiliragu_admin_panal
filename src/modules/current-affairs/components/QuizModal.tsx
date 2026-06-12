import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  form: any;
}

export default function QuizModal({ isOpen, onClose, onSubmit, form }: QuizModalProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-cardBg border border-border rounded-3xl shadow-2xl overflow-hidden transform my-8">
        <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">Practice Quiz Manager</h3>
              <p className="text-xs text-text-secondary mt-0.5">Define multiple choice questions for this current affairs article.</p>
            </div>
            <button
              type="button"
              onClick={() => append({
                questionEn: '', questionTa: '',
                optionAEn: '', optionBEn: '', optionCEn: '', optionDEn: '',
                correctAnswer: 'A',
                explanationEn: ''
              })}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add MCQ</span>
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {fields.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-slate-50/20">
                <p className="text-xs text-text-secondary font-semibold">No questions created yet. Click "Add MCQ" above.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {fields.map((field, idx) => (
                  <div key={field.id} className="bg-slate-50/40 border border-border/80 rounded-2xl p-5 space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="absolute top-4 right-4 p-2 bg-red-50 text-red-650 hover:bg-red-100 rounded-xl transition-all"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">Question #{idx + 1}</h4>

                    {/* Question write-up */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Question Text (EN)</label>
                        <input
                          type="text"
                          placeholder="e.g. Which country launched the satellite?"
                          {...form.register(`questions.${idx}.questionEn`)}
                          className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Question Text (TA - Optional)</label>
                        <input
                          type="text"
                          placeholder="Question text in Tamil"
                          {...form.register(`questions.${idx}.questionTa`)}
                          className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-white"
                        />
                      </div>
                    </div>

                    {/* Options A & B */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Option A (EN)</label>
                        <input
                          type="text"
                          {...form.register(`questions.${idx}.optionAEn`)}
                          className="w-full px-4 py-2 bg-white rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Option B (EN)</label>
                        <input
                          type="text"
                          {...form.register(`questions.${idx}.optionBEn`)}
                          className="w-full px-4 py-2 bg-white rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary"
                        />
                      </div>
                    </div>

                    {/* Options C & D */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Option C (EN)</label>
                        <input
                          type="text"
                          {...form.register(`questions.${idx}.optionCEn`)}
                          className="w-full px-4 py-2 bg-white rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Option D (EN)</label>
                        <input
                          type="text"
                          {...form.register(`questions.${idx}.optionDEn`)}
                          className="w-full px-4 py-2 bg-white rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary"
                        />
                      </div>
                    </div>

                    {/* Tamil Options (Optional) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-text-secondary uppercase">Option A (TA)</label>
                        <input type="text" {...form.register(`questions.${idx}.optionATa`)} className="w-full px-3 py-1.5 bg-white rounded-lg border text-[11px] outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-text-secondary uppercase">Option B (TA)</label>
                        <input type="text" {...form.register(`questions.${idx}.optionBTa`)} className="w-full px-3 py-1.5 bg-white rounded-lg border text-[11px] outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-text-secondary uppercase">Option C (TA)</label>
                        <input type="text" {...form.register(`questions.${idx}.optionCTa`)} className="w-full px-3 py-1.5 bg-white rounded-lg border text-[11px] outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-text-secondary uppercase">Option D (TA)</label>
                        <input type="text" {...form.register(`questions.${idx}.optionDTa`)} className="w-full px-3 py-1.5 bg-white rounded-lg border text-[11px] outline-none" />
                      </div>
                    </div>

                    {/* Correct Option select */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Correct Answer Option</label>
                        <select
                          {...form.register(`questions.${idx}.correctAnswer`)}
                          className="w-full px-4 py-2 bg-white rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary"
                        >
                          <option>A</option>
                          <option>B</option>
                          <option>C</option>
                          <option>D</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">Explanation / Rationale (EN)</label>
                        <input
                          type="text"
                          placeholder="Explanation text for the answers card"
                          {...form.register(`questions.${idx}.explanationEn`)}
                          className="w-full px-4 py-2 bg-white rounded-xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-md"
              >
                Save Practice Quiz
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
