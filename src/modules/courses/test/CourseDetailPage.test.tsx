import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseDetailPage from '../pages/CourseDetailPage';
import { renderWithProviders, queryMock, mutationMock } from '../../../test/test-utils';

const { endpointsMock } = vi.hoisted(() => ({
  endpointsMock: {
    useCourseDetail: vi.fn(),
    useUpdateCourse: vi.fn(),
    useCreateModule: vi.fn(),
    useUpdateModule: vi.fn(),
    useDeleteModule: vi.fn(),
    useCreateLesson: vi.fn(),
    useUpdateLesson: vi.fn(),
    useDeleteLesson: vi.fn(),
    useLessonStats: vi.fn(),
    useReorderModules: vi.fn(),
    useReorderLessons: vi.fn(),
  },
}));

vi.mock('../../../core/api/endpoints', () => endpointsMock);

const {
  useCourseDetail,
  useUpdateCourse,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useLessonStats,
  useReorderModules,
  useReorderLessons,
} = endpointsMock;

const course = {
  id: 'c1',
  title: 'TNPSC Group 2 Mains',
  description: 'Comprehensive coverage of the Group 2 main exam syllabus.',
  thumbnail: 'https://example.com/group2.jpg',
  lockMode: 'free',
  totalLessons: 2,
  modules: [
    {
      id: 'm1',
      title: 'Indian Polity',
      order: 1,
      lessons: [
        {
          id: 'l1',
          title: 'Constitution Overview',
          description: 'Salient features of the Indian constitution.',
          image: '',
          driveFileId: '1a2b3c4d5e6f',
          duration: 300,
          downloadEnabled: true,
          order: 1,
        },
        {
          id: 'l2',
          title: 'Fundamental Rights',
          description: 'Articles 12 to 35 explained.',
          image: '',
          driveFileId: '9z8y7x6w5v4u',
          duration: 600,
          downloadEnabled: false,
          order: 2,
        },
      ],
    },
    {
      id: 'm2',
      title: 'Ancient History',
      order: 2,
      lessons: [],
    },
  ],
};

function renderDetail() {
  return renderWithProviders(<CourseDetailPage />, {
    route: '/courses/c1',
    routes: [{ path: '/courses/:id', element: <CourseDetailPage /> }],
  });
}

