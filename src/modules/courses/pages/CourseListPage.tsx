import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useCoursesList, 
  useCreateCourse, 
  useUpdateCourse, 
  useDeleteCourse
} from '../../../core/api/endpoints';
import type { Course } from '../../../core/types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';

import type { CourseFormValues } from '../../../core/validation';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import CourseModal from '../components/CourseModal';

export default function CourseListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useCoursesList(page, 10);
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();

  const handleOpenCreateDialog = () => {
    setEditingCourse(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (course: Course) => {
    setEditingCourse(course);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCourse(null);
  };

  const onSubmit = async (values: CourseFormValues) => {
    try {
      if (editingCourse) {
        await updateCourseMutation.mutateAsync({
          id: editingCourse.id,
          data: values,
        });
      } else {
        await createCourseMutation.mutateAsync(values);
      }
      handleCloseDialog();
    } catch (err) {
      console.error(err);
    }
  };

  const executeDelete = async (id: string) => {
    setIsDeletingId(id);
    try {
      await deleteCourseMutation.mutateAsync(id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredCourses = data?.data.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isError) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 bg-red-50 border border-red-200 rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-red-800">Failed to Load Courses</h2>
        <p className="text-red-600 text-sm">
          Please check your network connection and try again.
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in relative">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            Curriculum Management
          </h1>
          <p className="text-text-secondary text-sm font-medium mt-1">
            Build and schedule courses, modules, and lessons.
          </p>
        </div>
        <button
          onClick={handleOpenCreateDialog}
          className="self-start sm:self-center flex items-center space-x-2 bg-accent hover:bg-accent-onContainer text-white font-bold py-3 px-5 rounded-xl shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/35 transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Add Course</span>
        </button>
      </div>

      {/* Filters & search */}
      <div className="flex items-center bg-cardBg border border-border/60 rounded-2xl px-4 py-2.5 max-w-md shadow-sm">
        <Search className="w-5 h-5 text-gray-400 mr-2.5 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search course title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-text-primary placeholder-gray-400 outline-none"
        />
      </div>

      {/* Main content grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-44 bg-cardBg border border-border/40 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-cardBg border border-border/50 rounded-3xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-extrabold text-text-primary text-lg">No Courses Found</h3>
          <p className="text-sm text-text-secondary">
            {searchQuery ? 'Adjust your search queries.' : 'Get started by creating your first course.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-cardBg border border-border/70 rounded-3xl shadow-sm hover:shadow-xl hover:scale-[1.005] hover:border-accent/30 transition-all duration-300 flex overflow-hidden group h-48 cursor-pointer relative"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              {/* Course Thumbnail */}
              <div className="w-1/3 bg-slate-100 flex-shrink-0 relative overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500';
                  }}
                />
              </div>

              {/* Course details */}
              <div className="w-2/3 p-5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-widest text-accent uppercase bg-accent/5 px-2.5 py-1 rounded-full">
                      Course
                    </span>
                    
                    {/* Hover controls container */}
                    <div 
                      className="flex items-center space-x-1"
                      onClick={(e) => e.stopPropagation()} // Stop navigation trigger
                    >
                      <button
                        onClick={() => handleOpenEditDialog(course)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-text-secondary hover:text-accent transition-colors"
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(course.id)}
                        disabled={isDeletingId === course.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete Course"
                      >
                        {isDeletingId === course.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-extrabold text-text-primary text-base line-clamp-1 group-hover:text-accent transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {course.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-text-secondary font-semibold">
                  <div className="flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-accent" />
                    <span>Curriculum Overview</span>
                  </div>
                  <span className="bg-[#EAF2FF] text-[#0A56D1] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                    {course.totalLessons ?? 0} Lessons
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination component */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border border-border/60 rounded-xl bg-cardBg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5 text-text-primary" />
          </button>
          <span className="text-xs font-bold text-text-primary px-4">
            Page {page} of {data.meta.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
            disabled={page === data.meta.totalPages}
            className="p-2 border border-border/60 rounded-xl bg-cardBg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5 text-text-primary" />
          </button>
        </div>
      )}

      {/* Course CRUD Modal */}
      <CourseModal
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={onSubmit}
        editingCourse={editingCourse}
      />

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) executeDelete(confirmDeleteId);
        }}
        title="Delete Course"
        message={`Are you sure you want to delete the course "${
          data?.data.find((c) => c.id === confirmDeleteId)?.title || ''
        }"? All associated modules and lessons will be lost.`}
      />
    </div>
  );
}
