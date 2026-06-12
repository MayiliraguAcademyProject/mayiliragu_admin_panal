import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { ApiConstants } from '../constants';

// Re-export apiClient for convenience
export { apiClient };

import type { 
  Lesson, 
  Module, 
  Course, 
  CoursesListResponse, 
  Student, 
  Enrollment, 
  Question, 
  QuestionStats,
  Test,
  Banner,
  ExamCategory,
  ExamSubject,
  ExamTopic,
  TestAnalyticsStats,
  StudentTestAttempt,
  StudentProfile,
  StudentPayment,
  StudentCounselingSession,
  StudentExamApplication,
  StudentDocument,
  StudentCommunicationLog,
  CurrentAffair,
  CurrentAffairQuiz,
  MonthlyMagazine,
  GovernmentScheme,
  ImportantDate,
  StudyMaterial,
  StudyMaterialCategory,
  StudyMaterialVersion
} from '../types';

export type { 
  Lesson, 
  Module, 
  Course, 
  CoursesListResponse, 
  Student, 
  Enrollment, 
  Question, 
  QuestionStats,
  Test,
  Banner,
  ExamCategory,
  ExamSubject,
  ExamTopic,
  TestAnalyticsStats,
  StudentTestAttempt,
  StudentProfile,
  StudentPayment,
  StudentCounselingSession,
  StudentExamApplication,
  StudentDocument,
  StudentCommunicationLog,
  CurrentAffair,
  CurrentAffairQuiz,
  MonthlyMagazine,
  GovernmentScheme,
  ImportantDate,
  StudyMaterial,
  StudyMaterialCategory,
  StudyMaterialVersion
};

// ==========================================
// DASHBOARD HOOKS
// ==========================================

export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.dashboard.admin);
      return response.data;
    },
  });
}

// ==========================================
// COURSES HOOKS
// ==========================================

export function useCoursesList(page: number, limit: number) {
  return useQuery<CoursesListResponse>({
    queryKey: ['courses', page, limit],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.courses.base, {
        params: { page, limit },
      });
      return response.data;
    },
  });
}

export function useCourseDetail(courseId: string) {
  return useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.courses.detail(courseId));
      return response.data;
    },
    enabled: !!courseId,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; description: string; thumbnail: string }) => {
      const response = await apiClient.post(ApiConstants.courses.base, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Course> }) => {
      const response = await apiClient.put(ApiConstants.courses.detail(id), data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.id] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(ApiConstants.courses.detail(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

// ==========================================
// MODULES HOOKS
// ==========================================

export function useCreateModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; order: number }) => {
      const response = await apiClient.post(ApiConstants.modules.base, { ...data, courseId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

export function useUpdateModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; order?: number } }) => {
      const response = await apiClient.put(ApiConstants.modules.detail(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

export function useDeleteModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(ApiConstants.modules.detail(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

// ==========================================
// LESSONS HOOKS
// ==========================================

export function useCreateLesson(courseId: string, moduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; description: string; driveFileId: string; duration: number; order: number }) => {
      const response = await apiClient.post(ApiConstants.lessons.base, { ...data, moduleId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; description?: string; driveFileId?: string; duration?: number; order?: number } }) => {
      const response = await apiClient.put(ApiConstants.lessons.detail(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(ApiConstants.lessons.detail(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}

// ==========================================
// STUDENTS & ENROLLMENTS HOOKS
// ==========================================

export function useStudentsList() {
  return useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.students.list);
      return response.data.data;
    },
  });
}

export function useStudentEnrollments(studentId: string) {
  return useQuery<Enrollment[]>({
    queryKey: ['studentEnrollments', studentId],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.students.enrollments(studentId));
      return response.data.data;
    },
    enabled: !!studentId,
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, courseId }: { studentId: string; courseId: string }) => {
      const response = await apiClient.post(ApiConstants.students.enroll, { studentId, courseId });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentEnrollments', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
}

export function useRevokeEnrollment(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await apiClient.delete(ApiConstants.students.revoke(enrollmentId));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentEnrollments', studentId] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post(ApiConstants.students.base, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(ApiConstants.students.detail(id), data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['studentEnrollments', variables.id] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(ApiConstants.students.detail(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
}

export function useStudentProfile(userId: string) {
  return useQuery<StudentProfile>({
    queryKey: ['studentProfile', userId],
    queryFn: async () => {
      const response = await apiClient.get(`${ApiConstants.students.list}/${userId}/profile`);
      return response.data.data;
    },
    enabled: !!userId,
  });
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<StudentProfile> }) => {
      const response = await apiClient.put(`${ApiConstants.students.list}/${userId}/profile`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile', variables.userId] });
    },
  });
}

export function useAddStudentPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { amountPaid: number; paymentMethod: string; installmentInfo?: string } }) => {
      const response = await apiClient.post(`${ApiConstants.students.list}/${userId}/payments`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile', variables.userId] });
    },
  });
}