describe('CourseDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCourseDetail.mockReturnValue(queryMock(course));
    useUpdateCourse.mockReturnValue(mutationMock());
    useCreateModule.mockReturnValue(mutationMock());
    useUpdateModule.mockReturnValue(mutationMock());
    useDeleteModule.mockReturnValue(mutationMock());
    useCreateLesson.mockReturnValue(mutationMock());
    useUpdateLesson.mockReturnValue(mutationMock());
    useDeleteLesson.mockReturnValue(mutationMock());
    useLessonStats.mockReturnValue(queryMock({ stats: [] }));
    useReorderModules.mockReturnValue(mutationMock());
    useReorderLessons.mockReturnValue(mutationMock());
  });

  it('shows a loading state while the course is fetching', () => {
    useCourseDetail.mockReturnValue(queryMock(undefined, { isLoading: true, isSuccess: false }));
    renderDetail();
    expect(screen.getByText('Loading course structure...')).toBeInTheDocument();
  });

  it('shows an error state and retries via Try Again', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn().mockResolvedValue(undefined);
    useCourseDetail.mockReturnValue(queryMock(undefined, { isError: true, isSuccess: false, refetch }));
    renderDetail();

    expect(screen.getByText('Failed to Load Course Details')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('renders the course header with summary stats', () => {
    renderDetail();
    expect(screen.getByRole('heading', { name: 'TNPSC Group 2 Mains' })).toBeInTheDocument();
    expect(screen.getByText('Comprehensive coverage of the Group 2 main exam syllabus.')).toBeInTheDocument();
    expect(screen.getByText('2 Modules')).toBeInTheDocument();
    expect(screen.getByText('2 Lessons')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Free Access' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sequential Unlock' })).toBeInTheDocument();
  });

  it('renders modules sorted by order', () => {
    renderDetail();
    const headings = screen.getAllByRole('heading', { level: 4 });
    expect(headings.map((h) => h.textContent)).toEqual(['Indian Polity', 'Ancient History']);
    expect(screen.getByText('2 lessons in this block')).toBeInTheDocument();
    expect(screen.getByText('0 lessons in this block')).toBeInTheDocument();
  });

  it('toggles the course lock mode via the update mutation', async () => {
    const user = userEvent.setup();
    const updateCourse = vi.fn().mockResolvedValue({});
    useUpdateCourse.mockReturnValue(mutationMock(updateCourse));
    renderDetail();

    await user.click(screen.getByRole('button', { name: 'Sequential Unlock' }));

    expect(updateCourse).toHaveBeenCalledWith({ id: 'c1', data: { lockMode: 'sequential' } });
  });

  it('expands a module and shows its lessons', async () => {
    const user = userEvent.setup();
    renderDetail();

    expect(screen.queryByText('Constitution Overview')).not.toBeInTheDocument();

    await user.click(screen.getByText('Indian Polity'));

    expect(screen.getByText('Constitution Overview')).toBeInTheDocument();
    expect(screen.getByText('Fundamental Rights')).toBeInTheDocument();
    expect(screen.getByText('5 minutes')).toBeInTheDocument();
    expect(screen.getByText('10 minutes')).toBeInTheDocument();
    expect(screen.getByText('Download Enabled')).toBeInTheDocument();
    expect(screen.getByText('Download Disabled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Lesson' })).toBeInTheDocument();
  });

  it('creates a new module', async () => {
    const user = userEvent.setup();
    const createModule = vi.fn().mockResolvedValue({});
    useCreateModule.mockReturnValue(mutationMock(createModule));
    renderDetail();

    await user.click(screen.getByRole('button', { name: 'Add Module' }));
    expect(screen.getByRole('heading', { name: 'Create Module' })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('e.g. Introduction & Setup'), 'Geography Essentials');
    await user.click(screen.getByRole('button', { name: 'Create Module' }));

    expect(createModule).toHaveBeenCalledWith({ title: 'Geography Essentials', order: 2 });
  });

  it('shows validation errors when adding an empty module', async () => {
    const user = userEvent.setup();
    const createModule = vi.fn().mockResolvedValue({});
    useCreateModule.mockReturnValue(mutationMock(createModule));
    renderDetail();

    await user.click(screen.getByRole('button', { name: 'Add Module' }));
    await user.click(screen.getByRole('button', { name: 'Create Module' }));

    expect(await screen.findByText('Title must be at least 3 characters')).toBeInTheDocument();
    expect(createModule).not.toHaveBeenCalled();
  });

  it('creates a new lesson under an expanded module', async () => {
    const user = userEvent.setup();
    const createLesson = vi.fn().mockResolvedValue({});
    useCreateLesson.mockReturnValue(mutationMock(createLesson));
    renderDetail();

    await user.click(screen.getByText('Indian Polity'));
    await user.click(screen.getByRole('button', { name: 'Add Lesson' }));

    expect(screen.getByRole('heading', { name: 'Create New Lesson' })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('e.g. Setting up Flutter Environment'), 'Citizenship');
    await user.type(screen.getByPlaceholderText('e.g. 1a2b3c4d5e6f...'), 'x1y2z3a4b5c6');
    await user.click(screen.getByRole('button', { name: 'Create Lesson' }));

    expect(createLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Citizenship',
          driveFileId: 'x1y2z3a4b5c6',
          duration: 300,
          order: 2,
          downloadEnabled: false,
        }),
      })
    );
  });

  it('rejects an invalid Google Drive file id', async () => {
    const user = userEvent.setup();
    const createLesson = vi.fn().mockResolvedValue({});
    useCreateLesson.mockReturnValue(mutationMock(createLesson));
    renderDetail();

    await user.click(screen.getByText('Indian Polity'));
    await user.click(screen.getByRole('button', { name: 'Add Lesson' }));

    await user.type(screen.getByPlaceholderText('e.g. Setting up Flutter Environment'), 'Citizenship');
    await user.type(screen.getByPlaceholderText('e.g. 1a2b3c4d5e6f...'), 'https://drive.google.com/file/d/abc');
    await user.click(screen.getByRole('button', { name: 'Create Lesson' }));

    expect(
      await screen.findByText('Enter ONLY the File ID itself, not the full Drive URL')
    ).toBeInTheDocument();
    expect(createLesson).not.toHaveBeenCalled();
  });

  it('copies the service account email from the lesson modal', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    renderDetail();

    await user.click(screen.getByText('Indian Polity'));
    await user.click(screen.getByRole('button', { name: 'Add Lesson' }));

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith(
      'mayiliraguacadamy@mayiliragu-501911.iam.gserviceaccount.com'
    );
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  it('deletes a module after confirming', async () => {
    const user = userEvent.setup();
    const deleteModule = vi.fn().mockResolvedValue({});
    useDeleteModule.mockReturnValue(mutationMock(deleteModule));
    renderDetail();

    await user.click(screen.getAllByTitle('Delete Module')[1]);

    expect(deleteModule).toHaveBeenCalledWith('m2');
  });

  it('deletes a lesson through the confirmation modal', async () => {
    const user = userEvent.setup();
    const deleteLesson = vi.fn().mockResolvedValue({});
    useDeleteLesson.mockReturnValue(mutationMock(deleteLesson));
    renderDetail();

    await user.click(screen.getByText('Indian Polity'));
    await user.click(screen.getAllByTitle('Delete Lesson')[0]);

    expect(screen.getByRole('heading', { name: 'Delete Lesson' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(deleteLesson).toHaveBeenCalledWith('l1');
  });

  it('shows the lesson watch stats modal', async () => {
    const user = userEvent.setup();
    useLessonStats.mockReturnValue(
      queryMock({
        stats: [
          {
            id: 's1',
            student: { name: 'Ravi Kumar', email: 'ravi@example.com' },
            watchedSeconds: 180,
            completed: false,
            lastViewedAt: '2026-01-01T10:00:00.000Z',
          },
        ],
      })
    );
    renderDetail();

    await user.click(screen.getByText('Indian Polity'));
    await user.click(screen.getAllByTitle('View Watching Progress')[0]);

    expect(screen.getByText('Student Watching Progress')).toBeInTheDocument();
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText('3m 0s')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('shows an empty watch stats message when no one has watched', async () => {
    const user = userEvent.setup();
    renderDetail();

    await user.click(screen.getByText('Indian Polity'));
    await user.click(screen.getAllByTitle('View Watching Progress')[0]);

    expect(screen.getByText('No students have watched this lesson yet.')).toBeInTheDocument();
  });
});
