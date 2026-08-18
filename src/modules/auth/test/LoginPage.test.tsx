import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../pages/LoginPage';
import { useAuthStore } from '../../../store/auth-store';
import { renderWithProviders } from '../../../test/test-utils';

const { apiClient } = vi.hoisted(() => ({ apiClient: { post: vi.fn() } }));

vi.mock('../../../core/api/client', () => ({
  apiClient,
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const adminUser = { id: 'u1', name: 'Admin', email: 'admin@mayiliragu.com', role: 'ADMIN' };

function mockLoginSuccess() {
  (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { data: { user: adminUser, accessToken: 'access-1', refreshToken: 'refresh-1' } },
  });
}

describe('LoginPage', () => {
  beforeEach(() => {
    apiClient.post.mockReset();
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  });

  it('renders the admin login form', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Mayiliragu Admin Portal' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In to Dashboard' })).toBeInTheDocument();
  });

  it('shows validation errors for empty/invalid fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign In to Dashboard' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('shows an invalid email error for malformed emails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email Address'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign In to Dashboard' }));

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('calls the login API and persists auth state on success', async () => {
    const user = userEvent.setup();
    mockLoginSuccess();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email Address'), 'admin@mayiliragu.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign In to Dashboard' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'admin@mayiliragu.com',
        password: 'secret123',
      });
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.role).toBe('ADMIN');
    expect(window.localStorage.getItem('accessToken')).toBe('access-1');
  });

  it('rejects non-admin accounts with an access denied message', async () => {
    const user = userEvent.setup();
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        data: {
          user: { ...adminUser, role: 'STUDENT' },
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
        },
      },
    });
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email Address'), 'student@mayiliragu.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign In to Dashboard' }));

    expect(
      await screen.findByText('Access denied. Admin portal is restricted to administrator accounts only.')
    ).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('shows a friendly database error message', async () => {
    const user = userEvent.setup();
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: { message: 'Prisma error: connection refused' } },
    });
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email Address'), 'admin@mayiliragu.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign In to Dashboard' }));

    expect(
      await screen.findByText('Unable to connect to the database server. Please try again later.')
    ).toBeInTheDocument();
  });

  it('shows a generic error when the request fails', async () => {
    const user = userEvent.setup();
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network down'));
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email Address'), 'admin@mayiliragu.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign In to Dashboard' }));

    expect(await screen.findByText('Network down')).toBeInTheDocument();
  });
});