export function useAddStudentCounseling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { mentorName: string; notes: string; remarks?: string; followUpDate?: string } }) => {
      const response = await apiClient.post(`${ApiConstants.students.list}/${userId}/counseling`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile', variables.userId] });
    },
  });
}

export function useAddStudentExamApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { examName: string; notificationDate?: string; applied: boolean; applicationNo?: string; hallTicketNo?: string; examDate?: string; resultStatus?: string; finalSelection?: string } }) => {
      const response = await apiClient.post(`${ApiConstants.students.list}/${userId}/exam-applications`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile', variables.userId] });
    },
  });
}

export function useAddStudentDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { documentType: string; fileUrl: string } }) => {
      const response = await apiClient.post(`${ApiConstants.students.list}/${userId}/documents`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile', variables.userId] });
    },
  });
}

export function useAddStudentCommunication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { type: string; content: string; sentBy: string } }) => {
      const response = await apiClient.post(`${ApiConstants.students.list}/${userId}/communications`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile', variables.userId] });
    },
  });
}

// ==========================================
// QUESTIONS & TESTS HOOKS
// ==========================================

export function useQuestionsList(filters: {
  subject?: string;
  type?: string;
  difficulty?: string;
  search?: string;
}) {
  return useQuery<Question[]>({
    queryKey: ['questions', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.subject && filters.subject !== 'All Subjects') {
        params.subject = filters.subject;
      }
      if (filters.type && filters.type !== 'All Types') {
        params.type = filters.type;
      }
      if (filters.difficulty && filters.difficulty !== 'Difficulty: All') {
        params.difficulty = filters.difficulty;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      const response = await apiClient.get(ApiConstants.questions.base, { params });
      return response.data.data;
    },
  });
}

export function useQuestionStats() {
  return useQuery<QuestionStats>({
    queryKey: ['questionStats'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.questions.stats);
      return response.data.data;
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Partial<Question>, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await apiClient.post(ApiConstants.questions.base, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionStats'] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Question> }) => {
      const response = await apiClient.put(ApiConstants.questions.detail(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionStats'] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(ApiConstants.questions.detail(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionStats'] });
    },
  });
}

// ==========================================
// TESTS & TEST BUILDER ENDPOINTS
// ==========================================

export function useTestsList(filters?: { categoryId?: string; courseId?: string }) {
  return useQuery<Test[]>({
    queryKey: ['tests', filters],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.tests.base, { params: filters });
      return response.data.data;
    },
  });
}

export function useTestDetail(id?: string) {
  return useQuery<Test>({
    queryKey: ['test', id],
    queryFn: async () => {
      if (!id) throw new Error('Test ID is required');
      const response = await apiClient.get(ApiConstants.tests.detail(id));
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post(ApiConstants.tests.base, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

export function useUpdateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(ApiConstants.tests.detail(id), data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['test', variables.id] });
    },
  });
}

