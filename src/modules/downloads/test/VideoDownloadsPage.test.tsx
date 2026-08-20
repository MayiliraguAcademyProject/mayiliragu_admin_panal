import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import VideoDownloadsPage from '../pages/VideoDownloadsPage';

const state = vi.hoisted(() => {
  const defaultLogs = [
    {
      id: 'd1',
      student: { name: 'Priya', email: 'priya@test.com' },
      lesson: { title: 'Trigonometry Basics', module: { course: { title: 'Mathematics' } } },
      downloadedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'd2',
      student: { name: 'Rahul', email: 'rahul@test.com' },
      lesson: { title: 'Polity Overview', module: { course: { title: 'UPSC Prep' } } },
      downloadedAt: '2026-08-02T11:00:00.000Z',
    },
    {
      id: 'd3',
      student: null,
      lesson: null,
      downloadedAt: '2026-08-03T12:00:00.000Z',
    },
  ];

  let downloadsData: unknown = { data: defaultLogs.map((l) => ({ ...l })) };
  let downloadsLoading = false;
  let downloadsError = false;

  const refetchMock = vi.fn().mockResolvedValue(undefined);
  const downloadsSpy = vi.fn((_params?: { search?: string; page?: number; limit?: number }) => ({
    data: downloadsData,
    isLoading: downloadsLoading,
    isError: downloadsError,
    refetch: refetchMock,
  }));

  function reset() {
    downloadsData = { data: defaultLogs.map((l) => ({ ...l })) };
    downloadsLoading = false;
    downloadsError = false;
    vi.clearAllMocks();
  }

  return {
    downloadsSpy,
    refetchMock,
    reset,
    setDownloadsData: (d: unknown) => {
      downloadsData = d;
    },
    setDownloadsLoading: (v: boolean) => {
      downloadsLoading = v;
    },
    setDownloadsError: (v: boolean) => {
      downloadsError = v;
    },
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useVideoDownloads: state.downloadsSpy,
}));

function renderPage() {
  return renderWithProviders(<VideoDownloadsPage />);
}

describe('VideoDownloadsPage', () => {
  beforeEach(() => {
    state.reset();
  });

  it('renders the page header and search box', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Video Download Tracking' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Search student or lesson...')).toBeTruthy();
  });

  it('shows the loading state', () => {
    state.setDownloadsLoading(true);
    renderPage();
    expect(screen.getByText('Loading download logs...')).toBeTruthy();
  });

  it('shows the error state and retries via refetch', async () => {
    state.setDownloadsError(true);
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText('Failed to Load Logs')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(state.refetchMock).toHaveBeenCalled();
  });

  it('shows the empty state when no logs exist', () => {
    state.setDownloadsData({ data: [] });
    renderPage();
    expect(screen.getByText('No Download Logs Found')).toBeTruthy();
    expect(
      screen.getByText('Logs will appear once students download offline-enabled videos.')
    ).toBeTruthy();
  });

  it('renders download log rows with student, lesson and course details', () => {
    renderPage();

    expect(screen.getByText('Priya')).toBeTruthy();
    expect(screen.getByText('priya@test.com')).toBeTruthy();
    expect(screen.getByText('Trigonometry Basics')).toBeTruthy();
    expect(screen.getByText('Mathematics')).toBeTruthy();

    expect(screen.getByText('Rahul')).toBeTruthy();
    expect(screen.getByText('rahul@test.com')).toBeTruthy();
    expect(screen.getByText('Polity Overview')).toBeTruthy();
    expect(screen.getByText('UPSC Prep')).toBeTruthy();

    expect(screen.getByText(new Date('2026-08-01T10:00:00.000Z').toLocaleString())).toBeTruthy();
  });

  it('falls back to defaults for logs missing student and lesson data', () => {
    renderPage();
    expect(screen.getAllByText('Unknown').length).toBe(1);
    expect(screen.getAllByText('N/A').length).toBe(2);
    expect(screen.getAllByText('Unknown Lesson').length).toBe(1);
  });

  it('queries the API with the search term when the user types', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('Search student or lesson...'), 'Priya');

    expect(state.downloadsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Priya', page: 1, limit: 15 })
    );
  });
});
