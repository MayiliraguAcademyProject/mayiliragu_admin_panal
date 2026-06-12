import { Search, X, Loader2, Plus } from 'lucide-react';
import type { Student } from '../../../core/types';

interface CourseShort {
  id: string;
  title: string;
  thumbnail: string;
}

interface EnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudent: Student | null;
  courseSearchQuery: string;
  setCourseSearchQuery: (q: string) => void;
  availableCourses: CourseShort[];
  onEnroll: (courseId: string) => Promise<void>;
  isEnrollingId: string | null;
}

export default function EnrollModal({
  isOpen,
  onClose,
  selectedStudent,
  courseSearchQuery,
  setCourseSearchQuery,
  availableCourses,
  onEnroll,
  isEnrollingId,
}: EnrollModalProps) {
  if (!isOpen || !selectedStudent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border/45 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
              Enroll Student
            </h3>
            <p className="text-xs text-text-secondary font-medium mt-0.5">
              Select a course to enroll <strong className="text-text-primary">{selectedStudent.name}</strong>.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course search bar */}
        <div className="p-4 bg-slate-50/60 border-b border-border/40">
          <div className="flex items-center bg-cardBg border border-border/50 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Filter available courses..."
              value={courseSearchQuery}
              onChange={(e) => setCourseSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-text-primary placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Courses listing */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {availableCourses.length === 0 ? (
            <p className="text-center text-xs text-text-secondary py-8 font-semibold">
              No further courses available for enrollment.
            </p>
          ) : (
            availableCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => onEnroll(course.id)}
                className="p-3 bg-cardBg border border-border/50 hover:border-accent/40 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-border/40">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500';
                      }}
                    />
                  </div>
                  <span className="font-extrabold text-xs text-text-primary truncate group-hover:text-accent transition-colors">
                    {course.title}
                  </span>
                </div>

                <button
                  disabled={isEnrollingId === course.id}
                  className="p-1 text-accent group-hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {isEnrollingId === course.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
