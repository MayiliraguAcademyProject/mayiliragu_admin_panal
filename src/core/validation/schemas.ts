import { z } from 'zod';

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
  thumbnail: z.string().optional(),
  lockMode: z.enum(['free', 'sequential']).optional(),
  isDemo: z.boolean().optional(),
});

export type CourseFormValues = z.infer<typeof courseSchema>;

// Module Validation Schema
export const moduleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
});

export type ModuleFormValues = z.infer<typeof moduleSchema>;

// Topic Validation Schema
export const topicSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional().or(z.literal('')),
});

export type TopicFormValues = z.infer<typeof topicSchema>;

// Video / Lesson Validation Schema
export const videoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  image: z.string().optional().or(z.literal('')),
  driveFileId: z.string().min(1, 'Video ID or URL is required').refine(
    (val) => {
      if (!val || val.trim() === '') return false;
      const clean = val.trim();
      if (!clean.includes('/') && !clean.includes('http')) return true;
      if (clean.includes('youtube.com') || clean.includes('youtu.be')) return true;
      return false;
    },
    'Enter a valid YouTube URL, Video ID, or legacy Drive ID (full Drive URLs are not supported)'
  ),
  durationMinutes: z.number().nonnegative('Duration must be non-negative'),
  downloadEnabled: z.boolean().optional(),
});

export const lessonSchema = videoSchema;

export type VideoFormValues = z.infer<typeof videoSchema>;
export type LessonFormValues = VideoFormValues;
