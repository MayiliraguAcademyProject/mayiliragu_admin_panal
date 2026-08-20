import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BannerListPage from '../pages/BannerListPage';
import { renderWithProviders } from '../../../test/test-utils';

const state = vi.hoisted(() => {
  const mutation = (mutateAsync: any = vi.fn().mockResolvedValue({})) => ({
    mutateAsync,
    mutate: vi.fn(),
    isLoading: false,
    isError: false,
    isSuccess: false,
    reset: vi.fn(),
  });

  return {
    banners: [] as any[],
    bannersLoading: false,
    bannersError: null as any,
    courses: { data: [] } as any,
    tests: [] as any[],
    createBanner: mutation(),
    updateBanner: mutation(),
    deleteBanner: mutation(),
    toggleStatus: mutation(),
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useBannersAdminList: vi.fn(() => ({ data: state.banners, isLoading: state.bannersLoading, error: state.bannersError, refetch: vi.fn() })),
  useCreateBanner: vi.fn(() => state.createBanner),
  useUpdateBanner: vi.fn(() => state.updateBanner),
  useToggleBannerStatus: vi.fn(() => state.toggleStatus),
  useDeleteBanner: vi.fn(() => state.deleteBanner),
  useCoursesList: vi.fn(() => ({ data: state.courses })),
  useTestsList: vi.fn(() => ({ data: state.tests })),
}));

const sampleBanner = {
  id: 'b1',
  title: 'UPSC Crash Course 2026',
  imageUrl: 'https://images.example.com/banner1.png',
  linkUrl: 'c1',
  linkType: 'COURSE',
  linkId: 'c1',
  order: 1,
  isActive: true,
  price: 1500,
  offerPrice: 999,
};

const sampleBannerInactive = {
  id: 'b2',
  title: 'TNPSC Weekly Test',
  imageUrl: 'https://images.example.com/banner2.png',
  linkUrl: null,
  linkType: 'NONE',
  linkId: null,
  order: 2,
  isActive: false,
};

beforeEach(() => {
  state.banners = [];
  state.bannersLoading = false;
  state.bannersError = null;
  state.courses = { data: [] };
  state.tests = [];
  vi.clearAllMocks();
});

const renderPage = () => renderWithProviders(<BannerListPage />, { route: '/banners' });

const getToggleButton = (card: HTMLElement) => {
  const buttons = within(card).getAllByRole('button');
  return buttons.find(
    (b) => b.getAttribute('title') === null && (b.textContent ?? '').trim() === ''
  )!;
};

describe('BannerListPage', () => {
  it('renders banner cards with status, order and linked course', () => {
    state.banners = [sampleBanner, sampleBannerInactive];
    state.courses = { data: [{ id: 'c1', title: 'Flutter Web Development' }] };
    renderPage();

    expect(screen.getByRole('heading', { name: 'Banner Management' })).toBeTruthy();
    expect(screen.getByText('UPSC Crash Course 2026')).toBeTruthy();
    expect(screen.getByText('TNPSC Weekly Test')).toBeTruthy();

    expect(screen.getByText('Seq: #1')).toBeTruthy();
    expect(screen.getByText('Seq: #2')).toBeTruthy();

    expect(screen.getByText('Flutter Web Development')).toBeTruthy();
    expect(screen.getByText('Active & Visible')).toBeTruthy();
    expect(screen.getByText('Disabled')).toBeTruthy();
  });

  it('shows loading state', () => {
    state.bannersLoading = true;
    renderPage();

    expect(screen.getByText('Fetching banners...')).toBeTruthy();
  });

  it('shows error state', () => {
    state.bannersError = new Error('boom');
    renderPage();

    expect(screen.getByText('Failed to Load Banners')).toBeTruthy();
  });

  it('shows empty state and opens the create modal', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText('No Active Banners')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Create Your First Banner' }));

    expect(screen.getByRole('heading', { name: 'Add Promotion Banner' })).toBeTruthy();
  });

  it('toggles banner active status', async () => {
    const user = userEvent.setup();
    state.banners = [sampleBanner];
    renderPage();

    const card = screen.getByText('UPSC Crash Course 2026').closest('div')!.parentElement!;
    await user.click(getToggleButton(card));

    expect(state.toggleStatus.mutateAsync).toHaveBeenCalledWith('b1');
  });

  it('deletes a banner via confirm modal', async () => {
    const user = userEvent.setup();
    state.banners = [sampleBanner];
    renderPage();

    await user.click(screen.getByTitle('Delete Banner'));

    expect(screen.getByRole('heading', { name: 'Delete Promotion Banner?' })).toBeTruthy();

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete Banner' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(state.deleteBanner.mutateAsync).toHaveBeenCalledWith('b1');
  });

  it('opens fullscreen preview on image click', async () => {
    const user = userEvent.setup();
    state.banners = [sampleBanner];
    renderPage();

    await user.click(screen.getByAltText('UPSC Crash Course 2026'));

    expect(screen.getByAltText('Widescreen Banner Preview')).toBeTruthy();

    await user.click(screen.getByTitle('Close Preview'));
    expect(screen.queryByAltText('Widescreen Banner Preview')).toBeNull();
  });

  it('opens edit modal prefilled with banner values', async () => {
    const user = userEvent.setup();
    state.banners = [sampleBanner];
    renderPage();

    await user.click(screen.getByTitle('Edit Banner'));

    expect(screen.getByRole('heading', { name: 'Edit Promotion Banner' })).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. UPSC Exam Crash Course 2026')).toHaveValue('UPSC Crash Course 2026');
  });

  it('creates a banner with title and uploaded image', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Add Banner' }));

    await user.type(screen.getByPlaceholderText('e.g. UPSC Exam Crash Course 2026'), 'Brand New Banner');

    const file = new File(['png'], 'banner.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await user.click(screen.getByRole('button', { name: 'Create Banner' }));

    expect(state.createBanner.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Brand New Banner',
        order: 1,
        linkType: 'NONE',
        isActive: true,
        file: expect.any(File),
      })
    );
  });

  it('shows validation error for short title', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Add Banner' }));

    await user.type(screen.getByPlaceholderText('e.g. UPSC Exam Crash Course 2026'), 'ab');

    const file = new File(['png'], 'banner.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await user.click(screen.getByRole('button', { name: 'Create Banner' }));

    expect(screen.getByText('Title must be at least 3 characters')).toBeTruthy();
    expect(state.createBanner.mutateAsync).not.toHaveBeenCalled();
  });
});
