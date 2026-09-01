export interface TestBatchQuestionPaper {
  id: string;
  categoryId: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  unlocksAt?: string | null;
  answerKeyUrl?: string | null;
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

export interface TestBatchEnrollment {
  id: string;
  batchId: string;
  studentId: string;
  name?: string;
  email?: string;
  student?: {
    id: string;
    name?: string;
    fullName?: string;
    email: string;
  };
  enrolledAt: string;
}

export interface TestBatchOmrSubmissionItem {
  id: string;
  paperId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  paperTitle?: string;
  categoryName?: string;
  student?: {
    id: string;
    name?: string;
    fullName?: string;
    email: string;
  };
  paper?: {
    id: string;
    title: string;
  };
  omrFileUrl: string;
  omrFileName: string;
  totalMarks?: number | null;
  submittedAt: string;
  updatedAt: string;
}

export interface BulkCleanupOmrResult {
  deleted: number;
  message?: string;
  warnings?: string[];
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