export function useDeleteTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(ApiConstants.tests.detail(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

// ==========================================
// BANNERS HOOKS
// ==========================================

export function useBannersAdminList() {
  return useQuery<Banner[]>({
    queryKey: ['bannersAdmin'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.banners.admin);
      return response.data;
    },
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; imageUrl: string; linkUrl?: string | null; order: number; isActive: boolean }) => {
      const response = await apiClient.post(ApiConstants.banners.base, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannersAdmin'] });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Banner> }) => {
      const response = await apiClient.put(ApiConstants.banners.detail(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannersAdmin'] });
    },
  });
}

export function useToggleBannerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(ApiConstants.banners.toggle(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannersAdmin'] });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(ApiConstants.banners.detail(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannersAdmin'] });
    },
  });
}

// ==========================================
// EXAM TAXONOMY HOOKS
// ==========================================

export function useExamCategories() {
  return useQuery<ExamCategory[]>({
    queryKey: ['examCategories'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.tests.categories);
      return response.data.data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; iconName?: string }) => {
      const response = await apiClient.post(ApiConstants.tests.categories, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examCategories'] });
    },
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { categoryId: string; name: string }) => {
      const response = await apiClient.post(ApiConstants.tests.subjects, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examCategories'] });
    },
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { subjectId: string; name: string }) => {
      const response = await apiClient.post(ApiConstants.tests.topics, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examCategories'] });
    },
  });
}

export function useTestAnalytics() {
  return useQuery<TestAnalyticsStats>({
    queryKey: ['testAnalytics'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.tests.analytics);
      return response.data.data;
    },
  });
}

export function useAllTestAttempts() {
  return useQuery<StudentTestAttempt[]>({
    queryKey: ['allTestAttempts'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.tests.attemptsAll);
      return response.data.data;
    },
  });
}

export async function downloadImportTemplate() {
  const response = await apiClient.get(ApiConstants.questions.template, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'questions_import_template.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function exportQuestionsToExcel(filters: {
  subject?: string;
  type?: string;
  difficulty?: string;
  search?: string;
}) {
  const params: Record<string, string> = {};
  if (filters.subject && filters.subject !== 'All Subjects') {
    params.subject = filters.subject;
  }
  if (filters.type && filters.type !== 'All Types') {
    params.type = filters.type;
  }
  if (filters.difficulty && filters.difficulty !== 'Difficulty: All') {
    params.difficulty = filters.difficulty;
  }
  if (filters.search) {
    params.search = filters.search;
  }

  const response = await apiClient.get(ApiConstants.questions.export, {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `questions_export_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function useImportQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(ApiConstants.questions.import, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionStats'] });
    },
  });
}

// ==========================================
// CURRENT AFFAIRS HOOKS
// ==========================================

export function useCurrentAffairsAdminList() {
  return useQuery<{ data: CurrentAffair[] }>({
    queryKey: ['currentAffairsAdmin'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.currentAffairs.admin);
      return response.data;
    },
  });
}

export function useCreateCurrentAffair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CurrentAffair, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post(ApiConstants.currentAffairs.base, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentAffairsAdmin'] });
    },
  });
}

export function useUpdateCurrentAffair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CurrentAffair> }) => {
      const response = await apiClient.put(ApiConstants.currentAffairs.detail(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentAffairsAdmin'] });
    },
  });
}

export function useDeleteCurrentAffair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(ApiConstants.currentAffairs.detail(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentAffairsAdmin'] });
    },
  });
}

export function useCurrentAffairQuizzes(articleId: string) {
  return useQuery<{ data: CurrentAffairQuiz[] }>({
    queryKey: ['currentAffairQuizzes', articleId],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.currentAffairs.quizzes(articleId));
      return response.data;
    },
    enabled: !!articleId,
  });
}

export function useCreateCurrentAffairQuizzes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ articleId, questions }: { articleId: string; questions: Omit<CurrentAffairQuiz, 'id' | 'currentAffairId'>[] }) => {
      const response = await apiClient.post(ApiConstants.currentAffairs.quizzes(articleId), { questions });
      return response.data;
    },
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: ['currentAffairQuizzes', articleId] });
      queryClient.invalidateQueries({ queryKey: ['currentAffairsAdmin'] });
    },
  });
}

export function useMagazinesList() {
  return useQuery<{ data: MonthlyMagazine[] }>({
    queryKey: ['monthlyMagazines'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.currentAffairs.magazinesAll);
      return response.data;
    },
  });
}

export function useUploadMagazine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, month, year, file }: { title: string; month: number; year: number; file: File }) => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('month', String(month));
      formData.append('year', String(year));
      formData.append('file', file);
      const response = await apiClient.post(ApiConstants.currentAffairs.magazinesUpload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyMagazines'] });
    },
  });
}

export function useSchemesList() {
  return useQuery<{ data: GovernmentScheme[] }>({
    queryKey: ['governmentSchemes'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.currentAffairs.schemesAll);
      return response.data;
    },
  });
}

export function useCreateScheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<GovernmentScheme, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post(ApiConstants.currentAffairs.schemes, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governmentSchemes'] });
    },
  });
}

export function useUpdateScheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GovernmentScheme> }) => {
      const response = await apiClient.put(`${ApiConstants.currentAffairs.schemes}/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governmentSchemes'] });
    },
  });
}

