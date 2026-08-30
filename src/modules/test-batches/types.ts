export interface TestBatchQuestionPaper {
  id: string;
  categoryId: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  order: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestBatchQuestionCategory {
  id: string;
  batchId: string;
  name: string;
  syllabus?: string | null;
  order: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  questionPapers: TestBatchQuestionPaper[];
}

export interface TestBatch {
  id: string;
  title: string;
  description?: string | null;
  targetCategory: string;
  schedulePdfUrl?: string | null;
  schedulePdfName?: string | null;
  omrPdfUrl?: string | null;
  omrPdfName?: string | null;
  order: number;
  isEnabled: boolean;
  isAvailableForGuest?: boolean;
  createdAt: string;
  updatedAt: string;
  totalCategories?: number;
  totalQuestionPapers?: number;
  categories?: TestBatchQuestionCategory[];
}
