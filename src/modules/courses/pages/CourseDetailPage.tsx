import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useCourseDetail,
  useUpdateCourse,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useLessonStats,
  useReorderModules,
  useReorderLessons,
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
  AlertCircle,
  Download,
  Users,
  Lock,
  Unlock,
  GripVertical,
} from 'lucide-react';

import type { ModuleFormValues, LessonFormValues } from '../../../core/validation';
import ModuleModal from '../components/ModuleModal';
import LessonModal from '../components/LessonModal';
import ConfirmModal from '../../../shared/components/ConfirmModal';

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
  const [selectedLessonForStats, setSelectedLessonForStats] = useState<Lesson | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [deletingLessonTitle, setDeletingLessonTitle] = useState<string>('');

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('mayiliraguacadamy@mayiliragu-501911.iam.gserviceaccount.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Queries & Mutations
  const { data: course, isLoading, isError, refetch } = useCourseDetail(courseId);
  const updateCourseMutation = useUpdateCourse();

  const handleToggleLockMode = async (mode: 'free' | 'sequential') => {
    if (!course) return;
    try {
      await updateCourseMutation.mutateAsync({
        id: courseId,
        data: { lockMode: mode },
      });
    } catch (err) {
      console.error('Failed to update course lock mode:', err);
    }
  };

  const createModuleMutation = useCreateModule(courseId);
  const updateModuleMutation = useUpdateModule(courseId);
  const deleteModuleMutation = useDeleteModule(courseId);

  const createLessonMutation = useCreateLesson(courseId, targetModuleId);
  const updateLessonMutation = useUpdateLesson(courseId);
  const deleteLessonMutation = useDeleteLesson(courseId);

  const reorderModulesMutation = useReorderModules(courseId);
  const reorderLessonsMutation = useReorderLessons(courseId);

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
  const onLessonSubmit = async (values: LessonFormValues, file?: File | null) => {
    try {
      const durationSeconds = values.durationMinutes * 60;
      if (editingLesson) {
        await updateLessonMutation.mutateAsync({
          id: editingLesson.id,
          data: {
            title: values.title,
            description: values.description,
            image: values.image,
            driveFileId: values.driveFileId,
            duration: durationSeconds,
            downloadEnabled: values.downloadEnabled,
          },
          file,
        });
      } else {
        const module = course?.modules?.find((m) => m.id === targetModuleId);
        const order = module?.lessons?.length ?? 0;
        await createLessonMutation.mutateAsync({
          data: {
            title: values.title,
            description: values.description,
            image: values.image,
            driveFileId: values.driveFileId,
            duration: durationSeconds,
            order,
            downloadEnabled: values.downloadEnabled,
          },
          file,
        });
      }
      setIsLessonDialogOpen(false);
      setEditingLesson(null);
    } catch (err) {
      console.error(err);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndModules = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !course) return;

    const modules = [...(course.modules ?? [])].sort((a, b) => a.order - b.order);
    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(modules, oldIndex, newIndex);
    const items = reordered.map((m, idx) => ({ id: m.id, order: idx + 1 }));

    try {
      await reorderModulesMutation.mutateAsync(items);
    } catch (err) {
      console.error('Failed to reorder modules:', err);
    }
  };

  const handleDragEndLessons = async (module: Module, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const lessons = [...(module.lessons ?? [])].sort((a, b) => a.order - b.order);
    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(lessons, oldIndex, newIndex);
    const items = reordered.map((l, idx) => ({ id: l.id, order: idx + 1 }));

    try {
      await reorderLessonsMutation.mutateAsync(items);
    } catch (err) {
      console.error('Failed to reorder lessons:', err);
    }
  };

  // Reorder Modules (Up/Down programmatic shift)
  const handleReorderModules = async (index: number, direction: 'up' | 'down') => {
    const modules = [...(course?.modules ?? [])].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const reordered = arrayMove(modules, index, targetIndex);
    const items = reordered.map((m, idx) => ({ id: m.id, order: idx + 1 }));

    try {
      await reorderModulesMutation.mutateAsync(items);
    } catch (err) {
      console.error('Failed to swap module order:', err);
    }
  };

  // Reorder Lessons (Up/Down programmatic shift)
  const handleReorderLessons = async (module: Module, index: number, direction: 'up' | 'down') => {
    const lessons = [...(module.lessons ?? [])].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const reordered = arrayMove(lessons, index, targetIndex);
    const items = reordered.map((l, idx) => ({ id: l.id, order: idx + 1 }));

    try {
      await reorderLessonsMutation.mutateAsync(items);
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

  const handleDeleteLesson = (id: string, title: string) => {
    setDeletingLessonId(id);
    setDeletingLessonTitle(title);
  };

  const handleConfirmDeleteLesson = async () => {
    if (!deletingLessonId) return;
    try {
      await deleteLessonMutation.mutateAsync(deletingLessonId);
    } catch (err) {
      console.error(err);
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

            {/* Lock Mode Selector Toggle */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 ml-auto">
              <button
                type="button"
                onClick={() => handleToggleLockMode('free')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  (course.lockMode || 'free') === 'free'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Free Access</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleLockMode('sequential')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  course.lockMode === 'sequential'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sequential Unlock</span>
              </button>
            </div>
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndModules}
          >
            <SortableContext
              items={sortedModules.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sortedModules.map((module, mIdx) => {
                  const isExpanded = expandedModuleId === module.id;
                  const moduleLessons = [...(module.lessons ?? [])].sort((a, b) => a.order - b.order);

                  return (
                    <SortableModuleItem
                      key={module.id}
                      module={module}
                      mIdx={mIdx}
                      totalModules={sortedModules.length}
                      isExpanded={isExpanded}
                      onToggleExpand={() => setExpandedModuleId(isExpanded ? null : module.id)}
                      onEdit={() => handleOpenEditModule(module)}
                      onDelete={() => handleDeleteModule(module.id, module.title)}
                      onReorderUp={() => handleReorderModules(mIdx, 'up')}
                      onReorderDown={() => handleReorderModules(mIdx, 'down')}
                    >
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
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(e) => handleDragEndLessons(module, e)}
                            >
                              <SortableContext
                                items={moduleLessons.map((l) => l.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-2.5">
                                  {moduleLessons.map((lesson, lIdx) => (
                                    <SortableLessonItem
                                      key={lesson.id}
                                      lesson={lesson}
                                      lIdx={lIdx}
                                      totalLessons={moduleLessons.length}
                                      onEdit={() => handleOpenEditLesson(module.id, lesson)}
                                      onDelete={() => handleDeleteLesson(lesson.id, lesson.title)}
                                      onReorderUp={() => handleReorderLessons(module, lIdx, 'up')}
                                      onReorderDown={() => handleReorderLessons(module, lIdx, 'down')}
                                      onSelectStats={() => setSelectedLessonForStats(lesson)}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}
                        </div>
                      )}
                    </SortableModuleItem>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
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

      {/* Student watch stats dialog */}
      {selectedLessonForStats && (
        <StudentWatchStatsModal
          lesson={selectedLessonForStats}
          onClose={() => setSelectedLessonForStats(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={deletingLessonId !== null}
        onClose={() => {
          setDeletingLessonId(null);
          setDeletingLessonTitle('');
        }}
        onConfirm={handleConfirmDeleteLesson}
        title="Delete Lesson"
        message={`Are you sure you want to delete lesson "${deletingLessonTitle}"? This action cannot be undone.`}
      />

    </div>
  );
}

interface StudentWatchStatsModalProps {
  lesson: Lesson;
  onClose: () => void;
}

function StudentWatchStatsModal({ lesson, onClose }: StudentWatchStatsModalProps) {
  const { data: statsData, isLoading, isError } = useLessonStats(lesson.id);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-text-primary dark:text-white">
              Student Watching Progress
            </h3>
            <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
              Lesson: {lesson.title} (Duration: {Math.round(lesson.duration / 60)} mins)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="text-sm text-text-secondary dark:text-slate-400">Loading progress details...</p>
            </div>
          ) : isError ? (
            <div className="flex items-center space-x-2 text-red-600 justify-center py-12">
              <AlertCircle className="w-5 h-5" />
              <span>Failed to load stats. Please try again.</span>
            </div>
          ) : !statsData?.stats || statsData.stats.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              No students have watched this lesson yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4">Student</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Percentage</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Last Viewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {statsData.stats.map((row: any) => {
                    const pct = Math.min(
                      100,
                      Math.round((row.watchedSeconds / lesson.duration) * 100)
                    );
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-text-primary dark:text-white">
                            {row.student?.name || 'Unknown Student'}
                          </div>
                          <div className="text-xs text-text-secondary dark:text-slate-400">
                            {row.student?.email || '-'}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs dark:text-slate-300">
                          {formatDuration(row.watchedSeconds)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-accent h-1.5 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold dark:text-slate-300">
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          {row.completed ? (
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full">
                              In Progress
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-text-secondary dark:text-slate-400">
                          {row.lastViewedAt ? new Date(row.lastViewedAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface SortableModuleItemProps {
  module: Module;
  mIdx: number;
  totalModules: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReorderUp: () => void;
  onReorderDown: () => void;
  children?: React.ReactNode;
}

function SortableModuleItem({
  module,
  mIdx,
  totalModules,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onReorderUp,
  onReorderDown,
  children,
}: SortableModuleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-cardBg border border-border/60 rounded-3xl overflow-hidden shadow-sm"
    >
      <div
        onClick={onToggleExpand}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/40 select-none transition-colors"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            title="Drag to reorder module"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          <div className="flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onReorderUp}
              disabled={mIdx === 0}
              className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-text-secondary hover:text-accent"
              title="Move Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={onReorderDown}
              disabled={mIdx === totalModules - 1}
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
              {(module.lessons ?? []).length} lessons in this block
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="p-2 rounded-xl hover:bg-slate-100 text-text-secondary hover:text-accent transition-colors"
            title="Rename Module"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors"
            title="Delete Module"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronRight className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-95' : ''}`} />
        </div>
      </div>
      {children}
    </div>
  );
}

interface SortableLessonItemProps {
  lesson: Lesson;
  lIdx: number;
  totalLessons: number;
  onEdit: () => void;
  onDelete: () => void;
  onReorderUp: () => void;
  onReorderDown: () => void;
  onSelectStats: () => void;
}

function SortableLessonItem({
  lesson,
  lIdx,
  totalLessons,
  onEdit,
  onDelete,
  onReorderUp,
  onReorderDown,
  onSelectStats,
}: SortableLessonItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-cardBg border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-all duration-200"
    >
      <div className="flex items-start space-x-3 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="p-1 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 hover:bg-slate-100 self-center"
          title="Drag to reorder lesson"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex flex-col items-center justify-center pt-0.5">
          <button
            onClick={onReorderUp}
            disabled={lIdx === 0}
            className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-text-secondary hover:text-accent"
            title="Move Up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onReorderDown}
            disabled={lIdx === totalLessons - 1}
            className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-text-secondary hover:text-accent"
            title="Move Down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {lesson.image && (
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-border/40">
            <img
              src={lesson.image}
              alt={lesson.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

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

          <div className="flex items-center space-x-4 pt-1 text-[10px] text-text-secondary font-semibold">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>{Math.round(lesson.duration / 60)} minutes</span>
            </span>
            <span className="flex items-center space-x-1">
              <Video className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-mono">ID: {lesson.driveFileId}</span>
            </span>
            <span className={`flex items-center space-x-1 ${lesson.downloadEnabled ? 'text-green-600' : 'text-slate-400'}`}>
              <Download className="w-3.5 h-3.5" />
              <span>{lesson.downloadEnabled ? 'Download Enabled' : 'Download Disabled'}</span>
            </span>
            <button
              onClick={onSelectStats}
              className="flex items-center space-x-1 text-accent hover:underline cursor-pointer transition-all hover:scale-105 font-bold"
              title="View Watching Progress"
            >
              <Users className="w-3.5 h-3.5 text-accent" />
              <span>Watch Stats</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-1 self-end sm:self-center">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-text-secondary hover:text-accent transition-colors"
          title="Edit Lesson"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors"
          title="Delete Lesson"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
