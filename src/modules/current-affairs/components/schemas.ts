import { z } from 'zod';

export const articleSchema = z.object({
  titleEn: z.string().min(5, 'Title (English) must be at least 5 characters'),
  titleTa: z.string().optional(),
  summaryEn: z.string().min(10, 'Summary (English) must be at least 10 characters'),
  summaryTa: z.string().optional(),
  contentEn: z.string().min(20, 'Content (English) must be at least 20 characters'),
  contentTa: z.string().optional(),
  examImportanceEn: z.string().optional(),
  examImportanceTa: z.string().optional(),
  keyFactsEn: z.string().optional(),
  keyFactsTa: z.string().optional(),
  prelimsNotesEn: z.string().optional(),
  prelimsNotesTa: z.string().optional(),
  mainsNotesEn: z.string().optional(),
  mainsNotesTa: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  publishedDate: z.string().min(1, 'Published Date is required'),
  videoUrl: z.string().optional(),
  isPublished: z.boolean(),
});

export const quizQuestionSchema = z.object({
  questionEn: z.string().min(5, 'Question (English) is required'),
  questionTa: z.string().optional(),
  optionAEn: z.string().min(1, 'Option A (English) is required'),
  optionATa: z.string().optional(),
  optionBEn: z.string().min(1, 'Option B (English) is required'),
  optionBTa: z.string().optional(),
  optionCEn: z.string().min(1, 'Option C (English) is required'),
  optionCTa: z.string().optional(),
  optionDEn: z.string().min(1, 'Option D (English) is required'),
  optionDTa: z.string().optional(),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanationEn: z.string().optional(),
  explanationTa: z.string().optional(),
});

export const quizFormSchema = z.object({
  questions: z.array(quizQuestionSchema),
});

export const magazineSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2030),
});

export const schemeSchema = z.object({
  titleEn: z.string().min(5, 'Title (English) is required'),
  titleTa: z.string().optional(),
  descriptionEn: z.string().min(10, 'Description (English) is required'),
  descriptionTa: z.string().optional(),
  type: z.enum(['Central', 'State']),
});

export const dateSchema = z.object({
  titleEn: z.string().min(3, 'Title (English) is required'),
  titleTa: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['National', 'International', 'Commemorative']),
});
