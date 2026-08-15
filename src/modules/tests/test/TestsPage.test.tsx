import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestsPage from '../pages/TestsPage';
import { renderWithProviders } from '../../../test/test-utils';

const state = vi.hoisted(() => {
  const mutation = (mutateAsync: any = vi.fn().mockResolvedValue({})) => ({
    mutateAsync,
    mutate: vi.fn(),
    isLoading: false,
    isError: false,
    isSuccess: false,
    reset: vi.fn(),
  });

  return {
    categories: [] as any[],
    stats: {} as any,
    questions: [] as any[],
    tests: [] as any[],
    attempts: [] as any[],
    courseData: { data: [] } as any,
    refetchStats: vi.fn(),
    refetchQuestions: vi.fn(),
    refetchAnalytics: vi.fn(),
    refetchAttempts: vi.fn(),
    createQuestion: mutation(),
    updateQuestion: mutation(),
    deleteQuestion: mutation(),
    deleteAll: mutation(),
    createTest: mutation(),
    updateTest: mutation(),
    deleteTest: mutation(),
    createCategory: mutation(),
    deleteCategory: mutation(),
    importQuestions: mutation(),
    exportQuestionsToExcel: vi.fn().mockResolvedValue(undefined),
    apiClient: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn().mockResolvedValue({ data: {} }), put: vi.fn().mockResolvedValue({ data: {} }), delete: vi.fn().mockResolvedValue({ data: {} }) },
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useQuestionsList: vi.fn(() => ({ data: state.questions, isLoading: false, refetch: state.refetchQuestions })),
  useQuestionStats: vi.fn(() => ({ data: state.stats, isLoading: false, refetch: state.refetchStats })),
  useCoursesList: vi.fn(() => ({ data: state.courseData })),
  useCourseDetail: vi.fn(() => ({ data: null })),
  useCreateQuestion: vi.fn(() => state.createQuestion),
  useUpdateQuestion: vi.fn(() => state.updateQuestion),
  useDeleteQuestion: vi.fn(() => state.deleteQuestion),
  useDeleteAllQuestions: vi.fn(() => state.deleteAll),
  useTestsList: vi.fn(() => ({ data: state.tests, isLoading: false })),
  useCreateTest: vi.fn(() => state.createTest),
  useUpdateTest: vi.fn(() => state.updateTest),
  useDeleteTest: vi.fn(() => state.deleteTest),
  useTestDetail: vi.fn(() => ({ data: null })),
  useExamCategories: vi.fn(() => ({ data: state.categories })),
  useCreateCategory: vi.fn(() => state.createCategory),
  useDeleteCategory: vi.fn(() => state.deleteCategory),
  useTestAnalytics: vi.fn(() => ({ refetch: state.refetchAnalytics })),
  useAllTestAttempts: vi.fn(() => ({ data: state.attempts, refetch: state.refetchAttempts })),
  useImportQuestions: vi.fn(() => state.importQuestions),
  exportQuestionsToExcel: state.exportQuestionsToExcel,
  apiClient: state.apiClient,
}));

const sampleQuestion = {
  id: 'q1',
  question_text_en: 'Who is the father of the Indian Constitution?',
  question_text_ta: 'இந்திய அரசியலமைப்பின் தந்தை யார்?',
  subject_id: 'INDIAN_POLITY',
  type: 'Single Choice',
  difficulty: 'medium',
  is_published: true,
};

const sampleCategory = {
  id: 'c1',
  name: 'UPSC Exams',
  description: 'Civil services preparation bank',
  iconName: 'GraduationCap',
  subjects: [{ id: 's1', categoryId: 'c1', topics: [{ id: 'tp1', subjectId: 's1' }] }],
};

const sampleTest = {
  id: 't1',
  title: 'Indian Polity Practice Test',
  description: 'Complete polity coverage',
  duration: 60,
  question_count: 25,
  total_marks: 100,
  cutoff_marks: 35,
  is_published: true,
  is_sectioned: false,
  is_paid: true,
};

const sampleAttempts = [
  {
    id: 'a1',
    testTitle: 'Polity Test',
    studentName: 'Ravi Kumar',
    studentEmail: 'ravi@example.com',
    totalScore: 45,
    totalMarks: 50,
    accuracy: 90,
    correct: 45,
    wrong: 5,
    skipped: 0,
    rank: 1,
    timeTaken: 150,
    createdAt: '2026-01-05T10:30:00Z',
    passed: true,
  },
  {
    id: 'a2',
    testTitle: 'English Test',
    studentName: 'Priya Sharma',
    studentEmail: 'priya@example.com',
    totalScore: 20,
    totalMarks: 50,
    accuracy: 40,
    correct: 20,
    wrong: 30,
    skipped: 0,
    rank: 2,
    timeTaken: 300,
    createdAt: '2026-01-06T10:30:00Z',
    passed: false,
  },
];

