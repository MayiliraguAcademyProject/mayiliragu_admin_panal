import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import NotificationsPage from '../pages/NotificationsPage';
import { ApiConstants } from '../../../core/constants';

const state = vi.hoisted(() => {
  const defaultCampaigns = [
    {
      id: 'c1',
      title: 'TNPSC Group 2 Mock Test Published!',
      body: 'The new mock test is live now.',
      status: 'SENT',
      targetGroup: 'ALL',
      targetValue: null,
      scheduledAt: '2026-08-01T09:00:00.000Z',
      sentAt: '2026-08-01T09:00:00.000Z',
      logs: [],
    },
    {
      id: 'c2',
      title: 'Polity Revision Batch',
      body: 'Join the evening revision batch.',
      status: 'PENDING',
      targetGroup: 'BATCH',
      targetValue: 'course_1',
      scheduledAt: '2026-08-10T18:00:00.000Z',
      sentAt: null,
      logs: [],
    },
    {
      id: 'c3',
      title: 'Failed Push Attempt',
      body: 'This one failed to deliver.',
      status: 'FAILED',
      targetGroup: 'INDIVIDUAL',
      targetValue: 'student_1',
      scheduledAt: '2026-07-30T12:00:00.000Z',
      sentAt: null,
      logs: [],
    },
  ];

  const defaultCourses = [
    { id: 'course_1', title: 'Mathematics' },
    { id: 'course_2', title: 'General Studies' },
  ];

  const defaultStudents = [
    { id: 'student_1', name: 'Priya', email: 'priya@test.com' },
    { id: 'student_2', name: 'Rahul', email: 'rahul@test.com' },
  ];

  let campaigns: unknown[] = defaultCampaigns.map((c) => ({ ...c }));
  let courses: unknown[] = defaultCourses.map((c) => ({ ...c }));
  let students: unknown[] = defaultStudents.map((s) => ({ ...s }));
  let campaignsPending = false;

  const apiClientMock = {
    get: vi.fn((url: string) => {
      if (url.includes('/notifications/')) {
        if (campaignsPending) return new Promise(() => {});
        return Promise.resolve({ data: { status: 'success', data: campaigns } });
      }
      if (url.includes('/courses')) {
        return Promise.resolve({ data: courses });
      }
      if (url.includes('/students')) {
        return Promise.resolve({ data: students });
      }
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn(() => Promise.resolve({ data: { status: 'success' } })),
  };

  function reset() {
    campaigns = defaultCampaigns.map((c) => ({ ...c }));
    courses = defaultCourses.map((c) => ({ ...c }));
    students = defaultStudents.map((s) => ({ ...s }));
    campaignsPending = false;
    vi.clearAllMocks();
  }

  return {
    apiClientMock,
    reset,
    setCampaigns: (c: unknown[]) => {
      campaigns = c;
    },
    setCampaignsPending: (v: boolean) => {
      campaignsPending = v;
    },
  };
});

vi.mock('../../../core/api/client', () => ({
  apiClient: state.apiClientMock,
}));

function renderPage() {
  return renderWithProviders(<NotificationsPage />);
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    state.reset();
  });

  it('renders the page header and composer', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Push Notification Center' })).toBeTruthy();
    expect(screen.getByText('Compose Notification')).toBeTruthy();
    expect(screen.getByText('Campaign Log & Queue')).toBeTruthy();
    await waitFor(() => {
      expect(state.apiClientMock.get).toHaveBeenCalledTimes(3);
    });
  });

  it('shows the empty state when no campaigns exist', async () => {
    state.setCampaigns([]);
    renderPage();
    expect(await screen.findByText('No notification campaigns created yet.')).toBeTruthy();
  });

  it('renders campaign rows with target and status badges', async () => {
    renderPage();

    expect(await screen.findByText('TNPSC Group 2 Mock Test Published!')).toBeTruthy();
    expect(screen.getByText('The new mock test is live now.')).toBeTruthy();
    expect(screen.getByText('SENT')).toBeTruthy();
    expect(screen.getByText('all')).toBeTruthy();

    expect(screen.getByText('Polity Revision Batch')).toBeTruthy();
    expect(screen.getByText('PENDING')).toBeTruthy();
    expect(screen.getByText('batch')).toBeTruthy();

    expect(screen.getByText('Failed Push Attempt')).toBeTruthy();
    expect(screen.getByText('FAILED')).toBeTruthy();
    expect(screen.getByText('individual')).toBeTruthy();
  });

  it('validates that title and body are required', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Broadcast Now' }));

    expect(screen.getByText('Title and Message Body are required.')).toBeTruthy();
    expect(state.apiClientMock.post).not.toHaveBeenCalled();
  });

  it('broadcasts an immediate notification to all students', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText('e.g. TNPSC Group 2 Mock Test Published!'),
      'New Mock Test'
    );
    await user.type(screen.getByPlaceholderText('Compose message description here...'), 'Attempt now.');

    await user.click(screen.getByRole('button', { name: 'Broadcast Now' }));

    expect(state.apiClientMock.post).toHaveBeenCalledWith(
      ApiConstants.notifications.sendImmediate,
      { title: 'New Mock Test', body: 'Attempt now.', targetGroup: 'ALL', targetValue: null }
    );
    expect(await screen.findByText('Push notifications dispatched successfully!')).toBeTruthy();
  });

  it('requires a batch target when targeting a batch', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Batch-wise' }));
    await user.type(
      screen.getByPlaceholderText('e.g. TNPSC Group 2 Mock Test Published!'),
      'Batch Alert'
    );
    await user.type(screen.getByPlaceholderText('Compose message description here...'), 'Body text.');
    await user.click(screen.getByRole('button', { name: 'Broadcast Now' }));

    expect(screen.getByText('Please select a target batch.')).toBeTruthy();

    await user.selectOptions(screen.getByRole('combobox'), 'course_2');
    await user.click(screen.getByRole('button', { name: 'Broadcast Now' }));

    expect(state.apiClientMock.post).toHaveBeenCalledWith(
      ApiConstants.notifications.sendImmediate,
      { title: 'Batch Alert', body: 'Body text.', targetGroup: 'BATCH', targetValue: 'course_2' }
    );
  });

  it('requires a target student for individual notifications', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Individual' }));
    await user.type(
      screen.getByPlaceholderText('e.g. TNPSC Group 2 Mock Test Published!'),
      'Hi Priya'
    );
    await user.type(screen.getByPlaceholderText('Compose message description here...'), 'Personal note.');
    await user.click(screen.getByRole('button', { name: 'Broadcast Now' }));

    expect(screen.getByText('Please select a target individual.')).toBeTruthy();
    expect(state.apiClientMock.post).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByRole('combobox'), 'student_2');
    await user.click(screen.getByRole('button', { name: 'Broadcast Now' }));

    expect(state.apiClientMock.post).toHaveBeenCalledWith(
      ApiConstants.notifications.sendImmediate,
      { title: 'Hi Priya', body: 'Personal note.', targetGroup: 'INDIVIDUAL', targetValue: 'student_2' }
    );
  });

  it('requires a scheduled date when scheduling', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText('e.g. TNPSC Group 2 Mock Test Published!'),
      'Scheduled Announcement'
    );
    await user.type(screen.getByPlaceholderText('Compose message description here...'), 'Body.');
    await user.click(screen.getByLabelText('Schedule for Future Delivery'));

    await user.click(screen.getByRole('button', { name: 'Schedule Campaign' }));
    expect(screen.getByText('Please select a scheduled date and time.')).toBeTruthy();
    expect(state.apiClientMock.post).not.toHaveBeenCalled();
  });

  it('schedules a campaign for future delivery', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    await user.type(
      screen.getByPlaceholderText('e.g. TNPSC Group 2 Mock Test Published!'),
      'Scheduled Announcement'
    );
    await user.type(screen.getByPlaceholderText('Compose message description here...'), 'Body.');
    await user.click(screen.getByLabelText('Schedule for Future Delivery'));

    const dateInput = container.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-09-01T10:00' } });

    await user.click(screen.getByRole('button', { name: 'Schedule Campaign' }));

    expect(state.apiClientMock.post).toHaveBeenCalledWith(
      ApiConstants.notifications.campaigns,
      expect.objectContaining({
        title: 'Scheduled Announcement',
        body: 'Body.',
        targetGroup: 'ALL',
        targetValue: null,
        scheduledAt: new Date('2026-09-01T10:00').toISOString(),
      })
    );
    expect(await screen.findByText('Campaign scheduled successfully!')).toBeTruthy();
  });

  it('shows the loading spinner while campaigns are loading', async () => {
    state.setCampaignsPending(true);
    const { container } = renderPage();
    await waitFor(() => {
      expect(container.querySelector('.animate-spin')).toBeTruthy();
    });
  });
});
