import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import CurrentAffairsPage from '../pages/CurrentAffairsPage';

const state = vi.hoisted(() => {
  const defaultArticles = [
    {
      id: 'a1',
      titleEn: 'Union Budget 2026 Highlights',
      titleTa: 'மத்திய பட்ஜெட்',
      summaryEn: 'Key economic measures announced in the budget session.',
      contentEn: 'Detailed write-up about the union budget.',
      category: 'Economy & Finance',
      publishedDate: '2026-08-01T00:00:00.000Z',
      isPublished: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      _count: { quizzes: 3 },
    },
    {
      id: 'a2',
      titleEn: 'Draft Article',
      titleTa: '',
      summaryEn: 'Draft summary here.',
      contentEn: 'Draft content write-up body text.',
      category: 'National Affairs',
      publishedDate: '2026-08-02T00:00:00.000Z',
      isPublished: false,
      createdAt: '2026-08-02T00:00:00.000Z',
      updatedAt: '2026-08-02T00:00:00.000Z',
      _count: { quizzes: 0 },
    },
  ];
  const defaultMagazines = [
    {
      id: 'm1',
      title: 'Mayiliragu Current Affairs June 2026',
      month: 6,
      year: 2026,
      pdfUrl: '/magazines/june-2026.pdf',
      publishedAt: '2026-07-01T00:00:00.000Z',
    },
  ];
  const defaultSchemes = [
    {
      id: 's1',
      titleEn: 'PM Kisan Samman Nidhi',
      titleTa: '',
      descriptionEn: 'Income support scheme for farmers.',
      type: 'Central',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];
  const defaultDates = [
    {
      id: 'd1',
      titleEn: 'National Science Day',
      titleTa: '',
      date: '2026-02-28T00:00:00.000Z',
      type: 'National',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];
  const defaultAttempts = {
    attempts: [
      {
        id: 'att1',
        studentId: 'st1',
        studentName: 'Arun Kumar',
        studentEmail: 'arun@example.com',
        quizId: 'q1',
        articleId: 'a1',
        articleTitle: 'Union Budget 2026',
        questionPrompt: 'Which ministry presented the budget?',
        selectedAnswer: 'B',
        correctAnswer: 'A',
        explanationEn: null,
        isCorrect: false,
        attemptedAt: '2026-08-01T10:00:00.000Z',
      },
      {
        id: 'att2',
        studentId: 'st2',
        studentName: 'Priya Sharma',
        studentEmail: 'priya@example.com',
        quizId: 'q1',
        articleId: 'a1',
        articleTitle: 'Union Budget 2026',
        questionPrompt: 'What is the fiscal deficit target?',
        selectedAnswer: 'A',
        correctAnswer: 'A',
        explanationEn: null,
        isCorrect: true,
        attemptedAt: '2026-08-02T09:30:00.000Z',
      },
    ],
    summary: { totalSubmissions: 120, totalUniqueStudents: 45, overallAccuracy: 72 },
    meta: { total: 120, page: 1, limit: 20, totalPages: 6 },
  };

  const articlesData = { data: defaultArticles.map((a) => ({ ...a })) };
  const magazinesData = { data: defaultMagazines.map((m) => ({ ...m })) };
  const schemesData = { data: defaultSchemes.map((s) => ({ ...s })) };
  const datesData = { data: defaultDates.map((d) => ({ ...d })) };
  const quizAttemptsData = {
    attempts: defaultAttempts.attempts.map((a) => ({ ...a })),
    summary: { ...defaultAttempts.summary },
    meta: { ...defaultAttempts.meta },
  };
  let articlesError: unknown = null;

  const createArtMutation = vi.fn().mockResolvedValue({});
  const updateArtMutation = vi.fn().mockResolvedValue({});
  const deleteArtMutation = vi.fn().mockResolvedValue({});
  const saveQuizzesMutation = vi.fn().mockResolvedValue({});
  const uploadMagMutation = vi.fn().mockResolvedValue({});
  const createSchemeMutation = vi.fn().mockResolvedValue({});
  const updateSchemeMutation = vi.fn().mockResolvedValue({});
  const createDateMutation = vi.fn().mockResolvedValue({});
  const quizAttemptsQuery = vi.fn((params) => ({ data: { data: quizAttemptsData }, isLoading: false }));
  const refetchQuizzes = vi.fn().mockResolvedValue({ data: { data: [] } });

  function reset() {
    articlesData.data = defaultArticles.map((a) => ({ ...a }));
    magazinesData.data = defaultMagazines.map((m) => ({ ...m }));
    schemesData.data = defaultSchemes.map((s) => ({ ...s }));
    datesData.data = defaultDates.map((d) => ({ ...d }));
    quizAttemptsData.attempts = defaultAttempts.attempts.map((a) => ({ ...a }));
    quizAttemptsData.summary = { ...defaultAttempts.summary };
    quizAttemptsData.meta = { ...defaultAttempts.meta };
    articlesError = null;
    vi.clearAllMocks();
  }

  return {
    defaultArticles,
    defaultMagazines,
    defaultSchemes,
    defaultDates,
    defaultAttempts,
    articlesData,
    magazinesData,
    schemesData,
    datesData,
    quizAttemptsData,
    createArtMutation,
    updateArtMutation,
    deleteArtMutation,
    saveQuizzesMutation,
    uploadMagMutation,
    createSchemeMutation,
    updateSchemeMutation,
    createDateMutation,
    quizAttemptsQuery,
    refetchQuizzes,
    reset,
    getArticlesError: () => articlesError,
    setArticlesError: (err: unknown) => {
      articlesError = err;
    },
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useCurrentAffairsAdminList: () => ({
    data: state.articlesData,
    isLoading: false,
    error: state.getArticlesError(),
  }),
  useCreateCurrentAffair: () => ({
    mutateAsync: state.createArtMutation,
    mutate: state.createArtMutation,
    isPending: false,
  }),
  useUpdateCurrentAffair: () => ({
    mutateAsync: state.updateArtMutation,
    mutate: state.updateArtMutation,
    isPending: false,
  }),
  useDeleteCurrentAffair: () => ({
    mutateAsync: state.deleteArtMutation,
    mutate: state.deleteArtMutation,
    isPending: false,
  }),
  useCurrentAffairQuizzes: () => ({ refetch: state.refetchQuizzes }),
  useCreateCurrentAffairQuizzes: () => ({
    mutateAsync: state.saveQuizzesMutation,
    mutate: state.saveQuizzesMutation,
    isPending: false,
  }),
  useMagazinesList: () => ({ data: state.magazinesData, isLoading: false }),
  useUploadMagazine: () => ({
    mutateAsync: state.uploadMagMutation,
    mutate: state.uploadMagMutation,
    isPending: false,
  }),
  useSchemesList: () => ({ data: state.schemesData, isLoading: false }),
  useCreateScheme: () => ({
    mutateAsync: state.createSchemeMutation,
    mutate: state.createSchemeMutation,
    isPending: false,
  }),
  useUpdateScheme: () => ({
    mutateAsync: state.updateSchemeMutation,
    mutate: state.updateSchemeMutation,
    isPending: false,
  }),
  useDatesList: () => ({ data: state.datesData, isLoading: false }),
  useCreateDate: () => ({
    mutateAsync: state.createDateMutation,
    mutate: state.createDateMutation,
    isPending: false,
  }),
  useCurrentAffairsQuizAttemptsAdmin: (params) => state.quizAttemptsQuery(params),
}));

function renderPage() {
  return renderWithProviders(<CurrentAffairsPage />);
}

describe('CurrentAffairsPage', () => {
  beforeEach(() => {
    state.reset();
  });

  it('renders header and all tab buttons', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Current Affairs Hub' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Daily Articles' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Monthly Magazines' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Gov Schemes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Important Dates' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Quiz Results' })).toBeTruthy();
  });

  it('shows articles empty state', () => {
    state.articlesData.data = [];
    renderPage();

    expect(screen.getByText('No daily articles published yet.')).toBeTruthy();
    expect(screen.queryByText('Union Budget 2026 Highlights')).toBeNull();
  });

  it('shows articles error state', () => {
    state.setArticlesError(new Error('boom'));
    renderPage();

    expect(screen.getByText('Failed to load current affairs.')).toBeTruthy();
  });

  it('renders article cards with category, title, draft badge, and quiz count', () => {
    renderPage();

    expect(screen.getByText('Union Budget 2026 Highlights')).toBeTruthy();
    expect(screen.getByText(/மத்திய பட்ஜெட்/)).toBeTruthy();
    expect(screen.getByText('Economy & Finance')).toBeTruthy();
    expect(screen.getByText('Key economic measures announced in the budget session.')).toBeTruthy();
    expect(screen.getByText('Quiz (3)')).toBeTruthy();

    expect(screen.getByText('Draft Article')).toBeTruthy();
    expect(screen.getByText('Draft')).toBeTruthy();
    expect(screen.getByText('Quiz (0)')).toBeTruthy();

    expect(screen.getAllByTitle('Edit article')).toHaveLength(2);
    expect(screen.getAllByTitle('Delete article')).toHaveLength(2);
  });

  it('blocks empty article submit via validation', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Create Article' }));
    expect(screen.getByRole('heading', { name: 'Publish Daily Current Affairs' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Save Article' }));

    expect(state.createArtMutation).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Publish Daily Current Affairs' })).toBeTruthy();
  });

  it('creates an article and closes the modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Create Article' }));
    await user.type(screen.getByPlaceholderText('Title in English'), 'Union Budget 2026 Highlights');
    await user.type(screen.getByPlaceholderText('Short summary for the feed list card'), 'Key economic measures announced in the budget session.');
    await user.type(screen.getByPlaceholderText('Detailed content write-up'), 'The Union Budget for 2026-27 was presented with major reforms.');

    await user.click(screen.getByRole('button', { name: 'Save Article' }));

    await waitFor(() => {
      expect(state.createArtMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          titleEn: 'Union Budget 2026 Highlights',
          summaryEn: 'Key economic measures announced in the budget session.',
          contentEn: 'The Union Budget for 2026-27 was presented with major reforms.',
          category: 'National Affairs',
          isPublished: true,
        })
      );
    });
    expect(screen.queryByRole('heading', { name: 'Publish Daily Current Affairs' })).toBeNull();
  });

  it('edits an article and calls update mutation', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByTitle('Edit article')[0]);
    expect(screen.getByRole('heading', { name: 'Edit Current Affairs Article' })).toBeTruthy();

    const titleInput = screen.getByPlaceholderText('Title in English');
    expect((titleInput as HTMLInputElement).value).toBe('Union Budget 2026 Highlights');

    await user.clear(titleInput);
    await user.type(titleInput, 'Union Budget 2026 Revised');
    await user.click(screen.getByRole('button', { name: 'Save Article' }));

    await waitFor(() => {
      expect(state.updateArtMutation).toHaveBeenCalledWith({
        id: 'a1',
        data: expect.objectContaining({ titleEn: 'Union Budget 2026 Revised' }),
      });
    });
  });

  it('deletes an article through the confirm modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByTitle('Delete article')[0]);
    expect(screen.getByRole('heading', { name: 'Delete Current Affairs Article?' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Delete Article' }));

    await waitFor(() => {
      expect(state.deleteArtMutation).toHaveBeenCalledWith('a1');
    });
    expect(screen.queryByRole('heading', { name: 'Delete Current Affairs Article?' })).toBeNull();
  });

  it('adds MCQs in the practice quiz modal and saves them', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Quiz (3)' }));
    expect(screen.getByRole('heading', { name: 'Practice Quiz Manager' })).toBeTruthy();
    expect(state.refetchQuizzes).toHaveBeenCalled();
    expect(screen.getByText(/No questions created yet/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Add MCQ' }));
    expect(screen.getByText('Question #1')).toBeTruthy();

    await user.type(
      screen.getByPlaceholderText('e.g. Which country launched the satellite?'),
      'Which country launched the satellite?'
    );
    const textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[2], 'Alpha');
    await user.type(textboxes[3], 'Beta');
    await user.type(textboxes[4], 'Gamma');
    await user.type(textboxes[5], 'Delta');

    await user.click(screen.getByRole('button', { name: 'Save Practice Quiz' }));

    await waitFor(() => {
      expect(state.saveQuizzesMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          articleId: 'a1',
          questions: expect.arrayContaining([
            expect.objectContaining({
              questionEn: 'Which country launched the satellite?',
              optionsEn: ['Alpha', 'Beta', 'Gamma', 'Delta'],
              optionsTa: null,
              correctAnswer: 'A',
              explanationEn: null,
              explanationTa: null,
            }),
          ]),
        })
      );
    });
  });

  it('renders magazine cards with pdf link', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Monthly Magazines' }));

    expect(screen.getByText('Mayiliragu Current Affairs June 2026')).toBeTruthy();
    expect(screen.getByText('June 2026')).toBeTruthy();
    expect(screen.getByText(/Published:/)).toBeTruthy();

    const link = screen.getByRole('link', { name: /View PDF File/ });
    expect(link).toHaveAttribute('href', 'http://127.0.0.1:5000/magazines/june-2026.pdf');
  });

  it('uploads a magazine with title and pdf file', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Monthly Magazines' }));
    await user.click(screen.getByRole('button', { name: 'Upload Magazine' }));

    expect(screen.getByRole('heading', { name: 'Upload Compilation PDF' })).toBeTruthy();

    const submitBtn = screen.getByRole('button', { name: 'Upload PDF' });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

    await user.type(
      screen.getByPlaceholderText('e.g. Mayiliragu Current Affairs June 2026'),
      'Mayiliragu Current Affairs August 2026'
    );

    const file = new File(['pdf-content'], 'august-2026.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    expect((submitBtn as HTMLButtonElement).disabled).toBe(false);
    await user.click(submitBtn);

    const now = new Date();
    await waitFor(() => {
      expect(state.uploadMagMutation).toHaveBeenCalledWith({
        title: 'Mayiliragu Current Affairs August 2026',
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        file,
      });
    });
  });

  it('adds a government scheme', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Gov Schemes' }));

    expect(screen.getByText('PM Kisan Samman Nidhi')).toBeTruthy();
    expect(screen.getByText('Central Scheme')).toBeTruthy();
    expect(screen.getByText('Income support scheme for farmers.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Add Scheme' }));
    expect(screen.getByRole('heading', { name: 'Add Government Scheme' })).toBeTruthy();

    await user.type(screen.getByPlaceholderText('Title in English'), 'PM Vishwakarma Yojana');
    await user.type(screen.getByPlaceholderText('Details of the scheme...'), 'Skills training support for artisans.');
    await user.click(screen.getByRole('button', { name: 'Save Scheme' }));

    await waitFor(() => {
      expect(state.createSchemeMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          titleEn: 'PM Vishwakarma Yojana',
          descriptionEn: 'Skills training support for artisans.',
          type: 'Central',
        })
      );
    });
  });

  it('edits a government scheme', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Gov Schemes' }));

    const titleEl = screen.getByText('PM Kisan Samman Nidhi');
    const card = titleEl.closest('div')!.parentElement!;
    await user.click(within(card).getAllByRole('button')[0]);

    expect(screen.getByRole('heading', { name: 'Edit Scheme' })).toBeTruthy();
    const titleInput = screen.getByPlaceholderText('Title in English');
    expect((titleInput as HTMLInputElement).value).toBe('PM Kisan Samman Nidhi');

    await user.clear(titleInput);
    await user.type(titleInput, 'PM Kisan Yojana V2');
    await user.click(screen.getByRole('button', { name: 'Save Scheme' }));

    await waitFor(() => {
      expect(state.updateSchemeMutation).toHaveBeenCalledWith({
        id: 's1',
        data: expect.objectContaining({ titleEn: 'PM Kisan Yojana V2' }),
      });
    });
  });

  it('renders important dates and adds a new event', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Important Dates' }));

    expect(screen.getByText('National Science Day')).toBeTruthy();
    expect(
      screen.getByText(new Date('2026-02-28T00:00:00.000Z').toLocaleDateString(undefined, { dateStyle: 'long' }))
    ).toBeTruthy();
    expect(screen.getByText('National')).toBeTruthy();

    const addButtons = screen.getAllByRole('button', { name: 'Add Event' });
    await user.click(addButtons[0]);
    expect(screen.getByRole('heading', { name: 'Add Calendar Event / Day' })).toBeTruthy();

    await user.type(screen.getByPlaceholderText('e.g. National Science Day'), 'World Environment Day');
    await user.click(screen.getAllByRole('button', { name: 'Add Event' }).at(-1)!);

    await waitFor(() => {
      expect(state.createDateMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          titleEn: 'World Environment Day',
          type: 'National',
          date: expect.any(String),
        })
      );
    });
  });

  it('renders quiz results summary cards and attempts table', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Quiz Results' }));

    expect(screen.getByText('Total Quiz Submissions')).toBeTruthy();
    expect(screen.getByText('120')).toBeTruthy();
    expect(screen.getByText('Active Quiz Takers')).toBeTruthy();
    expect(screen.getByText('45')).toBeTruthy();
    expect(screen.getByText('Average Accuracy')).toBeTruthy();
    expect(screen.getByText('72%')).toBeTruthy();

    expect(screen.getByText('Arun Kumar')).toBeTruthy();
    expect(screen.getByText('arun@example.com')).toBeTruthy();
    expect(screen.getAllByText('Union Budget 2026')).toHaveLength(2);
    expect(screen.getByText('Which ministry presented the budget?')).toBeTruthy();
    expect(screen.getByText('Option B')).toBeTruthy();
    expect(screen.getByText('(Correct: A)')).toBeTruthy();
    expect(screen.getByText('Incorrect')).toBeTruthy();

    expect(screen.getByText('Priya Sharma')).toBeTruthy();
    expect(screen.getByText('Option A')).toBeTruthy();
    expect(screen.getByText('Correct')).toBeTruthy();

    expect(
      screen.getByText(new Date('2026-08-01T10:00:00.000Z').toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }))
    ).toBeTruthy();

    expect(screen.getByText('Page 1 of 6 (120 total)')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('filters quiz attempts by search and correctness, and paginates', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Quiz Results' }));

    await user.type(screen.getByPlaceholderText('Search student, email, article, or question...'), 'arun');
    expect(state.quizAttemptsQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'arun', isCorrect: 'all', page: 1, limit: 20 })
    );

    await user.selectOptions(screen.getByRole('combobox'), 'true');
    expect(state.quizAttemptsQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'arun', isCorrect: 'true', page: 1 })
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(state.quizAttemptsQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'arun', isCorrect: 'true', page: 2 })
    );
  });

  it('shows quiz results empty state', async () => {
    const user = userEvent.setup();
    state.quizAttemptsData.attempts = [];
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Quiz Results' }));

    expect(screen.getByText('No quiz attempts recorded yet.')).toBeTruthy();
  });
});
