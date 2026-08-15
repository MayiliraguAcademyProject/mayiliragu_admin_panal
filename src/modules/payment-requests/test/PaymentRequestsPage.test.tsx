import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import PaymentRequestsPage from '../pages/PaymentRequestsPage';

const state = vi.hoisted(() => {
  const defaultRequests = [
    {
      id: 'pr1',
      studentId: 's1',
      linkType: 'COURSE',
      linkId: 'course_123',
      amount: 999,
      screenshotUrl: '/receipts/pr1.png',
      status: 'PENDING',
      adminNote: null,
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-01T09:00:00.000Z',
      student: { id: 's1', name: 'Priya', email: 'priya@test.com' },
    },
    {
      id: 'pr2',
      studentId: 's2',
      linkType: 'TEST',
      linkId: 'test_456',
      amount: 499,
      screenshotUrl: '/receipts/pr2.png',
      status: 'PENDING',
      adminNote: null,
      createdAt: '2026-08-02T10:00:00.000Z',
      updatedAt: '2026-08-02T10:00:00.000Z',
      student: { id: 's2', name: 'Meena', email: 'meena@test.com' },
    },
    {
      id: 'pr3',
      studentId: 's3',
      linkType: 'COURSE',
      linkId: 'course_789',
      amount: 1299,
      screenshotUrl: '',
      status: 'APPROVED',
      adminNote: 'Verified',
      createdAt: '2026-07-30T12:00:00.000Z',
      updatedAt: '2026-07-30T12:00:00.000Z',
      student: { id: 's3', name: 'Rahul', email: 'rahul@test.com' },
    },
    {
      id: 'pr4',
      studentId: 's4',
      linkType: 'TEST',
      linkId: 'test_101',
      amount: 249,
      screenshotUrl: '/receipts/pr4.png',
      status: 'REJECTED',
      adminNote: null,
      createdAt: '2026-07-29T15:00:00.000Z',
      updatedAt: '2026-07-29T15:00:00.000Z',
      student: { id: 's4', name: 'Divya', email: 'divya@test.com' },
    },
  ];

  let requests: unknown[] = defaultRequests.map((r) => ({ ...r }));
  let loading = false;
  let isError = false;
  let errorMessage = '';

  const processMutation = vi.fn((payload: unknown, options?: { onSuccess?: () => void }) => {
    options?.onSuccess?.();
  });

  const paymentSpy = vi.fn((status?: string) => ({
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
    paymentSpy,
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
  useListPaymentRequests: state.paymentSpy,
  useProcessPaymentRequest: () => ({
    mutate: state.processMutation,
    mutateAsync: state.processMutation,
    isPending: false,
  }),
}));

function renderPage() {
  return renderWithProviders(<PaymentRequestsPage />);
}

describe('PaymentRequestsPage', () => {
  beforeEach(() => {
    state.reset();
  });

  it('renders the page header and requests the PENDING filter by default', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'QR Payment Verification' })).toBeTruthy();
    expect(state.paymentSpy).toHaveBeenCalledWith('PENDING');
  });

  it('renders pending request rows with link type, amount, proof and actions', () => {
    renderPage();

    expect(screen.getByText('Priya')).toBeTruthy();
    expect(screen.getByText('priya@test.com')).toBeTruthy();
    expect(screen.getByText('COURSE')).toBeTruthy();
    expect(screen.getByText('course_123')).toBeTruthy();
    expect(screen.getAllByText('999').length).toBe(1);
    expect(screen.getAllByText('Pending').length).toBe(2);
    expect(screen.getAllByText('View Proof').length).toBe(2);

    expect(screen.getAllByRole('button', { name: 'Approve & Enroll' }).length).toBe(2);
    expect(screen.getAllByRole('button', { name: 'Reject Request' }).length).toBe(2);

    expect(screen.queryByText('Rahul')).toBeNull();
    expect(screen.queryByText('Divya')).toBeNull();
  });

  it('switches tabs and refetches with the selected status', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'APPROVED' }));
    expect(state.paymentSpy).toHaveBeenCalledWith('APPROVED');
    expect(await screen.findByText('Rahul')).toBeTruthy();
    expect(screen.getByText('Approved')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'All Requests' }));
    expect(state.paymentSpy).toHaveBeenCalledWith(undefined);
    expect(await screen.findByText('Divya')).toBeTruthy();
    expect(screen.getByText('Rejected')).toBeTruthy();
  });

  it('filters requests by search term', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'All Requests' }));
    await user.type(screen.getByPlaceholderText('Search by student or type...'), 'meena');

    expect(screen.getByText('Meena')).toBeTruthy();
    expect(screen.queryByText('Priya')).toBeNull();
  });

  it('shows the empty state when no requests match', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('Search by student or type...'), 'zzzz');

    expect(screen.getByText('No payment requests found')).toBeTruthy();
    expect(screen.getByText('There are no requests matching the selected status')).toBeTruthy();
  });

  it('opens the receipt screenshot preview modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByText('View Proof')[0]);

    expect(screen.getByText('UPI Transaction Proof Receipt')).toBeTruthy();
    expect(screen.getByAltText('Receipt Screenshot Preview')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('UPI Transaction Proof Receipt')).toBeNull();
  });

  it('approves a request with an admin remark', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByRole('button', { name: 'Approve & Enroll' })[0]);

    expect(screen.getByText('Confirm Payment Approval')).toBeTruthy();
    expect(
      screen.getByText('Are you sure you want to approve this payment request? The student will be instantly enrolled.')
    ).toBeTruthy();

    await user.type(
      screen.getByPlaceholderText(/Transaction verified/),
      'Screenshot verified'
    );
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(state.processMutation).toHaveBeenCalledWith(
      { id: 'pr1', action: 'approve', adminNote: 'Screenshot verified' },
      expect.anything()
    );
    expect(screen.queryByText('Confirm Payment Approval')).toBeNull();
  });

  it('rejects a request without a remark', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByRole('button', { name: 'Reject Request' })[1]);

    expect(screen.getByText('Confirm Payment Rejection')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(state.processMutation).toHaveBeenCalledWith(
      { id: 'pr2', action: 'reject', adminNote: undefined },
      expect.anything()
    );
  });

  it('shows the loading state', () => {
    state.setLoading(true);
    renderPage();
    expect(screen.getByText('Loading payment requests...')).toBeTruthy();
  });

  it('shows the error state with the error message', () => {
    state.setError('Failed to fetch');
    renderPage();
    expect(screen.getByText('Failed to fetch')).toBeTruthy();
  });
});
