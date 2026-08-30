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
  useReorderModules,
  useCreateCourseTopic,
  useUpdateCourseTopic,
  useDeleteCourseTopic,
  useReorderCourseTopics,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useReorderLessons,
  useCreateVideo,
  useUpdateVideo,
  useDeleteVideo,
  useReorderVideos,
  useLessonStats,
} from '../../../core/api/endpoints';
import type { Module, Topic, Lesson, LessonVideo } from '../../../core/types';
import {
  ArrowLeft,
  BookOpen,
  FolderTree,
  FileText,
  Video,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Clock,
  ChevronRight,
  AlertCircle,
  Users,
  Lock,
  Unlock,
  GripVertical,
} from 'lucide-react';

import type { ModuleFormValues, TopicFormValues, LessonFormValues, VideoFormValues } from '../../../core/validation';
import ModuleModal from '../components/ModuleModal';
import TopicModal from '../components/TopicModal';
import LessonModal from '../components/LessonModal';
import VideoModal from '../components/VideoModal';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import RefreshButton from '../../../shared/components/RefreshButton';
import { useToast } from '../../../shared/context';
import { extractErrorMessage } from '../../../shared/utils';

export default function CourseDetailPage() {
  const toast = useToast();
  const { id: courseId = '' } = useParams<{ id: string }>();

  // Accordion expansion states
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  // Module Modal states
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  // Topic Modal states
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string>('');
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Lesson Modal states
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [targetTopicId, setTargetTopicId] = useState<string>('');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Video Modal states
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [targetLessonId, setTargetLessonId] = useState<string>('');
  const [editingVideo, setEditingVideo] = useState<LessonVideo | null>(null);

  // Deletion Confirmation states
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'module' | 'topic' | 'lesson' | 'video';
    id: string;
    title: string;
  } | null>(null);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedLessonForStats, setSelectedLessonForStats] = useState<Lesson | null>(null);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('mayiliraguacadamy@mayiliragu-501911.iam.gserviceaccount.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Queries & Mutations
  const { data: course, isLoading, isError, refetch, isRefetching } = useCourseDetail(courseId);
  const updateCourseMutation = useUpdateCourse();

  const createModuleMutation = useCreateModule(courseId);
  const updateModuleMutation = useUpdateModule(courseId);
  const deleteModuleMutation = useDeleteModule(courseId);
  const reorderModulesMutation = useReorderModules(courseId);

  const createTopicMutation = useCreateCourseTopic(courseId, targetModuleId);
  const updateTopicMutation = useUpdateCourseTopic(courseId);
  const deleteTopicMutation = useDeleteCourseTopic(courseId);
  const reorderTopicsMutation = useReorderCourseTopics(courseId, targetModuleId);

  const createLessonMutation = useCreateLesson(courseId, targetTopicId);
  const updateLessonMutation = useUpdateLesson(courseId);
  const deleteLessonMutation = useDeleteLesson(courseId);
  const reorderLessonsMutation = useReorderLessons(courseId, targetTopicId);

  const createVideoMutation = useCreateVideo(courseId, targetLessonId);
  const updateVideoMutation = useUpdateVideo(courseId);
  const deleteVideoMutation = useDeleteVideo(courseId);
  const reorderVideosMutation = useReorderVideos(courseId, targetLessonId);

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

  const handleToggleLockMode = async (mode: 'free' | 'sequential') => {
    if (!course) return;
    try {
      const res = await updateCourseMutation.mutateAsync({
        id: courseId,
        data: { lockMode: mode },
      });
      toast.success(res?.message || 'Course lock mode updated!');
    } catch (err) {
      console.error('Failed to update course lock mode:', err);
      toast.error(extractErrorMessage(err));
    }
  };

  // --- Module Handlers ---
  const onModuleSubmit = async (values: ModuleFormValues) => {
    try {
      if (editingModule) {
        const res = await updateModuleMutation.mutateAsync({
          id: editingModule.id,
          data: { title: values.title },
        });
        toast.success(res?.message || 'Module updated successfully!');
      } else {
        const order = course?.modules?.length ?? 0;
        const res = await createModuleMutation.mutateAsync({
          title: values.title,
          order,
        });
        toast.success(res?.message || 'Module created successfully!');
      }
      setIsModuleDialogOpen(false);
      setEditingModule(null);
    } catch (err) {
      console.error(err);
      toast.error(extractErrorMessage(err));
    }
  };

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

  // --- Topic Handlers ---
  const onTopicSubmit = async (values: TopicFormValues) => {
    try {
      if (editingTopic) {
        const res = await updateTopicMutation.mutateAsync({
          id: editingTopic.id,
          data: values,
        });
        toast.success(res?.message || 'Topic updated successfully!');
      } else {
        const currentMod = course?.modules?.find((m) => m.id === targetModuleId);
        const order = currentMod?.topics?.length ?? 0;
        const res = await createTopicMutation.mutateAsync({
          ...values,
          order,
        });
        toast.success(res?.message || 'Topic created successfully!');
      }
      setIsTopicDialogOpen(false);
      setEditingTopic(null);
    } catch (err) {
      console.error(err);
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDragEndTopics = async (_moduleId: string, topics: Topic[], event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = topics.findIndex((t) => t.id === active.id);
    const newIndex = topics.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(topics, oldIndex, newIndex);
    const orderedIds = reordered.map((t) => t.id);

    try {
      await reorderTopicsMutation.mutateAsync(orderedIds);
    } catch (err) {
      console.error('Failed to reorder topics:', err);
    }
  };

  // --- Lesson Handlers ---
  const onLessonSubmit = async (values: LessonFormValues, file?: File | null) => {
    try {
      if (editingLesson) {
        const res = await updateLessonMutation.mutateAsync({
          id: editingLesson.id,
          data: {
            title: values.title,
            description: values.description,
            image: values.image,
          },
          file,
        });
        toast.success(res?.message || 'Lesson updated successfully!');
      } else {
        // Find topic
        let topicOrder = 0;
        course?.modules?.forEach((m) => {
          const t = m.topics?.find((top) => top.id === targetTopicId);
          if (t) topicOrder = t.lessons?.length ?? 0;
        });

        const res = await createLessonMutation.mutateAsync({
          data: {
            title: values.title,
            description: values.description,
            image: values.image,
            order: topicOrder,
          },
          file,
        });
        toast.success(res?.message || 'Lesson created successfully!');
      }
      setIsLessonDialogOpen(false);
      setEditingLesson(null);
    } catch (err) {
      console.error(err);
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDragEndLessons = async (_topicId: string, lessons: Lesson[], event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(lessons, oldIndex, newIndex);
    const orderedIds = reordered.map((l) => l.id);

    try {
      await reorderLessonsMutation.mutateAsync(orderedIds);
    } catch (err) {
      console.error('Failed to reorder lessons:', err);
    }
  };

  // --- Video Handlers ---
  const onVideoSubmit = async (values: VideoFormValues, file?: File | null) => {
    try {
      if (editingVideo) {
        const res = await updateVideoMutation.mutateAsync({
          id: editingVideo.id,
          data: {
            title: values.title,
            description: values.description,
            image: values.image,
            driveFileId: values.driveFileId,
            durationMinutes: values.durationMinutes,
            downloadEnabled: values.downloadEnabled,
          },
          file,
        });
        toast.success(res?.message || 'Video updated successfully!');
      } else {
        let videoOrder = 0;
        course?.modules?.forEach((m) => {
          m.topics?.forEach((t) => {
            const l = t.lessons?.find((les) => les.id === targetLessonId);
            if (l) videoOrder = l.videos?.length ?? 0;
          });
        });

        const res = await createVideoMutation.mutateAsync({
          data: {
            title: values.title,
            description: values.description,
            image: values.image,
            driveFileId: values.driveFileId,
            durationMinutes: values.durationMinutes,
            order: videoOrder,
            downloadEnabled: values.downloadEnabled,
          },
          file,
        });
        toast.success(res?.message || 'Video added successfully!');
      }
      setIsVideoDialogOpen(false);
      setEditingVideo(null);
    } catch (err) {
      console.error(err);
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDragEndVideos = async (_lessonId: string, videos: LessonVideo[], event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = videos.findIndex((v) => v.id === active.id);
    const newIndex = videos.findIndex((v) => v.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(videos, oldIndex, newIndex);
    const orderedIds = reordered.map((v) => v.id);

    try {
      await reorderVideosMutation.mutateAsync(orderedIds);
    } catch (err) {
      console.error('Failed to reorder videos:', err);
    }
  };

  // --- Deletion Confirmer ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'module') {
        const res = await deleteModuleMutation.mutateAsync(deleteTarget.id);
        toast.success(res?.message || 'Module deleted successfully!');
        if (expandedModuleId === deleteTarget.id) setExpandedModuleId(null);
      } else if (deleteTarget.type === 'topic') {
        const res = await deleteTopicMutation.mutateAsync(deleteTarget.id);
        toast.success(res?.message || 'Topic deleted successfully!');
        if (expandedTopicId === deleteTarget.id) setExpandedTopicId(null);
      } else if (deleteTarget.type === 'lesson') {
        const res = await deleteLessonMutation.mutateAsync(deleteTarget.id);
        toast.success(res?.message || 'Lesson deleted successfully!');
        if (expandedLessonId === deleteTarget.id) setExpandedLessonId(null);
      } else if (deleteTarget.type === 'video') {
        const res = await deleteVideoMutation.mutateAsync(deleteTarget.id);
        toast.success(res?.message || 'Video deleted successfully!');
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(extractErrorMessage(err));
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

  // Count metrics
  let totalTopicsCount = 0;
  let totalLessonsCount = 0;
  let totalVideosCount = 0;

  sortedModules.forEach((m) => {
    totalTopicsCount += m.topics?.length ?? 0;
    m.topics?.forEach((t) => {
      totalLessonsCount += t.lessons?.length ?? 0;
      t.lessons?.forEach((l) => {
        totalVideosCount += l.videos?.length ?? 0;
      });
    });
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in relative">

      {/* Back to courses */}
      <div className="flex items-center justify-between">
        <Link
          to="/courses"
          className="inline-flex items-center space-x-2 text-text-secondary hover:text-accent font-bold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Curriculum</span>
        </Link>
        <RefreshButton onRefresh={refetch} isRefetching={isRefetching} />
      </div>

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
            {/* Active Status Badge */}
            <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full ${
              course.isActive !== false
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {course.isActive !== false ? 'Active' : 'Inactive'}
            </span>

            {/* Availability Status Tag */}
            {course.availabilityStatus === 'upcoming' && (
              <span className="text-[10px] font-black tracking-widest text-blue-700 uppercase bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                Upcoming {course.timeRemainingText ? `(${course.timeRemainingText})` : ''}
              </span>
            )}
            {course.availabilityStatus === 'closing_soon' && (
              <span className="text-[10px] font-black tracking-widest text-amber-700 uppercase bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                Closing Soon {course.timeRemainingText ? `(${course.timeRemainingText})` : ''}
              </span>
            )}
            {course.availabilityStatus === 'expired' && (
              <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase bg-slate-100 border border-slate-300 px-3 py-1 rounded-full">
                Expired
              </span>
            )}

            <span className="text-[10px] font-black tracking-widest text-[#008A7C] uppercase bg-[#008A7C]/5 border border-[#008A7C]/10 px-3 py-1 rounded-full">
              {sortedModules.length} Modules
            </span>
            <span className="text-[10px] font-black tracking-widest text-purple-600 uppercase bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
              {totalTopicsCount} Topics
            </span>
            <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              {totalLessonsCount} Lessons
            </span>
            <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
              {totalVideosCount} Videos
            </span>

            {/* Quick Status Toggle Button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  const nextStatus = course.isActive === false ? true : false;
                  await updateCourseMutation.mutateAsync({
                    id: courseId,
                    data: { isActive: nextStatus },
                  });
                  toast.success(`Course ${nextStatus ? 'activated' : 'deactivated'} successfully!`);
                } catch (err) {
                  toast.error(extractErrorMessage(err));
                }
              }}
              className={`text-xs font-bold px-3 py-1 rounded-xl border transition-colors ${
                course.isActive !== false
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {course.isActive !== false ? 'Turn Off' : 'Turn On'}
            </button>

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

          {/* Availability Dates Banner if set */}
          {(course.startDate || course.endDate) && (
            <div className="flex items-center space-x-4 pt-1 text-xs text-text-secondary font-semibold">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-accent" />
                <span>
                  Schedule: {course.startDate ? new Date(course.startDate).toLocaleString() : 'Immediate'} 
                  {' — '} 
                  {course.endDate ? new Date(course.endDate).toLocaleString() : 'Indefinite'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modules list section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
              Curriculum Structure
            </h2>
          </div>
          <button
            onClick={() => {
              setEditingModule(null);
              setIsModuleDialogOpen(true);
            }}
            className="flex items-center space-x-1.5 bg-accent hover:bg-accent-onContainer text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md shadow-accent/15 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Module</span>
          </button>
        </div>

        {sortedModules.length === 0 ? (
          <div className="bg-cardBg border border-border/50 border-dashed rounded-3xl p-10 text-center space-y-2">
            <p className="text-text-secondary text-sm font-semibold">No modules added to this course yet.</p>
            <button
              onClick={() => {
                setEditingModule(null);
                setIsModuleDialogOpen(true);
              }}
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
              <div className="space-y-4">
                {sortedModules.map((module, mIdx) => {
                  const isModExpanded = expandedModuleId === module.id;
                  const moduleTopics = [...(module.topics ?? [])].sort((a, b) => a.order - b.order);

                  return (
                    <SortableModuleItem
                      key={module.id}
                      module={module}
                      mIdx={mIdx}
                      isExpanded={isModExpanded}
                      onToggleExpand={() => setExpandedModuleId(isModExpanded ? null : module.id)}
                      onEdit={() => {
                        setEditingModule(module);
                        setIsModuleDialogOpen(true);
                      }}
                      onDelete={() => setDeleteTarget({ type: 'module', id: module.id, title: module.title })}
                    >
                      {/* Topics inside Module */}
                      {isModExpanded && (
                        <div className="border-t border-border/40 bg-slate-50/20 p-4 sm:p-6 space-y-4">
                          <div className="flex items-center justify-between pb-1 border-b border-border/30">
                            <div className="flex items-center space-x-1.5 text-xs font-black text-purple-700 uppercase tracking-wider">
                              <FolderTree className="w-4 h-4" />
                              <span>Topics & Chapters</span>
                            </div>
                            <button
                              onClick={() => {
                                setTargetModuleId(module.id);
                                setEditingTopic(null);
                                setIsTopicDialogOpen(true);
                              }}
                              className="flex items-center space-x-1 bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Topic</span>
                            </button>
                          </div>

                          {moduleTopics.length === 0 ? (
                            <p className="text-text-secondary text-xs font-semibold py-4 text-center">
                              No topics added under this module yet. Click "Add Topic" above to get started.
                            </p>
                          ) : (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(e) => handleDragEndTopics(module.id, moduleTopics, e)}
                            >
                              <SortableContext
                                items={moduleTopics.map((t) => t.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-3">
                                  {moduleTopics.map((topic, tIdx) => {
                                    const isTopicExpanded = expandedTopicId === topic.id;
                                    const topicLessons = [...(topic.lessons ?? [])].sort((a, b) => a.order - b.order);

                                    return (
                                      <SortableTopicItem
                                        key={topic.id}
                                        topic={topic}
                                        tIdx={tIdx}
                                        isExpanded={isTopicExpanded}
                                        onToggleExpand={() => setExpandedTopicId(isTopicExpanded ? null : topic.id)}
                                        onEdit={() => {
                                          setTargetModuleId(module.id);
                                          setEditingTopic(topic);
                                          setIsTopicDialogOpen(true);
                                        }}
                                        onDelete={() => setDeleteTarget({ type: 'topic', id: topic.id, title: topic.title })}
                                      >
                                        {/* Lessons inside Topic */}
                                        {isTopicExpanded && (
                                          <div className="border-t border-border/40 bg-slate-50/40 p-4 space-y-3">
                                            <div className="flex items-center justify-between pb-1">
                                              <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                                                <FileText className="w-3.5 h-3.5" />
                                                <span>Lessons</span>
                                              </div>
                                              <button
                                                onClick={() => {
                                                  setTargetTopicId(topic.id);
                                                  setEditingLesson(null);
                                                  setIsLessonDialogOpen(true);
                                                }}
                                                className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-2.5 py-1 rounded-lg font-bold text-xs transition-colors"
                                              >
                                                <Plus className="w-3 h-3" />
                                                <span>Add Lesson</span>
                                              </button>
                                            </div>

                                            {topicLessons.length === 0 ? (
                                              <p className="text-text-secondary text-xs font-medium py-3 text-center">
                                                No lessons added under this topic yet.
                                              </p>
                                            ) : (
                                              <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={(e) => handleDragEndLessons(topic.id, topicLessons, e)}
                                              >
                                                <SortableContext
                                                  items={topicLessons.map((l) => l.id)}
                                                  strategy={verticalListSortingStrategy}
                                                >
                                                  <div className="space-y-3">
                                                    {topicLessons.map((lesson, lIdx) => {
                                                      const isLessonExpanded = expandedLessonId === lesson.id;
                                                      const lessonVideos = [...(lesson.videos ?? [])].sort((a, b) => a.order - b.order);

                                                      return (
                                                        <SortableLessonItem
                                                          key={lesson.id}
                                                          lesson={lesson}
                                                          lIdx={lIdx}
                                                          isExpanded={isLessonExpanded}
                                                          onToggleExpand={() => setExpandedLessonId(isLessonExpanded ? null : lesson.id)}
                                                          onEdit={() => {
                                                            setTargetTopicId(topic.id);
                                                            setEditingLesson(lesson);
                                                            setIsLessonDialogOpen(true);
                                                          }}
                                                          onDelete={() => setDeleteTarget({ type: 'lesson', id: lesson.id, title: lesson.title })}
                                                          onSelectStats={() => setSelectedLessonForStats(lesson)}
                                                        >
                                                          {/* Videos inside Lesson */}
                                                          {isLessonExpanded && (
                                                            <div className="border-t border-border/40 bg-white p-3.5 rounded-b-xl space-y-2.5">
                                                              <div className="flex items-center justify-between pb-1">
                                                                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                                                                  <Video className="w-3.5 h-3.5" />
                                                                  <span>Lesson Video Playlist ({lessonVideos.length})</span>
                                                                </div>
                                                                <button
                                                                  onClick={() => {
                                                                    setTargetLessonId(lesson.id);
                                                                    setEditingVideo(null);
                                                                    setIsVideoDialogOpen(true);
                                                                  }}
                                                                  className="flex items-center space-x-1 bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded-lg font-bold text-xs transition-colors"
                                                                >
                                                                  <Plus className="w-3 h-3" />
                                                                  <span>Add Video</span>
                                                                </button>
                                                             </div>

                                                              {lessonVideos.length === 0 ? (
                                                                <p className="text-text-secondary text-xs py-2 text-center">
                                                                  No videos added to this lesson yet. Click "Add Video" to add one.
                                                                </p>
                                                              ) : (
                                                                <DndContext
                                                                  sensors={sensors}
                                                                  collisionDetection={closestCenter}
                                                                  onDragEnd={(e) => handleDragEndVideos(lesson.id, lessonVideos, e)}
                                                                >
                                                                  <SortableContext
                                                                    items={lessonVideos.map((v) => v.id)}
                                                                    strategy={verticalListSortingStrategy}
                                                                  >
                                                                    <div className="space-y-2">
                                                                      {lessonVideos.map((video, vIdx) => (
                                                                        <SortableVideoItem
                                                                          key={video.id}
                                                                          video={video}
                                                                          vIdx={vIdx}
                                                                          onEdit={() => {
                                                                            setTargetLessonId(lesson.id);
                                                                            setEditingVideo(video);
                                                                            setIsVideoDialogOpen(true);
                                                                          }}
                                                                          onDelete={() => setDeleteTarget({ type: 'video', id: video.id, title: video.title })}
                                                                        />
                                                                      ))}
                                                                    </div>
                                                                  </SortableContext>
                                                                </DndContext>
                                                              )}
                                                            </div>
                                                          )}
                                                        </SortableLessonItem>
                                                      );
                                                    })}
                                                  </div>
                                                </SortableContext>
                                              </DndContext>
                                            )}
                                          </div>
                                        )}
                                      </SortableTopicItem>
                                    );
                                  })}
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
        isLoading={createModuleMutation.isPending || updateModuleMutation.isPending}
      />

      {/* Topic dialog */}
      <TopicModal
        isOpen={isTopicDialogOpen}
        onClose={() => setIsTopicDialogOpen(false)}
        onSubmit={onTopicSubmit}
        editingTopic={editingTopic}
        isLoading={createTopicMutation.isPending || updateTopicMutation.isPending}
      />

      {/* Lesson dialog */}
      <LessonModal
        isOpen={isLessonDialogOpen}
        onClose={() => setIsLessonDialogOpen(false)}
        onSubmit={onLessonSubmit}
        editingLesson={editingLesson}
        copiedEmail={copiedEmail}
        onCopyEmail={handleCopyEmail}
        isLoading={createLessonMutation.isPending || updateLessonMutation.isPending}
      />

      {/* Video dialog */}
      <VideoModal
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        onSubmit={onVideoSubmit}
        editingVideo={editingVideo}
        copiedEmail={copiedEmail}
        onCopyEmail={handleCopyEmail}
        isLoading={createVideoMutation.isPending || updateVideoMutation.isPending}
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
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteTarget?.type ? deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1) : 'Item'}`}
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All nested content will also be deleted. This action cannot be undone.`}
        isLoading={
          deleteModuleMutation.isPending ||
          deleteTopicMutation.isPending ||
          deleteLessonMutation.isPending ||
          deleteVideoMutation.isPending
        }
      />

    </div>
  );
}

// ==========================================
// SORTABLE ITEM COMPONENTS
// ==========================================

function SortableModuleItem({
  module,
  mIdx,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  children,
}: {
  module: Module;
  mIdx: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="bg-cardBg border border-border/80 rounded-3xl overflow-hidden shadow-sm">
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

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-text-secondary font-black bg-slate-100 px-2 py-0.5 rounded-md">
                Module {mIdx + 1}
              </span>
              <h4 className="font-extrabold text-sm sm:text-base text-text-primary tracking-tight truncate">
                {module.title}
              </h4>
            </div>
            <p className="text-[11px] text-text-secondary font-medium mt-0.5">
              {(module.topics ?? []).length} topics in this module
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
          <ChevronRight className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isModExpanded(isExpanded)}`} />
        </div>
      </div>
      {children}
    </div>
  );
}

function isModExpanded(exp: boolean) {
  return exp ? 'rotate-90' : '';
}

function SortableTopicItem({
  topic,
  tIdx,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  children,
}: {
  topic: Topic;
  tIdx: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-purple-200/80 rounded-2xl overflow-hidden shadow-xs">
      <div
        onClick={onToggleExpand}
        className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-purple-50/30 select-none transition-colors"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded cursor-grab active:cursor-grabbing text-purple-400 hover:text-purple-600 hover:bg-purple-50"
            title="Drag to reorder topic"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[9px] text-purple-700 font-extrabold bg-purple-100 px-2 py-0.5 rounded">
                Topic {tIdx + 1}
              </span>
              <h5 className="font-extrabold text-sm text-text-primary tracking-tight truncate">
                {topic.title}
              </h5>
            </div>
            {topic.description && (
              <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                {topic.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {(topic.lessons ?? []).length} lessons
          </span>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-text-secondary hover:text-purple-700 transition-colors"
            title="Edit Topic"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors"
            title="Delete Topic"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${isModExpanded(isExpanded)}`} />
        </div>
      </div>
      {children}
    </div>
  );
}

function SortableLessonItem({
  lesson,
  lIdx,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onSelectStats,
  children,
}: {
  lesson: Lesson;
  lIdx: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelectStats: () => void;
  children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="bg-cardBg border border-blue-200/60 rounded-xl overflow-hidden shadow-2xs">
      <div
        onClick={onToggleExpand}
        className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer hover:bg-blue-50/20 select-none transition-colors"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded cursor-grab active:cursor-grabbing text-blue-400 hover:text-blue-600 hover:bg-blue-50"
            title="Drag to reorder lesson"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {lesson.image && (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-border/40">
              <img src={lesson.image} alt={lesson.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[9px] text-blue-700 font-extrabold bg-blue-100 px-1.5 py-0.5 rounded">
                Lesson {lIdx + 1}
              </span>
              <h6 className="font-extrabold text-sm text-text-primary tracking-tight truncate">
                {lesson.title}
              </h6>
            </div>
            {lesson.description && (
              <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                {lesson.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            {(lesson.videos ?? []).length} videos
          </span>
          <button
            onClick={onSelectStats}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-text-secondary hover:text-accent transition-colors"
            title="Watch Stats"
          >
            <Users className="w-3.5 h-3.5 text-accent" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-text-secondary hover:text-accent transition-colors"
            title="Edit Lesson"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors"
            title="Delete Lesson"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${isModExpanded(isExpanded)}`} />
        </div>
      </div>
      {children}
    </div>
  );
}

function SortableVideoItem({
  video,
  vIdx,
  onEdit,
  onDelete,
}: {
  video: LessonVideo;
  vIdx: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-slate-50/70 border border-border/70 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
    >
      <div className="flex items-center space-x-2.5 min-w-0">
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          title="Drag to reorder video"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {video.image && (
          <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-200 flex-shrink-0">
            <img src={video.image} alt={video.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center space-x-1.5 truncate">
            <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1 py-0.2 rounded">
              Video {vIdx + 1}
            </span>
            <span className="font-bold text-text-primary truncate">{video.title}</span>
          </div>
          <div className="flex items-center space-x-3 text-[10px] text-text-secondary">
            <span className="flex items-center space-x-1 font-medium">
              <Clock className="w-3 h-3 text-accent" />
              <span>{Math.round(video.duration / 60)}m</span>
            </span>
            <span className="font-mono text-slate-400 truncate max-w-[120px]">
              ID: {video.driveFileId}
            </span>
            <span className={`font-semibold ${video.downloadEnabled ? 'text-green-600' : 'text-slate-400'}`}>
              {video.downloadEnabled ? 'Offline Ready' : 'Stream Only'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1 rounded hover:bg-slate-200 text-text-secondary hover:text-accent transition-colors"
          title="Edit Video"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors"
          title="Delete Video"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Student Watch Stats Modal
function StudentWatchStatsModal({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
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
              Lesson: {lesson.title} ({lesson.videos?.length || 0} videos)
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
                    <th className="p-4">Video</th>
                    <th className="p-4">Watched</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Last Viewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {statsData.stats.map((row: any) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-text-primary dark:text-white">
                          {row.student?.name || 'Unknown Student'}
                        </div>
                        <div className="text-xs text-text-secondary dark:text-slate-400">
                          {row.student?.email || '-'}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-xs">
                        {row.video?.title || 'Video'}
                      </td>
                      <td className="p-4 font-mono text-xs dark:text-slate-300">
                        {formatDuration(row.watchedSeconds)}
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
                  ))}
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
