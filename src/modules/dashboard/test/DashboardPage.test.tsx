import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../pages/DashboardPage';
import { renderWithProviders, queryMock } from '../../../test/test-utils';

const endpointsMock = vi.hoisted(() => ({
  useAdminStats: vi.fn(),
}));

vi.mock('../../../core/api/endpoints', () => endpointsMock);

const stats = { totalStudents: 120, totalCourses: 8, totalLessons: 45 };

describe('DashboardPage', () => {
  beforeEach(() => {
    endpointsMock.useAdminStats.mockReset();
  });

  it('renders the page header and management shortcuts', () => {
    endpointsMock.useAdminStats.mockReturnValue(queryMock(stats));
    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('heading', { name: 'System Overview' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage Courses/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage Students/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tests & Assessment/ })).toBeInTheDocument();
  });

  it('renders stat values returned by the API', () => {
    endpointsMock.useAdminStats.mockReturnValue(queryMock(stats));
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('Total Courses')).toBeInTheDocument();
    expect(screen.getByText('Total Lessons')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('renders skeleton cards while loading', () => {
    endpointsMock.useAdminStats.mockReturnValue(
      queryMock(undefined, { isLoading: true, isSuccess: false })
    );
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('System Overview')).toBeInTheDocument();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3);
  });

  it('renders the error state and retries on "Try Again"', async () => {
    const refetch = vi.fn();
    endpointsMock.useAdminStats.mockReturnValue(
      queryMock(undefined, { isError: true, isSuccess: false, refetch })
    );
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    expect(
      screen.getByRole('heading', { name: 'Failed to Load Dashboard Data' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('defaults stat values to zero when stats are missing', () => {
    endpointsMock.useAdminStats.mockReturnValue(queryMock(undefined));
    renderWithProviders(<DashboardPage />);

    expect(screen.getAllByText('0')).toHaveLength(3);
  });
});
