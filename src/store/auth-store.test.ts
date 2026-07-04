import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    localStorage.clear();
  });

  it('should initialize with default empty values', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should login and store user credentials in state and localStorage', () => {
    const mockUser = {
      id: 'user-1',
      name: 'Admin User',
      email: 'admin@Mayiliragu.com',
      role: 'ADMIN' as const,
    };
    const mockAccessToken = 'access-token-123';
    const mockRefreshToken = 'refresh-token-456';

    useAuthStore.getState().login(mockUser, mockAccessToken, mockRefreshToken);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe(mockAccessToken);
    expect(state.refreshToken).toBe(mockRefreshToken);
    expect(state.isAuthenticated).toBe(true);

    expect(localStorage.getItem('accessToken')).toBe(mockAccessToken);
    expect(localStorage.getItem('refreshToken')).toBe(mockRefreshToken);
    expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual(mockUser);
  });

  it('should clear state and localStorage on logout', () => {
    const mockUser = {
      id: 'user-1',
      name: 'Admin User',
      email: 'admin@Mayiliragu.com',
      role: 'ADMIN' as const,
    };
    useAuthStore.getState().login(mockUser, 'access', 'refresh');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should correctly resolve administrator permission', () => {
    const mockAdminUser = {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@Mayiliragu.com',
      role: 'ADMIN' as const,
    };
    useAuthStore.getState().login(mockAdminUser, 'access', 'refresh');
    expect(useAuthStore.getState().hasPermission('COURSE_CREATE')).toBe(true);
  });

  it('should deny permissions to unauthenticated users', () => {
    expect(useAuthStore.getState().hasPermission('COURSE_CREATE')).toBe(false);
  });
});
