import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../core/api/client';
import type { TestBatch, TestBatchQuestionCategory, TestBatchQuestionPaper } from '../types';

export const testBatchKeys = {
  all: ['test-batches'] as const,
  lists: () => [...testBatchKeys.all, 'list'] as const,
  detail: (id: string) => [...testBatchKeys.all, 'detail', id] as const,
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
    }: {
      categoryId: string;
      batchId: string;
      file: File;
      title: string;
      order?: number;
    }) => {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('title', title);
      if (order !== undefined) formData.append('order', String(order));

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
