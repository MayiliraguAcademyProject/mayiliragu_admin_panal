import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import CourseRequestsPage from '../pages/CourseRequestsPage';

const state = vi.hoisted(() => {
  const defaultRequests = [
    {
      id: 'r1',
      studentId: 's1',
      courseId: 'c1',
      status: 'PENDING',
      message: null,
      adminNote: null,
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-01T09:00:00.000Z',
      student: { id: 's1', name: 'Priya', email: 'priya@test.com' },
      course: { id: 'c1', title: 'Mathematics', thumbnail: null },
    },
    {
      id: 'r2',
      studentId: 's2',
      courseId: 'c2',
      status: 'PENDING',
      message: null,
      adminNote: null,
      createdAt: '2026-08-02T10:00:00.000Z',
      updatedAt: '2026-08-02T10:00:00.000Z',
      student: { id: 's2', name: 'Meena', email: 'meena@test.com' },
      course: { id: 'c2', title: 'English Grammar', thumbnail: null },
    },
    {
      id: 'r3',
      studentId: 's3',
      courseId: 'c3',
      status: 'APPROVED',
      message: null,
      adminNote: 'Welcome',
      createdAt: '2026-07-30T12:00:00.000Z',
      updatedAt: '2026-07-30T12:00:00.000Z',
      student: { id: 's3', name: 'Rahul', email: 'rahul@test.com' },
      course: { id: 'c3', title: 'UPSC Prep', thumbnail: null },
    },
    {
      id: 'r4',
      studentId: 's4',
      courseId: 'c4',
      status: 'REJECTED',
      message: null,
      adminNote: 'Incomplete',
      createdAt: '2026-07-29T15:00:00.000Z',
      updatedAt: '2026-07-29T15:00:00.000Z',
      student: { id: 's4', name: 'Divya', email: 'divya@test.com' },
      course: { id: 'c4', title: 'History', thumbnail: null },
    },
  ];

  let requests: unknown[] = defaultRequests.map((r) => ({ ...r }));
  let loading = false;
  let isError = false;
  let errorMessage = '';

  const processMutation = vi.fn((payload: unknown, options?: { onSuccess?: () => void }) => {
    options?.onSuccess?.();
  });

  const enrollmentSpy = vi.fn((status?: string) => ({
    data: status ? requests.filter((r: any) => r.status === status) : requests,
    isLoading: loading,
    isError,
    error: errorMessage ? new Error(errorMessage) : null,
    refetch: vi.fn(),
  }));

  function reset() {
    requests = defaultRequests.map((r) => ({ ...r }));
    loading = false;
    isError = false;
    errorMessage = '';
    vi.clearAllMocks();
  }

  return {
    enrollmentSpy,
    processMutation,
    reset,
    setRequests: (r: unknown[]) => {
      requests = r;
    },
    setLoading: (v: boolean) => {
      loading = v;
    },
    setError: (msg: string) => {
      isError = true;
      errorMessage = msg;
    },
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useEnrollmentRequests: state.enrollmentSpy,
  useProcessEnrollmentRequest: () => ({
    mutate: state.processMutation,
    mutateAsync: state.processMutation,
    isPending: false,
  }),
}));

function renderPage() {
  return renderWithProviders(<CourseRequestsPage />);
}

describe('CourseRequestsPage', () => {
  beforeEach(() => {
    state.reset();
  });

  it('renders the page header and requests the PENDING filter by default', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Course Access Requests' })).toBeTruthy();
    expect(state.enrollmentSpy).toHaveBeenCalledWith('PENDING');
  });

  it('renders pending request rows with approve and reject actions', () => {
    renderPage();

    expect(screen.getByText('Priya')).toBeTruthy();
    expect(screen.getByText('priya@test.com')).toBeTruthy();
    expect(screen.getByText('Mathematics')).toBeTruthy();
    expect(screen.getAllByText('Pending').length).toBe(2);
    expect(screen.getByText('Meena')).toBeTruthy();

    expect(screen.queryByText('Rahul')).toBeNull();
    expect(screen.queryByText('Divya')).toBeNull();

    expect(screen.getAllByRole('button', { name: 'Approve' }).length).toBe(2);
    expect(screen.getAllByRole('button', { name: 'Reject' }).length).toBe(2);
  });

  it('switches tabs and refetches with the selected status', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'APPROVED' }));
    expect(state.enrollmentSpy).toHaveBeenCalledWith('APPROVED');
    expect(await screen.findByText('Rahul')).toBeTruthy();
    expect(screen.getByText('Approved')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'All Requests' }));
    expect(state.enrollmentSpy).toHaveBeenCalledWith(undefined);
    expect(await screen.findByText('Divya')).toBeTruthy();
    expect(screen.getByText('Rejected')).toBeTruthy();
  });

  it('filters requests by search term', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'All Requests' }));
    await user.type(screen.getByPlaceholderText('Search by student or course...'), 'priya');

    expect(screen.getByText('Priya')).toBeTruthy();
    expect(screen.queryByText('Meena')).toBeNull();
    expect(screen.queryByText('Rahul')).toBeNull();
  });

  it('shows the empty state when no requests match', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('Search by student or course...'), 'zzzz');

    expect(screen.getByText('No requests found')).toBeTruthy();
    expect(screen.getByText('There are no pending requests matching your filter.')).toBeTruthy();
  });

  it('approves a request with an admin note', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByRole('button', { name: 'Approve' })[0]);

    expect(screen.getByText('Approve Course Request')).toBeTruthy();
    expect(
      screen.getByText('Approving this request will immediately enroll Priya into "Mathematics".')
    ).toBeTruthy();

    await user.type(screen.getByPlaceholderText('Enter note or reason...'), 'Verified documents');
    await user.click(screen.getByRole('button', { name: 'Confirm Approval' }));

    expect(state.processMutation).toHaveBeenCalledWith(
      { id: 'r1', action: 'approve', adminNote: 'Verified documents' },
      expect.anything()
    );
    expect(screen.queryByText('Approve Course Request')).toBeNull();
  });

  it('rejects a request without an admin note', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByRole('button', { name: 'Reject' })[1]);

    expect(screen.getByText('Reject Course Request')).toBeTruthy();
    expect(screen.getByText('Are you sure you want to reject Meena\'s request for "English Grammar"?')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Confirm Rejection' }));

    expect(state.processMutation).toHaveBeenCalledWith(
      { id: 'r2', action: 'reject', adminNote: undefined },
      expect.anything()
    );
  });

  it('shows the loading state', () => {
    state.setLoading(true);
    renderPage();
    expect(screen.getByText('Loading requests...')).toBeTruthy();
  });

  it('shows the error state with the error message', () => {
    state.setError('Network error');
    renderPage();
    expect(screen.getByText('Network error')).toBeTruthy();
  });
});
