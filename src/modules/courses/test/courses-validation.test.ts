import { describe, it, expect } from 'vitest';
import { moduleSchema, lessonSchema } from '../../../core/validation';

describe('Courses Module Validation Schemas', () => {
  describe('moduleSchema', () => {
    it('should validate correctly with valid titles', () => {
      const result = moduleSchema.safeParse({ title: 'Module 1: Introduction' });
      expect(result.success).toBe(true);
    });

    it('should reject titles less than 3 characters', () => {
      const result = moduleSchema.safeParse({ title: 'Ab' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be at least 3 characters');
      }
    });

    it('should reject titles longer than 100 characters', () => {
      const longTitle = 'a'.repeat(101);
      const result = moduleSchema.safeParse({ title: longTitle });
      expect(result.success).toBe(false);
    });
  });

  describe('lessonSchema', () => {
    const validLesson = {
      title: 'Valid Lesson Title',
      description: 'This is a long description describing lesson outcomes and instructions.',
      driveFileId: '1Ab2Cd3Ef4Gh5Ij6Kl7Mn8Op9Qr0St',
      durationMinutes: 15,
    };

    it('should validate correctly with valid payloads', () => {
      const result = lessonSchema.safeParse(validLesson);
      expect(result.success).toBe(true);
    });

    it('should reject description with less than 10 characters', () => {
      const result = lessonSchema.safeParse({
        ...validLesson,
        description: 'Short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must be at least 10 characters');
      }
    });

    it('should reject Google Drive URL instead of File ID', () => {
      const result = lessonSchema.safeParse({
        ...validLesson,
        driveFileId: 'https://drive.google.com/file/d/1Ab2Cd3Ef/view?usp=sharing',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Enter a valid YouTube URL, Video ID, or legacy Drive ID (full Drive URLs are not supported)');
      }
    });

    it('should accept valid YouTube URL', () => {
      const result = lessonSchema.safeParse({
        ...validLesson,
        driveFileId: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid duration inputs', () => {
      const result = lessonSchema.safeParse({
        ...validLesson,
        durationMinutes: -5,
      });
      expect(result.success).toBe(false);
    });
  });
});
