import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(3, 'Category name must be at least 3 characters'),
  description: z.string().optional(),
});

export const materialSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  subjectId: z.string().optional().nullable(),
  topicId: z.string().optional().nullable(),
  accessType: z.enum(['FREE', 'PREMIUM', 'COURSE_RESTRICTED']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});
