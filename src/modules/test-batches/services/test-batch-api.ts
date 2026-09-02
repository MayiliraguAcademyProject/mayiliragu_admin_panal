import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../core/api/client';
import type {
  TestBatch,
  TestBatchQuestionCategory,
  TestBatchQuestionPaper,
  TestBatchEnrollment,
  TestBatchOmrSubmissionItem,
  BulkCleanupOmrResult,
} from '../types';

export const testBatchKeys = {
  all: ['test-batches'] as const,
  lists: () => [...testBatchKeys.all, 'list'] as const,
  detail: (id: string) => [...testBatchKeys.all, 'detail', id] as const,
  enrollments: (id: string) => [...testBatchKeys.all, 'enrollments', id] as const,
  omrSubmissions: (id: string) => [...testBatchKeys.all, 'omrSubmissions', id] as const,
};

// ================= FETCH BATCHES ================= //

export function useTestBatchesList() {
  return useQuery({
    queryKey: testBatchKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<{ status: string; data: TestBatch[] }>('/test-batches');
      return response.data.data;
    },
  });
}

export function useTestBatchDetail(id: string) {
  return useQuery({
    queryKey: testBatchKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<{ status: string; data: TestBatch }>(`/test-batches/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

// ================= BATCH MUTATIONS ================= //

export function useCreateTestBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      targetCategory?: string;
      order?: number;
      isEnabled?: boolean;
      isAvailableForGuest?: boolean;
    }) => {
      const response = await apiClient.post<{ status: string; data: TestBatch }>('/test-batches', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.lists() });
    },
  });
}

export function useUpdateTestBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      description?: string;
      targetCategory?: string;
      order?: number;
      isEnabled?: boolean;
      isAvailableForGuest?: boolean;
    }) => {
      const response = await apiClient.put<{ status: string; data: TestBatch }>(`/test-batches/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.id) });
    },
  });
}

export function useDeleteTestBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/test-batches/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.lists() });
    },
  });
}

// ================= SCHEDULE & OMR UPLOADS ================= //

export function useUploadSchedulePdf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('pdf', file);
      const response = await apiClient.post<{ status: string; data: TestBatch }>(
        `/test-batches/${id}/schedule`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.id) });
    },
  });
}

export function useRemoveSchedulePdf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<{ status: string; data: TestBatch }>(`/test-batches/${id}/schedule`);
      return response.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(id) });
    },
  });
}

export function useUploadOmrPdf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('pdf', file);
      const response = await apiClient.post<{ status: string; data: TestBatch }>(
        `/test-batches/${id}/omr`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.id) });
    },
  });
}

export function useRemoveOmrPdf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<{ status: string; data: TestBatch }>(`/test-batches/${id}/omr`);
      return response.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(id) });
    },
  });
}

