import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseListPage from '../pages/CourseListPage';
import { renderWithProviders, queryMock, mutationMock } from '../../../test/test-utils';

const { endpointsMock } = vi.hoisted(() => ({
  endpointsMock: {
    useCoursesList: vi.fn(),
    useCreateCourse: vi.fn(),
    useUpdateCourse: vi.fn(),
    useDeleteCourse: vi.fn(),
  },
}));

vi.mock('../../../core/api/endpoints', () => endpointsMock);

const { useCoursesList, useCreateCourse, useUpdateCourse, useDeleteCourse } = endpointsMock;

const coursesData = {
  data: [
    {
      id: 'c1',
      title: 'TNPSC Group 2 Mains',
      description: 'Comprehensive coverage of the Group 2 main exam syllabus.',
      thumbnail: 'https://example.com/group2.jpg',
      lockMode: 'free',
      isDemo: false,
      totalLessons: 12,
    },
    {
      id: 'c2',
      title: 'Indian Polity Foundation',
      description: 'Deep dive into constitutional concepts for prelims.',
      thumbnail: 'https://example.com/polity.jpg',
      lockMode: 'sequential',
      isDemo: true,
      totalLessons: 8,
    },
  ],
  meta: { total: 2, totalPages: 1, page: 1, limit: 10 },
};

describe('CourseListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCoursesList.mockReturnValue(queryMock(coursesData));
    useCreateCourse.mockReturnValue(mutationMock());
    useUpdateCourse.mockReturnValue(mutationMock());
    useDeleteCourse.mockReturnValue(mutationMock());
  });

  it('renders the page header, search box and Add Course button', () => {
    renderWithProviders(<CourseListPage />);
    expect(screen.getByRole('heading', { name: 'Curriculum Management' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search course title or description...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Course' })).toBeInTheDocument();
  });

  it('shows loading skeletons while courses are loading', () => {
    useCoursesList.mockReturnValue(queryMock(undefined, { isLoading: true, isSuccess: false }));
    renderWithProviders(<CourseListPage />);
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(4);
  });

  it('renders the list of courses returned by the API', () => {
    renderWithProviders(<CourseListPage />);
    expect(screen.getByText('TNPSC Group 2 Mains')).toBeInTheDocument();
    expect(screen.getByText('Indian Polity Foundation')).toBeInTheDocument();
    expect(screen.getByText('12 Lessons')).toBeInTheDocument();
    expect(screen.getByText('8 Lessons')).toBeInTheDocument();
    expect(screen.getByText('Demo')).toBeInTheDocument();
  });

  it('filters courses based on the search query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CourseListPage />);

    await user.type(screen.getByPlaceholderText('Search course title or description...'), 'polity');

    expect(screen.getByText('Indian Polity Foundation')).toBeInTheDocument();
    expect(screen.queryByText('TNPSC Group 2 Mains')).not.toBeInTheDocument();
  });

  it('shows an empty state when no courses exist', () => {
    useCoursesList.mockReturnValue(queryMock({ data: [], meta: { total: 0, totalPages: 0, page: 1, limit: 10 } }));
    renderWithProviders(<CourseListPage />);
    expect(screen.getByText('No Courses Found')).toBeInTheDocument();
  });

  it('renders an error state and retries via Try Again', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn().mockResolvedValue(undefined);
    useCoursesList.mockReturnValue(queryMock(undefined, { isError: true, isSuccess: false, refetch }));
    renderWithProviders(<CourseListPage />);

    expect(screen.getByText('Failed to Load Courses')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('creates a new course from the modal', async () => {
    const user = userEvent.setup();
    const createCourse = vi.fn().mockResolvedValue({});
    useCreateCourse.mockReturnValue(mutationMock(createCourse));
    renderWithProviders(<CourseListPage />);

    await user.click(screen.getByRole('button', { name: 'Add Course' }));
    expect(screen.getByRole('heading', { name: 'Create Course' })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('e.g. Flutter Web Development'), 'Economy Basics');
    await user.type(
      screen.getByPlaceholderText('Provide a summary detailing course learning objectives...'),
      'A complete introduction to Indian economy for all exams.'
    );
    await user.click(screen.getByRole('button', { name: 'Image URL' }));
    await user.type(screen.getByPlaceholderText('https://example.com/image.jpg'), 'https://example.com/economy.jpg');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(createCourse).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Economy Basics',
        description: 'A complete introduction to Indian economy for all exams.',
        thumbnail: 'https://example.com/economy.jpg',
        lockMode: 'free',
        isDemo: false,
      })
    );
    expect(screen.queryByRole('heading', { name: 'Create Course' })).not.toBeInTheDocument();
  });

  it('shows validation errors when submitting an invalid course', async () => {
    const user = userEvent.setup();
    const createCourse = vi.fn().mockResolvedValue({});
    useCreateCourse.mockReturnValue(mutationMock(createCourse));
    renderWithProviders(<CourseListPage />);

    await user.click(screen.getByRole('button', { name: 'Add Course' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Title must be at least 3 characters')).toBeInTheDocument();
    expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('updates an existing course from the edit modal', async () => {
    const user = userEvent.setup();
    const updateCourse = vi.fn().mockResolvedValue({});
    useUpdateCourse.mockReturnValue(mutationMock(updateCourse));
    renderWithProviders(<CourseListPage />);

    await user.click(screen.getAllByTitle('Edit Course')[0]);

    const titleInput = screen.getByPlaceholderText('e.g. Flutter Web Development');
    expect(titleInput).toHaveValue('TNPSC Group 2 Mains');

    await user.clear(titleInput);
    await user.type(titleInput, 'TNPSC Group 2 Mains 2026');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(updateCourse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        data: expect.objectContaining({ title: 'TNPSC Group 2 Mains 2026' }),
      })
    );
  });

  it('deletes a course after confirming in the modal', async () => {
    const user = userEvent.setup();
    const deleteCourse = vi.fn().mockResolvedValue({});
    useDeleteCourse.mockReturnValue(mutationMock(deleteCourse));
    renderWithProviders(<CourseListPage />);

    await user.click(screen.getAllByTitle('Delete Course')[0]);
    expect(screen.getByRole('heading', { name: 'Delete Course' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(deleteCourse).toHaveBeenCalledWith('c1');
    expect(screen.queryByRole('heading', { name: 'Delete Course' })).not.toBeInTheDocument();
  });

  it('renders pagination controls and navigates to the next page', async () => {
    const user = userEvent.setup();
    useCoursesList.mockReturnValue(
      queryMock({ ...coursesData, meta: { total: 30, totalPages: 3, page: 1, limit: 10 } })
    );
    renderWithProviders(<CourseListPage />);

    const label = screen.getByText('Page 1 of 3');
    const pagination = label.closest('div');
    expect(pagination).not.toBeNull();

    const buttons = within(pagination!).getAllByRole('button');
    expect(buttons).toHaveLength(2);
    await user.click(buttons[1]);

    expect(useCoursesList).toHaveBeenLastCalledWith(2, 10);
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });
});
