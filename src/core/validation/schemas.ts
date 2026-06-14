import { z } from 'zod';
import { isValidDriveFileId } from '../utils';

// Login Validation Schema
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Course Validation Schema
export const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  thumbnail: z.string().min(1, 'Thumbnail URL is required').url('Must be a valid URL'),
});

export type CourseFormValues = z.infer<typeof courseSchema>;

// Module Validation Schema
export const moduleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
});

export type ModuleFormValues = z.infer<typeof moduleSchema>;

// Lesson Validation Schema
export const lessonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  driveFileId: z.string().min(1, 'Google Drive File ID is required').refine(
    isValidDriveFileId,
    'Enter ONLY the File ID itself, not the full Drive URL'
  ),
  durationMinutes: z.number().int().positive('Duration must be a positive integer'),
  downloadEnabled: z.boolean().optional(),
});

export type LessonFormValues = z.infer<typeof lessonSchema>;