export function useDatesList() {
  return useQuery<{ data: ImportantDate[] }>({
    queryKey: ['importantDates'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.currentAffairs.datesAll);
      return response.data;
    },
  });
}

export function useCreateDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ImportantDate, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post(ApiConstants.currentAffairs.dates, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['importantDates'] });
    },
  });
}

// ==========================================
// STUDY MATERIALS HOOKS
// ==========================================

export function useStudyCategoriesList() {
  return useQuery<{ data: StudyMaterialCategory[] }>({
    queryKey: ['studyCategories'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.studyMaterials.categories);
      return response.data;
    },
  });
}

export function useCreateStudyCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiClient.post(ApiConstants.studyMaterials.categories, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyCategories'] });
    },
  });
}

export function useDeleteStudyCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(ApiConstants.studyMaterials.categoryDetail(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyCategories'] });
    },
  });
}

export function useStudyMaterialsAdminList(filters?: { categoryId?: string; status?: string; search?: string }) {
  return useQuery<{ data: StudyMaterial[] }>({
    queryKey: ['studyMaterialsAdmin', filters],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.studyMaterials.base, { params: filters });
      return response.data;
    },
  });
}

export function useCreateStudyMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, description, categoryId, accessType, status, file }: {
      title: string;
      description?: string;
      categoryId: string;
      accessType: string;
      status: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      formData.append('categoryId', categoryId);
      formData.append('accessType', accessType);
      formData.append('status', status);
      formData.append('file', file);

      const response = await apiClient.post(ApiConstants.studyMaterials.base, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyMaterialsAdmin'] });
    },
  });
}

export function useUpdateStudyMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, description, categoryId, accessType, status, file }: {
      id: string;
      title?: string;
      description?: string;
      categoryId?: string;
      accessType?: string;
      status?: string;
      file?: File;
    }) => {
      const formData = new FormData();
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      if (categoryId) formData.append('categoryId', categoryId);
      if (accessType) formData.append('accessType', accessType);
      if (status) formData.append('status', status);
      if (file) formData.append('file', file);

      const response = await apiClient.put(ApiConstants.studyMaterials.detail(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studyMaterialsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['studyMaterialDetail', variables.id] });
    },
  });
}

export function useDeleteStudyMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(ApiConstants.studyMaterials.detail(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyMaterialsAdmin'] });
    },
  });
}

export function useFacultyClassAnalytics(batchName: string) {
  return useQuery({
    queryKey: ['facultyClassAnalytics', batchName],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.analytics.facultyClass, {
        params: { batchName },
      });
      return response.data;
    },
    enabled: !!batchName,
  });
}

export function useAdminBatchComparisons() {
  return useQuery({
    queryKey: ['adminBatchComparisons'],
    queryFn: async () => {
      const response = await apiClient.get(ApiConstants.analytics.adminBatches);
      return response.data;
    },
  });
}




