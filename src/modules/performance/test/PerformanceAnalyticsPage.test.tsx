import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import PerformanceAnalyticsPage from '../pages/PerformanceAnalyticsPage';
import type { StudentTestAttempt } from '../../../core/types';

const mockAttempts: StudentTestAttempt[] = [
  {
    id: 'att-1',
    testId: 'test-1',
    testTitle: 'Polity Prelims Mock 1',
    studentId: 'stud-1',
    studentName: 'Arun Kumar',
    studentEmail: 'arun@test.com',
    totalScore: 85,
    totalMarks: 100,
    accuracy: 85,
    timeTaken: 1800,
    passed: true,
    correct: 85,
    wrong: 10,
    skipped: 5,
    rank: 1,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'att-2',
    testId: 'test-1',
    testTitle: 'Polity Prelims Mock 1',
    studentId: 'stud-2',
    studentName: 'Divya R',
    studentEmail: 'divya@test.com',
    totalScore: 40,
    totalMarks: 100,
    accuracy: 40,
    timeTaken: 2100,
    passed: false,
    correct: 40,
    wrong: 50,
    skipped: 10,
    rank: 2,
    createdAt: '2026-09-01T11:30:00Z',
  },
  {
    id: 'att-3',
    testId: 'test-2',
    testTitle: 'History Mock Test',
    studentId: 'stud-3',
    studentName: 'Sathish Student',
    studentEmail: 'sathish@test.com',
    totalScore: 90,
    totalMarks: 100,
    accuracy: 90,
    timeTaken: 1500,
    passed: true,
    correct: 90,
    wrong: 5,
    skipped: 5,
    rank: 1,
    createdAt: '2026-09-02T12:00:00Z',
  },
];

