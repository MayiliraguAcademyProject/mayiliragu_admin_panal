import { Search, X, Loader2, Plus, GraduationCap, FileText } from 'lucide-react';
import type { Student } from '../../../core/types';

interface TestBatchShort {
  id: string;
  title: string;
  description?: string;
  targetCategory: string;
  isEnabled?: boolean;
  isAvailableForGuest?: boolean;
  totalCategories?: number;
  totalQuestionPapers?: number;
  categories?: any[];
  schedulePdfUrl?: string;
}

interface EnrollTestBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudent: Student | null;
  batchSearchQuery: string;
  setBatchSearchQuery: (q: string) => void;
  availableBatches: TestBatchShort[];
  onEnroll: (batchId: string) => Promise<void>;
  isEnrollingId: string | null;
}

export default function EnrollTestBatchModal({
  isOpen,
  onClose,
  selectedStudent,
  batchSearchQuery,
  setBatchSearchQuery,
  availableBatches,
  onEnroll,
  isEnrollingId,
}: EnrollTestBatchModalProps) {
  if (!isOpen || !selectedStudent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border/45 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
                Enroll Test Batch
              </h3>
            </div>
            <p className="text-xs text-text-secondary font-medium mt-1">
              Assign a test series batch to <strong className="text-text-primary">{selectedStudent.name}</strong>.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Batch search bar */}
        <div className="p-4 bg-slate-50/60 border-b border-border/40">
          <div className="flex items-center bg-cardBg border border-border/50 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by title, description or category..."
              value={batchSearchQuery}
              onChange={(e) => setBatchSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-text-primary placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Batches listing */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {availableBatches.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <GraduationCap className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-text-secondary font-semibold">
                No test batches found matching your search.
              </p>
            </div>
          ) : (
            availableBatches.map((batch) => {
              const paperCount = batch.totalQuestionPapers ?? (
                batch.categories?.reduce((acc: number, c: any) => acc + (c.questionPapers?.length || 0), 0) ?? 0
              );
              const categoryCount = batch.totalCategories ?? (batch.categories?.length ?? 0);

              return (
                <div
                  key={batch.id}
                  onClick={() => onEnroll(batch.id)}
                  className="p-3.5 bg-cardBg border border-border/60 hover:border-accent/50 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 group hover:shadow-sm"
                >
                  <div className="flex items-start space-x-3 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 text-accent font-black text-xs">
                      {batch.targetCategory?.slice(0, 3)?.toUpperCase() || 'EXM'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-extrabold text-xs text-text-primary truncate group-hover:text-accent transition-colors">
                          {batch.title}
                        </span>
                        {batch.isEnabled === false && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            Unpublished
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {batch.targetCategory || 'TNPSC'}
                        </span>
                        <span className="text-[10px] text-text-secondary font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span>{paperCount} Papers ({categoryCount} Sections)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isEnrollingId === batch.id}
                    className="p-2 text-accent group-hover:scale-110 transition-transform disabled:opacity-50 flex-shrink-0"
                  >
                    {isEnrollingId === batch.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-accent/10 group-hover:bg-accent group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
