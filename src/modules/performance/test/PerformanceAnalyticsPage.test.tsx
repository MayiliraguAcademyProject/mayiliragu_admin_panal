import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import PerformanceAnalyticsPage from '../pages/PerformanceAnalyticsPage';

const state = vi.hoisted(() => {
  const defaultFaculty = {
    data: {
      classAverage: 64,
      atRiskCount: 1,
      weakTopics: [
        { name: 'Trigonometry', count: 5 },
        { name: 'Current Affairs', count: 3 },
      ],
      students: [
        {
          id: 's1',
          name: 'Arun Kumar',
          email: 'arun@test.com',
          readinessScore: 38,
          performanceScore: 55,
          streak: 3,
          studyHours: 12,
        },
        {
          id: 's2',
          name: 'Divya R',
          email: 'divya@test.com',
          readinessScore: 82,
          performanceScore: 90,
          streak: 9,
          studyHours: 30,
        },
      ],
    },
  };

  const defaultAdmin = {
    data: [
      {
        batch: 'Morning Batch 2026',
        studentCount: 120,
        averageReadiness: 64,
        averageStudyHours: 20,
      },
      {
        batch: 'Evening Batch 2026',
        studentCount: 85,
        averageReadiness: 48,
        averageStudyHours: 14,
      },
    ],
  };

  let facultyData: unknown = defaultFaculty;
  let facultyLoading = false;
  let adminData: unknown = defaultAdmin;
  let adminLoading = false;

  const facultyAnalyticsSpy = vi.fn((batch: string) => ({
    data: facultyData,
    isLoading: facultyLoading,
    refetch: vi.fn(),
  }));
  const adminComparisonsSpy = vi.fn(() => ({
    data: adminData,
    isLoading: adminLoading,
    refetch: vi.fn(),
  }));

  function reset() {
    facultyData = defaultFaculty;
    facultyLoading = false;
    adminData = defaultAdmin;
    adminLoading = false;
    vi.clearAllMocks();
  }

  return {
    facultyAnalyticsSpy,
    adminComparisonsSpy,
    reset,
    setFacultyData: (d: unknown) => {
      facultyData = d;
    },
    setFacultyLoading: (v: boolean) => {
      facultyLoading = v;
    },
    setAdminData: (d: unknown) => {
      adminData = d;
    },
    setAdminLoading: (v: boolean) => {
      adminLoading = v;
    },
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useFacultyClassAnalytics: state.facultyAnalyticsSpy,
  useAdminBatchComparisons: state.adminComparisonsSpy,
}));

function renderPage() {
  return renderWithProviders(<PerformanceAnalyticsPage />);
}

describe('PerformanceAnalyticsPage', () => {
  beforeEach(() => {
    state.reset();
  });

  it('renders the page header and both tabs', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Performance Analytics' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Faculty: Class Analytics' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Admin: Batch Comparisons' })).toBeTruthy();
  });

  it('renders faculty class analytics stats, weak areas, at-risk list and roster', () => {
    renderPage();

    expect(screen.getByText('Class Average Readiness')).toBeTruthy();
    expect(screen.getByText('64%')).toBeTruthy();
    expect(screen.getByText('At-Risk Students (<50% Score)')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('Total Active Students')).toBeTruthy();

    expect(screen.getByText('Classroom Weak Areas (Aggregated)')).toBeTruthy();
    expect(screen.getByText('Trigonometry')).toBeTruthy();
    expect(screen.getByText('5 students failing')).toBeTruthy();

    expect(screen.getByText('At-Risk Interventions Required')).toBeTruthy();
    expect(screen.getAllByText('Arun Kumar').length).toBe(2);
    expect(screen.getByText('38% Readiness')).toBeTruthy();
    expect(screen.queryByText('Divya R')).toBeTruthy();

    expect(screen.getByText('Classroom Performance Roster')).toBeTruthy();
    expect(screen.getByText('Readiness (%)')).toBeTruthy();
    expect(screen.getByText('55%')).toBeTruthy();
    expect(screen.getByText('3 Days')).toBeTruthy();
    expect(screen.getByText('12 hrs')).toBeTruthy();
    expect(screen.getByText('9 Days')).toBeTruthy();
  });

  it('shows a spinner while faculty analytics are loading', () => {
    state.setFacultyLoading(true);
    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('selecting a different batch re-queries faculty analytics for that batch', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(state.facultyAnalyticsSpy).toHaveBeenCalledWith('Morning Batch 2026');

    await user.selectOptions(screen.getByRole('combobox'), 'Evening Batch 2026');

    expect(state.facultyAnalyticsSpy).toHaveBeenCalledWith('Evening Batch 2026');
  });

  it('shows the no weak areas message when weakTopics is empty', () => {
    state.setFacultyData({ data: { classAverage: 0, atRiskCount: 0, weakTopics: [], students: [] } });
    renderPage();
    expect(screen.getByText('No weak areas identified yet.')).toBeTruthy();
    expect(screen.getByText('All students are above the 50% safety margin! 🎉')).toBeTruthy();
  });

  it('renders admin batch comparisons when switching tabs', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Admin: Batch Comparisons' }));

    expect(screen.getByText('Batch Comparison Overview')).toBeTruthy();
    expect(screen.getByText('120 Active Students')).toBeTruthy();
    expect(screen.getByText('85 Active Students')).toBeTruthy();
    expect(screen.getAllByText('Average Exam Readiness').length).toBe(2);
    expect(screen.getAllByText('Average Study Time').length).toBe(2);
    expect(screen.getByText('20 hrs / student')).toBeTruthy();
    expect(screen.getByText('14 hrs / student')).toBeTruthy();
  });

  it('shows a spinner while admin comparisons are loading', async () => {
    state.setAdminLoading(true);
    const user = userEvent.setup();
    const { container } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Admin: Batch Comparisons' }));

    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows the empty state when there are no batch aggregates', async () => {
    state.setAdminData({ data: [] });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Admin: Batch Comparisons' }));

    expect(screen.getByText('No batch aggregates available.')).toBeTruthy();
  });
});
