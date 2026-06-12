import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useCourseDetail,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson
} from '../../../core/api/endpoints';
import type { Module, Lesson } from '../../../core/types';
import {
  ArrowLeft,
  BookOpen,
  Video,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

import type { ModuleFormValues, LessonFormValues } from '../../../core/validation';
import ModuleModal from '../components/ModuleModal';
import LessonModal from '../components/LessonModal';

export default function CourseDetailPage() {
  const { id: courseId = '' } = useParams<{ id: string }>();
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  // Module Modal states
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  // Lesson Modal states
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string>('');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('education-app@mayiliragu.iam.gserviceaccount.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Queries & Mutations
  const { data: course, isLoading, isError, refetch } = useCourseDetail(courseId);

  const createModuleMutation = useCreateModule(courseId);
  const updateModuleMutation = useUpdateModule(courseId);
  const deleteModuleMutation = useDeleteModule(courseId);

  const createLessonMutation = useCreateLesson(courseId, targetModuleId);
  const updateLessonMutation = useUpdateLesson(courseId);
  const deleteLessonMutation = useDeleteLesson(courseId);

  // Module submit handler
  const onModuleSubmit = async (values: ModuleFormValues) => {
    try {
      if (editingModule) {
        await updateModuleMutation.mutateAsync({
          id: editingModule.id,
          data: { title: values.title },
        });
      } else {
        const order = course?.modules?.length ?? 0;
        await createModuleMutation.mutateAsync({
          title: values.title,
          order,
        });
      }
      setIsModuleDialogOpen(false);
      setEditingModule(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Lesson submit handler
  const onLessonSubmit = async (values: LessonFormValues) => {
    try {
      const durationSeconds = values.durationMinutes * 60;
      if (editingLesson) {
        await updateLessonMutation.mutateAsync({
          id: editingLesson.id,
          data: {
            title: values.title,
            description: values.description,
            driveFileId: values.driveFileId,
            duration: durationSeconds,
          },
        });
      } else {
        const module = course?.modules?.find((m) => m.id === targetModuleId);
        const order = module?.lessons?.length ?? 0;
        await createLessonMutation.mutateAsync({
          title: values.title,
          description: values.description,
          driveFileId: values.driveFileId,
          duration: durationSeconds,
          order,
        });
      }
      setIsLessonDialogOpen(false);
      setEditingLesson(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Reorder Modules (Up/Down programmatic shift)
  const handleReorderModules = async (index: number, direction: 'up' | 'down') => {
    const modules = [...(course?.modules ?? [])].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    // Swap order values
    const item1 = modules[index];
    const item2 = modules[targetIndex];

    try {
      await Promise.all([
        updateModuleMutation.mutateAsync({ id: item1.id, data: { order: item2.order } }),
        updateModuleMutation.mutateAsync({ id: item2.id, data: { order: item1.order } }),
      ]);
    } catch (err) {
      console.error('Failed to swap module order:', err);
    }
  };

  // Reorder Lessons (Up/Down programmatic shift)
  const handleReorderLessons = async (module: Module, index: number, direction: 'up' | 'down') => {
    const lessons = [...(module.lessons ?? [])].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    // Swap order values
    const item1 = lessons[index];
    const item2 = lessons[targetIndex];

    try {
      await Promise.all([
        updateLessonMutation.mutateAsync({ id: item1.id, data: { order: item2.order } }),
        updateLessonMutation.mutateAsync({ id: item2.id, data: { order: item1.order } }),
      ]);
    } catch (err) {
      console.error('Failed to swap lesson order:', err);
    }
  };

  const handleOpenCreateModule = () => {
    setEditingModule(null);
    setIsModuleDialogOpen(true);
  };

  const handleOpenEditModule = (module: Module) => {
    setEditingModule(module);
    setIsModuleDialogOpen(true);
  };

  const handleDeleteModule = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete module "${title}"? All nested lessons will be permanently deleted.`)) {
      try {
        await deleteModuleMutation.mutateAsync(id);
        if (expandedModuleId === id) setExpandedModuleId(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOpenCreateLesson = (moduleId: string) => {
    setEditingLesson(null);
    setTargetModuleId(moduleId);
    setIsLessonDialogOpen(true);
  };

  const handleOpenEditLesson = (moduleId: string, lesson: Lesson) => {
    setEditingLesson(lesson);
    setTargetModuleId(moduleId);
    setIsLessonDialogOpen(true);
  };

  const handleDeleteLesson = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete lesson "${title}"?`)) {
      try {
        await deleteLessonMutation.mutateAsync(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center flex flex-col justify-center items-center h-64 space-y-3">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="text-text-secondary text-sm font-semibold">Loading course structure...</p>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 bg-red-50 border border-red-200 rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-red-800">Failed to Load Course Details</h2>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  const sortedModules = [...(course.modules ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in relative">

      {/* Back to courses */}
      <Link
        to="/courses"
        className="inline-flex items-center space-x-2 text-text-secondary hover:text-accent font-bold text-xs transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Curriculum</span>
      </Link>

      {/* Course Header Hero Card */}
      <div className="bg-cardBg border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-48 h-32 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 relative border border-border/40">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500';
            }}
          />
        </div>
        <div className="space-y-3 flex-grow">
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            {course.title}
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed max-w-2xl font-medium">
            {course.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-[10px] font-black tracking-widest text-[#008A7C] uppercase bg-[#008A7C]/5 border border-[#008A7C]/10 px-3 py-1 rounded-full">
              {sortedModules.length} Modules
            </span>
            <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              {course.totalLessons ?? 0} Lessons
            </span>
          </div>
        </div>
      </div>

      {/* Modules list section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
              Syllabus Structure
            </h2>
          </div>
          <button
            onClick={handleOpenCreateModule}
            className="flex items-center space-x-1.5 bg-[#EAF2FF] hover:bg-[#E2EEFF] text-[#0A56D1] font-bold py-2 px-4 rounded-xl text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Module</span>
          </button>
        </div>

        {/* List of modules */}
        {sortedModules.length === 0 ? (
          <div className="bg-cardBg border border-border/50 border-dashed rounded-3xl p-10 text-center space-y-2">
            <p className="text-text-secondary text-sm font-semibold">No modules added to this course yet.</p>
            <button
              onClick={handleOpenCreateModule}
              className="text-xs font-bold text-accent hover:underline"
            >
              Create the first module now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedModules.map((module, mIdx) => {
              const isExpanded = expandedModuleId === module.id;
              const moduleLessons = [...(module.lessons ?? [])].sort((a, b) => a.order - b.order);

              return (
                <div
                  key={module.id}
                  className="bg-cardBg border border-border/60 rounded-3xl overflow-hidden shadow-sm"
                >
                  {/* Module Header Bar */}
                  <div
                    onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/40 select-none transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">

                      {/* Sorting controls for Module */}
                      <div className="flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleReorderModules(mIdx, 'up')}
                          disabled={mIdx === 0}
                          className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-text-secondary hover:text-accent"
                          title="Move Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReorderModules(mIdx, 'down')}
                          disabled={mIdx === sortedModules.length - 1}
                          className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-text-secondary hover:text-accent"
                          title="Move Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-text-secondary font-black bg-slate-100 px-2 py-0.5 rounded-md">
                            M{mIdx + 1}
                          </span>
                          <h4 className="font-extrabold text-sm sm:text-base text-text-primary tracking-tight truncate">
                            {module.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-text-secondary font-medium mt-0.5">
                          {moduleLessons.length} lessons in this block
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditModule(module)}
                        className="p-2 rounded-xl hover:bg-slate-100 text-text-secondary hover:text-accent transition-colors"
                        title="Rename Module"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module.id, module.title)}
                        className="p-2 rounded-xl hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors"
                        title="Delete Module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-95' : ''}`} />
                    </div>
                  </div>

                  {/* Lessons detail list */}
                  {isExpanded && (
                    <div className="border-t border-border/40 bg-slate-50/10 p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">
                          Module Lectures
                        </span>
                        <button
                          onClick={() => handleOpenCreateLesson(module.id)}
                          className="flex items-center space-x-1 text-accent hover:text-accent-onContainer font-bold text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Lesson</span>
                        </button>
                      </div>

                      {moduleLessons.length === 0 ? (
                        <p className="text-text-secondary text-xs font-semibold py-4 text-center">
                          No lessons added under this module yet.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {moduleLessons.map((lesson, lIdx) => (
                            <div
                              key={lesson.id}
                              className="bg-cardBg border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-all duration-200"
                            >
                              <div className="flex items-start space-x-3 min-w-0">

                                {/* Lesson Sorting controls */}
                                <div className="flex flex-col items-center justify-center pt-0.5">
                                  <button
                                    onClick={() => handleReorderLessons(module, lIdx, 'up')}
                                    disabled={lIdx === 0}
                                    className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-text-secondary hover:text-accent"
                                    title="Move Up"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleReorderLessons(module, lIdx, 'down')}
                                    disabled={lIdx === moduleLessons.length - 1}
                                    className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-text-secondary hover:text-accent"
                                    title="Move Down"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="min-w-0 space-y-1">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <span className="text-[9px] text-[#008A7C] font-black bg-[#008A7C]/5 px-2 py-0.5 rounded">
                                      Lesson {lIdx + 1}
                                    </span>
                                    <h5 className="font-extrabold text-sm text-text-primary tracking-tight">
                                      {lesson.title}
                                    </h5>
                                  </div>
                                  <p className="text-xs text-text-secondary leading-normal line-clamp-2">
                                    {lesson.description}
                                  </p>

                                  {/* Lesson meta counts */}
                                  <div className="flex items-center space-x-4 pt-1 text-[10px] text-text-secondary font-semibold">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3.5 h-3.5 text-accent" />
                                      <span>{Math.round(lesson.duration / 60)} minutes</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <Video className="w-3.5 h-3.5 text-indigo-500" />
                                      <span className="font-mono">ID: {lesson.driveFileId}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-end space-x-1 self-end sm:self-center">
                                <button
                                  onClick={() => handleOpenEditLesson(module.id, lesson)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-text-secondary hover:text-accent transition-colors"
                                  title="Edit Lesson"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors"
                                  title="Delete Lesson"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Module dialog */}
      <ModuleModal
        isOpen={isModuleDialogOpen}
        onClose={() => setIsModuleDialogOpen(false)}
        onSubmit={onModuleSubmit}
        editingModule={editingModule}
      />

      {/* Lesson dialog */}
      <LessonModal
        isOpen={isLessonDialogOpen}
        onClose={() => setIsLessonDialogOpen(false)}
        onSubmit={onLessonSubmit}
        editingLesson={editingLesson}
        copiedEmail={copiedEmail}
        onCopyEmail={handleCopyEmail}
      />

    </div>
  );
}