// ================= CATEGORIES ================= //

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      batchId,
      ...data
    }: {
      batchId: string;
      name: string;
      syllabus?: string;
      order?: number;
      isEnabled?: boolean;
    }) => {
      const response = await apiClient.post<{ status: string; data: TestBatchQuestionCategory }>(
        `/test-batches/${batchId}/categories`,
        data
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      batchId,
      ...data
    }: {
      categoryId: string;
      batchId: string;
      name?: string;
      syllabus?: string;
      order?: number;
      isEnabled?: boolean;
    }) => {
      const response = await apiClient.put<{ status: string; data: TestBatchQuestionCategory }>(
        `/test-batches/categories/${categoryId}`,
        data
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

export function useToggleCategoryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ categoryId }: { categoryId: string; batchId: string }) => {
      const response = await apiClient.patch<{ status: string; data: TestBatchQuestionCategory }>(
        `/test-batches/categories/${categoryId}/toggle-status`
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ categoryId }: { categoryId: string; batchId: string }) => {
      const response = await apiClient.delete(`/test-batches/categories/${categoryId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

// ================= QUESTION PAPERS ================= //

export function useUploadQuestionPaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      file,
      title,
      order,
      answerKeyFile,
    }: {
      categoryId: string;
      batchId: string;
      file: File;
      title: string;
      order?: number;
      answerKeyFile?: File | null;
    }) => {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('title', title);
      if (order !== undefined) formData.append('order', String(order));
      if (answerKeyFile) formData.append('answerKeyPdf', answerKeyFile);

      const response = await apiClient.post<{ status: string; data: TestBatchQuestionPaper }>(
        `/test-batches/categories/${categoryId}/question-papers`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

export function useUpdateQuestionPaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paperId,
      batchId,
      ...data
    }: {
      paperId: string;
      batchId: string;
      title?: string;
      order?: number;
      isEnabled?: boolean;
      unlocksAt?: string | null;
      answerKeyUrl?: string | null;
    }) => {
      const response = await apiClient.put<{ status: string; data: TestBatchQuestionPaper }>(
        `/test-batches/question-papers/${paperId}`,
        data
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

export function useDeleteQuestionPaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paperId }: { paperId: string; batchId: string }) => {
      const response = await apiClient.delete(`/test-batches/question-papers/${paperId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

// ================= ANSWER KEYS ================= //

export function useUploadAnswerKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paperId,
      file,
    }: {
      paperId: string;
      batchId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append('pdf', file);
      const response = await apiClient.post<{ status: string; data: TestBatchQuestionPaper }>(
        `/test-batches/question-papers/${paperId}/answer-key`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

export function useRemoveAnswerKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paperId }: { paperId: string; batchId: string }) => {
      const response = await apiClient.delete<{ status: string; data: TestBatchQuestionPaper }>(
        `/test-batches/question-papers/${paperId}/answer-key`
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

// ================= BATCH ENROLLMENTS ================= //

export function useBatchEnrollments(batchId: string) {
  return useQuery({
    queryKey: testBatchKeys.enrollments(batchId),
    queryFn: async () => {
      const response = await apiClient.get<{ status: string; data: TestBatchEnrollment[] }>(
        `/test-batches/${batchId}/enrollments`
      );
      return response.data.data;
    },
    enabled: Boolean(batchId),
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ batchId, studentId }: { batchId: string; studentId: string }) => {
      const response = await apiClient.post<{ status: string; data: TestBatchEnrollment }>(
        `/test-batches/${batchId}/enrollments`,
        { studentId }
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.enrollments(variables.batchId) });
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

export function useBulkEnrollFromCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ batchId, courseId }: { batchId: string; courseId: string }) => {
      const response = await apiClient.post<{
        status: string;
        data: { enrolledCount: number; totalCourseStudents: number };
      }>(`/test-batches/${batchId}/enrollments/bulk`, { courseId });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.enrollments(variables.batchId) });
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

export function useRemoveEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ batchId, studentId }: { batchId: string; studentId: string }) => {
      const response = await apiClient.delete(`/test-batches/${batchId}/enrollments/${studentId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.enrollments(variables.batchId) });
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

// ================= BATCH OMR SUBMISSIONS & BULK CLEANUP ================= //

export function useBatchOmrSubmissions(batchId: string) {
  return useQuery({
    queryKey: testBatchKeys.omrSubmissions(batchId),
    queryFn: async () => {
      const response = await apiClient.get<{ status: string; data: TestBatchOmrSubmissionItem[] }>(
        `/test-batches/${batchId}/omr-submissions`
      );
      return response.data.data;
    },
    enabled: Boolean(batchId),
  });
}

export function useBulkDeleteOmrSubmissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (batchId: string) => {
      const response = await apiClient.delete<{ status: string; data: BulkCleanupOmrResult }>(
        `/test-batches/${batchId}/omr-submissions/bulk`
      );
      return response.data.data;
    },
    onSuccess: (_, batchId) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.omrSubmissions(batchId) });
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(batchId) });
    },
  });
}

export function useDeleteOmrSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId }: { submissionId: string; batchId: string }) => {
      const response = await apiClient.delete<{ status: string; message: string }>(
        `/test-batches/omr-submissions/${submissionId}`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.omrSubmissions(variables.batchId) });
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}

export function useDeleteStudentBatchOmrSubmissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ batchId, studentId }: { batchId: string; studentId: string }) => {
      const response = await apiClient.delete<{ status: string; data: BulkCleanupOmrResult }>(
        `/test-batches/${batchId}/students/${studentId}/omr-submissions`
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testBatchKeys.omrSubmissions(variables.batchId) });
      queryClient.invalidateQueries({ queryKey: testBatchKeys.detail(variables.batchId) });
    },
  });
}
