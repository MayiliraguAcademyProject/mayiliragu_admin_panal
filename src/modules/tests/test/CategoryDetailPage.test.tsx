import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryDetailPage from '../pages/CategoryDetailPage';
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
    questions: [] as any[],
    createSubject: mutation(),
    updateSubject: mutation(),
    deleteSubject: mutation(),
    createTopic: mutation(),
    updateTopic: mutation(),
    deleteTopic: mutation(),
    createQuestion: mutation(),
    updateQuestion: mutation(),
    deleteQuestion: mutation(),
    apiClient: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn().mockResolvedValue({ data: {} }) },
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useExamCategories: vi.fn(() => ({ data: state.categories })),
  useQuestionsList: vi.fn(() => ({ data: state.questions, isLoading: false })),
  useQuestionBatches: vi.fn(() => ({ data: [] })),
  useCreateSubject: vi.fn(() => state.createSubject),
  useUpdateSubject: vi.fn(() => state.updateSubject),
  useDeleteSubject: vi.fn(() => state.deleteSubject),
  useCreateTopic: vi.fn(() => state.createTopic),
  useUpdateTopic: vi.fn(() => state.updateTopic),
  useDeleteTopic: vi.fn(() => state.deleteTopic),
  useCreateQuestion: vi.fn(() => state.createQuestion),
  useUpdateQuestion: vi.fn(() => state.updateQuestion),
  useDeleteQuestion: vi.fn(() => state.deleteQuestion),
  apiClient: state.apiClient,
}));

const sampleCategory = {
  id: 'c1',
  name: 'UPSC Exams',
  description: 'Civil services preparation bank',
  iconName: 'GraduationCap',
  subjects: [
    {
      id: 's1',
      categoryId: 'c1',
      name: 'Indian Polity',
      topics: [{ id: 'tp1', subjectId: 's1', name: 'Constitution' }],
    },
  ],
};

const sampleQuestion = {
  id: 'q1',
  question_text_en: 'Who is the father of the Indian Constitution?',
  question_text_ta: 'இந்திய அரசியலமைப்பின் தந்தை யார்?',
  type: 'single_choice',
  difficulty: 'easy',
  is_published: true,
  exam_category: 'UPSC Exams',
  tags: [],
};

beforeEach(() => {
  state.categories = [];
  state.questions = [];
  vi.clearAllMocks();
});

const renderPage = (route = '/tests/category/c1') =>
  renderWithProviders(<CategoryDetailPage />, {
    route,
    routes: [{ path: '/tests/category/:categoryId', element: <CategoryDetailPage /> }],
  });

describe('CategoryDetailPage', () => {
  it('renders header, subjects and matched questions', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    state.questions = [sampleQuestion];
    renderPage();

    expect(screen.getByRole('heading', { name: 'UPSC Exams Syllabus Detail' })).toBeTruthy();
    expect(screen.getByText('Subjects Index')).toBeTruthy();
    expect(screen.getByText('Indian Polity')).toBeTruthy();
    expect(screen.getByText('Displaying 1 matched questions.')).toBeTruthy();

    expect(screen.getByText('Who is the father of the Indian Constitution?')).toBeTruthy();
    expect(screen.getByText('single choice')).toBeTruthy();
    expect(screen.getByText('easy')).toBeTruthy();
    expect(screen.getByText('Published')).toBeTruthy();

    await user.click(screen.getByText('Indian Polity'));
    expect(screen.getByText('Constitution')).toBeTruthy();
  });

  it('filters subjects by search query', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    renderPage();

    await user.type(screen.getByPlaceholderText('Filter subjects...'), 'history');

    expect(screen.queryByText('Indian Polity')).toBeNull();
    expect(screen.getByText('No subjects created yet.')).toBeTruthy();
  });

  it('adds a new subject', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Add Subject' }));

    expect(screen.getByRole('heading', { name: 'Add Exam Subject' })).toBeTruthy();

    await user.type(screen.getByPlaceholderText('e.g. Modern Indian History'), 'Modern Indian History');

    const submitButtons = screen.getAllByRole('button', { name: 'Add Subject' });
    await user.click(submitButtons[submitButtons.length - 1]);

    expect(state.createSubject.mutateAsync).toHaveBeenCalledWith({
      categoryId: 'c1',
      name: 'Modern Indian History',
    });
  });

  it('adds a new topic to an expanded subject', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    renderPage();

    await user.click(screen.getByTitle('Add Topic'));

    expect(screen.getByRole('heading', { name: 'Add Exam Topic' })).toBeTruthy();

    await user.type(screen.getByPlaceholderText('e.g. Governor-Generals of India'), 'Governor-Generals of India');

    const submitButtons = screen.getAllByRole('button', { name: 'Add Topic' });
    await user.click(submitButtons[submitButtons.length - 1]);

    expect(state.createTopic.mutateAsync).toHaveBeenCalledWith({
      subjectId: 's1',
      name: 'Governor-Generals of India',
    });
  });

  it('deletes a question via confirm modal', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    state.questions = [sampleQuestion];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('heading', { name: 'Delete Question' })).toBeTruthy();

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(state.deleteQuestion.mutateAsync).toHaveBeenCalledWith('q1');
  });

  it('opens the add question modal', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Add Question' }));

    expect(screen.getByRole('heading', { name: 'Create New Assessment Question' })).toBeTruthy();
  });

  it('shows category not found state', () => {
    renderPage('/tests/category/unknown');

    expect(screen.getByRole('heading', { name: 'Category Not Found' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to Tests' })).toBeTruthy();
  });

  it('edits an existing subject', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    renderPage();

    await user.click(screen.getByTitle('Edit Subject'));

    expect(screen.getByRole('heading', { name: 'Edit Exam Subject' })).toBeTruthy();
    const input = screen.getByPlaceholderText('e.g. Modern Indian History');
    await user.clear(input);
    await user.type(input, 'Updated Indian Polity');

    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(state.updateSubject.mutateAsync).toHaveBeenCalledWith({
      id: 's1',
      name: 'Updated Indian Polity',
    });
  });

  it('deletes a subject via confirm modal', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    renderPage();

    await user.click(screen.getByTitle('Delete Subject'));

    expect(screen.getByRole('heading', { name: 'Delete Subject' })).toBeTruthy();

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(state.deleteSubject.mutateAsync).toHaveBeenCalledWith('s1');
  });

  it('shows empty questions state', () => {
    state.categories = [sampleCategory];
    renderPage();

    expect(screen.getByText('No Syllabus Questions')).toBeTruthy();
  });

  it('edits an existing topic', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    renderPage();

    // Expand subject
    await user.click(screen.getByText('Indian Polity'));

    // Click Edit Topic
    await user.click(screen.getByTitle('Edit Topic'));

    expect(screen.getByRole('heading', { name: 'Edit Exam Topic' })).toBeTruthy();
    const input = screen.getByPlaceholderText('e.g. Governor-Generals of India');
    await user.clear(input);
    await user.type(input, 'Preamble & Constitution');

    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(state.updateTopic.mutateAsync).toHaveBeenCalledWith({
      id: 'tp1',
      name: 'Preamble & Constitution',
    });
  });

  it('deletes a topic via confirm modal', async () => {
    const user = userEvent.setup();
    state.categories = [sampleCategory];
    renderPage();

    // Expand subject
    await user.click(screen.getByText('Indian Polity'));

    // Click Delete Topic
    await user.click(screen.getByTitle('Delete Topic'));

    expect(screen.getByRole('heading', { name: 'Delete Topic' })).toBeTruthy();

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(state.deleteTopic.mutateAsync).toHaveBeenCalledWith('tp1');
  });
});
