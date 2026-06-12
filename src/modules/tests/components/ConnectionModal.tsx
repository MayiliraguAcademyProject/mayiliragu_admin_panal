import { X } from 'lucide-react';

interface CourseShort {
  id: string;
  title: string;
  modules?: Array<{ id: string; title: string }>;
}

interface TestShort {
  id: string;
  title: string;
  course_id?: string | null;
  question_count?: number;
}

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  courses: CourseShort[];
  selectedCourseDetail: CourseShort | undefined;
  newConnCourseId: string;
  setNewConnCourseId: (id: string) => void;
  newConnModuleId: string;
  setNewConnModuleId: (id: string) => void;
  newConnTestId: string;
  setNewConnTestId: (id: string) => void;
  tests: TestShort[];
}

export default function ConnectionModal({
  isOpen,
  onClose,
  onSubmit,
  courses,
  selectedCourseDetail,
  newConnCourseId,
  setNewConnCourseId,
  newConnModuleId,
  setNewConnModuleId,
  newConnTestId,
  setNewConnTestId,
  tests,
}: ConnectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <form 
        onSubmit={onSubmit}
        className="w-full max-w-md bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-border/45 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight">Create Course Connection</h3>
            <p className="text-xs text-text-secondary font-medium mt-0.5">Link a mock test profile to a course module.</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Select Course */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">Select Course</label>
            <select
              value={newConnCourseId}
              onChange={(e) => {
                setNewConnCourseId(e.target.value);
                setNewConnModuleId('');
              }}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-secondary bg-slate-50/20"
            >
              <option value="">-- Choose Course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Select Module (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">Select Module (Optional)</label>
            <select
              value={newConnModuleId}
              onChange={(e) => setNewConnModuleId(e.target.value)}
              disabled={!newConnCourseId}
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-secondary bg-slate-50/20 disabled:opacity-50"
            >
              <option value="">Entire Course Syllabus</option>
              {selectedCourseDetail?.modules?.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          {/* Select Test to Link */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">Select Test to Connect</label>
            <select
              value={newConnTestId}
              onChange={(e) => setNewConnTestId(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent outline-none text-xs font-bold text-text-secondary bg-slate-50/20"
            >
              <option value="">-- Choose Test --</option>
              {tests.filter((t) => !t.course_id).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.question_count || 0} Questions)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-border/40 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-border hover:bg-slate-50 text-xs font-bold rounded-xl text-text-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 bg-accent hover:bg-accent-onContainer text-xs font-bold rounded-xl text-white shadow-md shadow-accent/15 transition-all"
          >
            Create Linking
          </button>
        </div>
      </form>
    </div>
  );
}