beforeEach(() => {
  state.categories = [];
  state.stats = { total: 0, published: 0, draft: 0, subjects: 0 };
  state.questions = [];
  state.tests = [];
  state.attempts = [];
  state.courseData = { data: [] };
  vi.clearAllMocks();
  state.apiClient.get.mockResolvedValue({ data: { data: { summary: { total_reviews: 1, average_rating: 4 }, reviews: [] } } });
});

const renderPage = () => renderWithProviders(<TestsPage />, { route: '/tests' });

describe('TestsPage - Question Bank tab', () => {
  it('renders stats and question rows', () => {
    state.stats = { total: 120, published: 100, draft: 20, subjects: 4 };
    state.questions = [sampleQuestion];
    renderPage();

    expect(screen.getByText('Total Questions')).toBeTruthy();
    expect(screen.getByText('120')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();

    expect(screen.getByText('Who is the father of the Indian Constitution?')).toBeTruthy();
    expect(screen.getByText('INDIAN_POLITY')).toBeTruthy();
    expect(screen.getByText('medium')).toBeTruthy();

    const row = screen.getByText('Who is the father of the Indian Constitution?').closest('tr')!;
    expect(within(row).getByText('Published')).toBeTruthy();
    expect(within(row).getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(within(row).getByRole('button', { name: 'Delete' })).toBeTruthy();
  });

  it('shows empty state when no questions exist', () => {
    renderPage();
    expect(screen.getByText('No Questions Found')).toBeTruthy();
    expect(screen.getByText(/Try adjusting your filters or search keywords/)).toBeTruthy();
  });

  it('passes subject/type/difficulty filters to useQuestionsList', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByDisplayValue('All Subjects'), 'Indian Polity');
    await user.selectOptions(screen.getByDisplayValue('All Types'), 'Single Choice');
    await user.selectOptions(screen.getByDisplayValue('Difficulty: All'), 'Easy');

    const pageCall = await lastPageQuestionsCall();
    expect(pageCall).toMatchObject({
      subject: 'Indian Polity',
      type: 'Single Choice',
      difficulty: 'Easy',
      search: '',
    });
  });

  it('passes search query to useQuestionsList', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('Search questions by text...'), 'constitution');

    const pageCall = await lastPageQuestionsCall();
    expect(pageCall).toMatchObject({ search: 'constitution' });
  });

  it('refreshes all queries on refresh button click', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByTitle('Refresh Data'));

    expect(state.refetchStats).toHaveBeenCalled();
    expect(state.refetchQuestions).toHaveBeenCalled();
    expect(state.refetchAnalytics).toHaveBeenCalled();
    expect(state.refetchAttempts).toHaveBeenCalled();
  });

  it('deletes a single question via confirm modal', async () => {
    const user = userEvent.setup();
    state.questions = [sampleQuestion];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('heading', { name: 'Delete Question' })).toBeTruthy();
    expect(screen.getByText(/This action cannot be undone/)).toBeTruthy();

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(state.deleteQuestion.mutateAsync).toHaveBeenCalledWith('q1');
    await waitForModalClose('Delete Question');
  });

  it('deletes all questions via confirm modal', async () => {
    const user = userEvent.setup();
    state.questions = [sampleQuestion];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete All' }));

    expect(screen.getByRole('heading', { name: 'Delete All Questions' })).toBeTruthy();

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(state.deleteAll.mutateAsync).toHaveBeenCalled();
    await waitForModalClose('Delete All Questions');
  });

  it('opens the create question modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Create Question' }));

    expect(screen.getByRole('heading', { name: 'Create New Question' })).toBeTruthy();
  });

  it('exports questions to excel with current filters', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Export' }));

    expect(state.exportQuestionsToExcel).toHaveBeenCalledWith({
      subject: 'All Subjects',
      type: 'All Types',
      difficulty: 'Difficulty: All',
      search: '',
    });
  });

  it('opens the bulk import modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(screen.getByRole('heading', { name: 'Bulk Import Questions' })).toBeTruthy();
  });
});

describe('TestsPage - Course Connect tab', () => {
  it('renders exam categories with subject/topic counts', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Course Connect' }));

    expect(screen.getByRole('heading', { name: 'Course Connections & Taxonomy' })).toBeTruthy();
    expect(screen.getByText('UPSC Exams')).toBeTruthy();
    expect(screen.getByText('Civil services preparation bank')).toBeTruthy();
    expect(screen.getByText('1 Subjects • 1 Topics')).toBeTruthy();
  });

  it('adds a new exam category', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Course Connect' }));
    await user.click(screen.getByRole('button', { name: 'Add Category' }));

    expect(screen.getByRole('heading', { name: 'Add Exam Category' })).toBeTruthy();

    await user.type(screen.getByPlaceholderText('e.g. UPSC Exams'), 'Banking Exams');
    await user.type(
      screen.getByPlaceholderText('Describe the category, exam focus areas, etc.'),
      'Banking exam preparation'
    );

    const submitButtons = screen.getAllByRole('button', { name: 'Add Category' });
    await user.click(submitButtons[submitButtons.length - 1]);

    expect(state.createCategory.mutateAsync).toHaveBeenCalledWith({
      name: 'Banking Exams',
      description: 'Banking exam preparation',
      iconName: 'GraduationCap',
    });
  });

  it('deletes a category via confirm modal', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Course Connect' }));
    await user.click(screen.getByTitle('Delete Category'));

    expect(screen.getByRole('heading', { name: 'Delete Category' })).toBeTruthy();
    expect(screen.getAllByText(/UPSC Exams/).length).toBeGreaterThan(0);

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(state.deleteCategory.mutateAsync).toHaveBeenCalledWith('c1');
    expect(state.refetchStats).toHaveBeenCalled();
  });
});