const state = vi.hoisted(() => {
  let attemptsData: StudentTestAttempt[] = [];
  let isLoading = false;
  let isRefetching = false;
  const refetchSpy = vi.fn();

  const allTestAttemptsSpy = vi.fn(() => ({
    data: attemptsData,
    isLoading,
    refetch: refetchSpy,
    isRefetching,
  }));

  return {
    allTestAttemptsSpy,
    refetchSpy,
    setAttemptsData: (data: StudentTestAttempt[]) => {
      attemptsData = data;
    },
    setIsLoading: (val: boolean) => {
      isLoading = val;
    },
    setIsRefetching: (val: boolean) => {
      isRefetching = val;
    },
    reset: () => {
      attemptsData = [];
      isLoading = false;
      isRefetching = false;
      vi.clearAllMocks();
    },
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useAllTestAttempts: state.allTestAttemptsSpy,
  useTestAttemptDetails: vi.fn(() => ({
    data: {
      questions: [],
      sections: [],
    },
    isLoading: false,
  })),
  useBatchComparisons: vi.fn(() => ({
    data: [
      { batch: 'REGULAR', averageReadiness: 75, averageStudyHours: 4.5, studentCount: 12 },
      { batch: 'WEEKEND', averageReadiness: 68, averageStudyHours: 3.2, studentCount: 8 },
    ],
    isLoading: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('../../test-batches/services/test-batch-api', () => ({
  useTestBatchesList: vi.fn(() => ({
    data: [
      { id: 'tb-1', title: 'TNPSC Group 2 Test Series', targetCategory: 'TNPSC', description: 'Batch 1', totalQuestionPapers: 5 },
    ],
    isLoading: false,
    refetch: vi.fn(),
    isRefetching: false,
  })),
  useTestBatchDetail: vi.fn(() => ({
    data: {
      id: 'tb-1',
      title: 'TNPSC Group 2 Test Series',
      targetCategory: 'TNPSC',
      categories: [
        {
          id: 'cat-1',
          name: 'General Studies',
          questionPapers: [{ id: 'p-1', title: 'General Studies Full Mock' }],
        },
      ],
    },
    isLoading: false,
    refetch: vi.fn(),
  })),
  useBatchEnrollments: vi.fn(() => ({
    data: [{ id: 'en-1', studentId: 'stud-1' }],
    isLoading: false,
    refetch: vi.fn(),
  })),
  useBatchOmrSubmissions: vi.fn(() => ({
    data: [
      {
        id: 'omr-1',
        paperId: 'p-1',
        studentId: 'stud-1',
        totalMarks: 92,
        submittedAt: '2026-09-02T10:00:00Z',
        student: { name: 'Arun Kumar', email: 'arun@test.com' },
        paper: { title: 'General Studies Full Mock' },
      },
    ],
    isLoading: false,
    refetch: vi.fn(),
    isRefetching: false,
  })),
}));

function renderPage() {
  return renderWithProviders(<PerformanceAnalyticsPage />);
}

describe('PerformanceAnalyticsPage (Test Results & Student Marks)', () => {
  beforeEach(() => {
    state.reset();
    state.setAttemptsData(mockAttempts);
  });

  it('renders the header, title, and export button', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Test Results & Student Marks/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeTruthy();
  });

  it('calculates and renders the summary KPI cards correctly', () => {
    renderPage();
    expect(screen.getByText('Total Attempts')).toBeTruthy();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Average Accuracy')).toBeTruthy();
    // Avg accuracy: (85 + 40 + 90) / 3 = 215 / 3 = 72%
    expect(screen.getByText('72%')).toBeTruthy();

    expect(screen.getByText('Pass Rate')).toBeTruthy();
    // 2 passed out of 3 = 67%
    expect(screen.getByText('67%')).toBeTruthy();

    expect(screen.getByText('Active Test Takers')).toBeTruthy();
  });

  it('renders table rows for student test attempts with marks and ranks', () => {
    renderPage();

    expect(screen.getByText('Arun Kumar')).toBeTruthy();
    expect(screen.getByText('arun@test.com')).toBeTruthy();
    expect(screen.getAllByText('85').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('85%')).toBeTruthy();

    expect(screen.getByText('Divya R')).toBeTruthy();
    expect(screen.getByText('divya@test.com')).toBeTruthy();
    expect(screen.getAllByText('40').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('40%')).toBeTruthy();

    expect(screen.getByText('Sathish Student')).toBeTruthy();
    expect(screen.getAllByText('90').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('90%')).toBeTruthy();

    // Verify Pass / Fail badges
    expect(screen.getAllByText('PASSED').length).toBe(2);
    expect(screen.getByText('FAILED')).toBeTruthy();
  });

  it('filters rows by student search query', async () => {
    const user = userEvent.setup();
    renderPage();

    const searchInput = screen.getByPlaceholderText(/Search by student name or email/i);
    await user.type(searchInput, 'Arun');

    expect(screen.getByText('Arun Kumar')).toBeTruthy();
    expect(screen.queryByText('Divya R')).toBeNull();
    expect(screen.queryByText('Sathish Student')).toBeNull();
  });

  it('filters rows by test title dropdown', async () => {
    const user = userEvent.setup();
    renderPage();

    const testSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(testSelect, 'History Mock Test');

    expect(screen.getByText('Sathish Student')).toBeTruthy();
    expect(screen.queryByText('Arun Kumar')).toBeNull();
    expect(screen.queryByText('Divya R')).toBeNull();
  });

  it('filters rows by status pills (Passed / Failed)', async () => {
    const user = userEvent.setup();
    renderPage();

    const failedButton = screen.getByRole('button', { name: 'failed' });
    await user.click(failedButton);

    expect(screen.getByText('Divya R')).toBeTruthy();
    expect(screen.queryByText('Arun Kumar')).toBeNull();
    expect(screen.queryByText('Sathish Student')).toBeNull();

    const passedButton = screen.getByRole('button', { name: 'passed' });
    await user.click(passedButton);

    expect(screen.getByText('Arun Kumar')).toBeTruthy();
    expect(screen.getByText('Sathish Student')).toBeTruthy();
    expect(screen.queryByText('Divya R')).toBeNull();
  });

  it('opens and closes the Attempt Details Modal', async () => {
    const user = userEvent.setup();
    renderPage();

    const viewButtons = screen.getAllByTitle('View Detailed Breakdown');
    await user.click(viewButtons[0]);

    expect(screen.getByText('Passed Attempt')).toBeTruthy();
    expect(screen.getByText('Question Breakdown')).toBeTruthy();
    expect(screen.getAllByText('Marks Scored').length).toBeGreaterThanOrEqual(1);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Question Breakdown')).toBeNull();
    });
  });

  it('renders loading state when isLoading is true', () => {
    state.setIsLoading(true);
    state.setAttemptsData([]);
    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeTruthy();
    expect(screen.getByText(/Loading test attempts and marks/i)).toBeTruthy();
  });

  it('renders empty state when no attempts exist', () => {
    state.setAttemptsData([]);
    renderPage();
    expect(screen.getByText(/No Test Attempts Found/i)).toBeTruthy();
  });

  it('switches to Test Batches tab and displays batch submissions and cohort comparisons', async () => {
    const user = userEvent.setup();
    renderPage();

    const batchesTabButton = screen.getByRole('button', { name: /Test Batches/i });
    await user.click(batchesTabButton);

    expect(screen.getByRole('heading', { name: /Test Batches & Cohort Performance/i })).toBeTruthy();
    expect(screen.getByText('Selected Test Batch')).toBeTruthy();
    expect(screen.getByText('TNPSC Group 2 Test Series (TNPSC)')).toBeTruthy();
    expect(screen.getAllByText('General Studies Full Mock').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('92 Marks')).toBeTruthy();
  });

  it('switches to Student Performance tab and opens student report card', async () => {
    const user = userEvent.setup();
    renderPage();

    const studentsTabButton = screen.getByRole('button', { name: /Student Performance/i });
    await user.click(studentsTabButton);

    expect(screen.getByRole('heading', { name: /Student Performance & Dossiers/i })).toBeTruthy();
    expect(screen.getByText('Total Students Tested')).toBeTruthy();

    // Verify student row
    expect(screen.getAllByText('Arun Kumar').length).toBeGreaterThanOrEqual(1);

    // Click Dossier to open Student Report Card
    const dossierButtons = screen.getAllByRole('button', { name: /Dossier/i });
    await user.click(dossierButtons[0]);

    expect(screen.getByText('Student Performance Report Card')).toBeTruthy();
    expect(screen.getByText('Score Progression Timeline')).toBeTruthy();
    expect(screen.getByText('Complete Test Attempts History')).toBeTruthy();

    const closeReportCard = screen.getByRole('button', { name: /Close Report Card/i });
    await user.click(closeReportCard);

    await waitFor(() => {
      expect(screen.queryByText('Student Performance Report Card')).toBeNull();
    });
  });
});
