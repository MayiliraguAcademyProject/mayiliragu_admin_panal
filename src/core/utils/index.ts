/**
 * Helper utility to filter out already enrolled courses
 */
export function getAvailableCourses(
  allCourses: { id: string; title: string; thumbnail: string }[], 
  enrolledCourseIds: Set<string>
) {
  return allCourses.filter(course => !enrolledCourseIds.has(course.id));
}

/**
 * Converts minutes to seconds
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

/**
 * Converts seconds to minutes, rounded
 */
export function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

/**
 * Validates Google Drive File ID (checks if it's not a full URL or path)
 */
export function isValidDriveFileId(val: string): boolean {
  return !val.includes('/') && !val.includes('http') && !val.includes('drive.google');
}

/**
 * Simple client-side validation schema helper for Question payloads
 */
export function validateQuestionPayload(payload: any): { isValid: boolean; error?: string } {
  if (!payload.question_text_en || payload.question_text_en.trim() === '') {
    return { isValid: false, error: 'Question text in English is required' };
  }
  if (!payload.exam_category || payload.exam_category.trim() === '') {
    return { isValid: false, error: 'Exam Category is required' };
  }
  if (payload.type === 'single_choice' || payload.type === 'multi_choice') {
    if (!payload.options || !Array.isArray(payload.options) || payload.options.length < 2) {
      return { isValid: false, error: 'Choice questions must have at least 2 options' };
    }
    const hasEmptyOption = payload.options.some((o: any) => !o.text_en || o.text_en.trim() === '');
    if (hasEmptyOption) {
      return { isValid: false, error: 'All options must have English text' };
    }
    const hasCorrect = payload.options.some((o: any) => o.is_correct);
    if (!hasCorrect) {
      return { isValid: false, error: 'At least one option must be marked as correct' };
    }
  } else if (payload.type === 'fill_in_blank') {
    if (!payload.accepted_answers || !Array.isArray(payload.accepted_answers) || payload.accepted_answers.length === 0) {
      return { isValid: false, error: 'Fill in the blank questions must have at least one accepted answer' };
    }
    const hasEmptyAnswer = payload.accepted_answers.some((a: any) => !a.value || a.value.trim() === '');
    if (hasEmptyAnswer) {
      return { isValid: false, error: 'Accepted answer phrases cannot be empty' };
    }
  } else if (payload.type === 'descriptive') {
    if (payload.word_limit !== undefined && (isNaN(payload.word_limit) || payload.word_limit <= 0)) {
      return { isValid: false, error: 'Word limit must be a positive number' };
    }
  }
  return { isValid: true };
}

/**
 * Simple client-side validation helper for Test payloads
 */
export function validateTestPayload(payload: any): { isValid: boolean; error?: string } {
  if (!payload.title || payload.title.trim() === '') {
    return { isValid: false, error: 'Test title is required' };
  }
  if (payload.duration === undefined || payload.duration <= 0) {
    return { isValid: false, error: 'Duration must be greater than 0 minutes' };
  }
  if (payload.cutoff_marks === undefined || payload.cutoff_marks < 0 || payload.cutoff_marks > 100) {
    return { isValid: false, error: 'Cutoff passing score must be between 0% and 100%' };
  }
  if (!payload.questions || !Array.isArray(payload.questions) || payload.questions.length === 0) {
    return { isValid: false, error: 'At least one question must be selected for the test' };
  }
  return { isValid: true };
}