describe('TestsPage - Test Builder tab', () => {
  it('renders tests with duration, marks and badges', async () => {
    const user = userEvent.setup();
    state.tests = [sampleTest];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Test Builder' }));

    expect(screen.getByText('Indian Polity Practice Test')).toBeTruthy();
    expect(screen.getByText('60 Minutes')).toBeTruthy();
    expect(screen.getByText('25 Questions')).toBeTruthy();
    expect(screen.getByText('100 Marks Total')).toBeTruthy();
    expect(screen.getByText('35%')).toBeTruthy();
    expect(screen.getByText('PRO')).toBeTruthy();
    expect(screen.queryByText('Sectioned')).toBeNull();
  });

  it('opens the test builder wizard on create click', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Test Builder' }));
    await user.click(screen.getByRole('button', { name: 'Create Test Assessment' }));

    expect(screen.getByRole('heading', { name: 'Test Builder Wizard' })).toBeTruthy();
  });

  it('deletes a test after confirm', async () => {
    const user = userEvent.setup();
    state.tests = [sampleTest];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Test Builder' }));

    const row = screen.getByText('Indian Polity Practice Test').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Delete' }));

    expect(state.deleteTest.mutateAsync).toHaveBeenCalledWith('t1');
  });

  it('opens student reviews modal', async () => {
    const user = userEvent.setup();
    state.tests = [sampleTest];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Test Builder' }));

    const row = screen.getByText('Indian Polity Practice Test').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Reviews' }));

    expect(screen.getByRole('heading', { name: 'Student Reviews & Feedback' })).toBeTruthy();
    expect(state.apiClient.get).toHaveBeenCalledWith('/tests/t1/reviews');
  });
});

describe('TestsPage - Test Analytics tab', () => {
  it('computes and renders summary stats and attempt rows', async () => {
    const user = userEvent.setup();
    state.attempts = sampleAttempts;
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Test Analytics' }));

    expect(statValue('Total Attempts')).toContain('2');
    expect(statValue('Avg. Accuracy')).toContain('65%');
    expect(statValue('Pass Rate')).toContain('50%');
    expect(statValue('Avg. Time')).toContain('3m 45s');

    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(screen.getByText('Priya Sharma')).toBeTruthy();
    expect(screen.getByText('✓ Passed')).toBeTruthy();
    expect(screen.getByText('✗ Failed')).toBeTruthy();
  });

  it('filters attempts by search query', async () => {
    const user = userEvent.setup();
    state.attempts = sampleAttempts;
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Test Analytics' }));

    await user.type(screen.getByPlaceholderText('Search by student name, email or test...'), 'ravi');

    expect(screen.getByText('Ravi Kumar')).toBeTruthy();
    expect(screen.queryByText('Priya Sharma')).toBeNull();
    expect(screen.getByText('1 result found')).toBeTruthy();
  });

  it('filters attempts by status', async () => {
    const user = userEvent.setup();
    state.attempts = sampleAttempts;
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Test Analytics' }));

    await user.click(screen.getByRole('button', { name: 'Failed' }));

    expect(screen.getByText('Priya Sharma')).toBeTruthy();
    expect(screen.queryByText('Ravi Kumar')).toBeNull();
  });

  it('filters attempts by test title', async () => {
    const user = userEvent.setup();
    state.attempts = sampleAttempts;
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Test Analytics' }));

    await user.selectOptions(screen.getByDisplayValue('All Tests'), 'English Test');

    expect(screen.getByText('Priya Sharma')).toBeTruthy();
    expect(screen.queryByText('Ravi Kumar')).toBeNull();
  });
});

function waitForModalClose(heading: string) {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (!screen.queryByRole('heading', { name: heading })) {
        clearInterval(interval);
        resolve();
      }
    }, 10);
  });
}

async function lastPageQuestionsCall() {
  const { useQuestionsList } = await import('../../../core/api/endpoints');
  const calls = (useQuestionsList as ReturnType<typeof vi.fn>).mock.calls;
  const pageCalls = calls.filter((c: any) => c[0] && 'search' in c[0]);
  return pageCalls[pageCalls.length - 1][0];
}

function statValue(label: string) {
  const el = screen.getByText(label);
  return el.parentElement?.textContent ?? '';
}
