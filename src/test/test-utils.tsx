import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { ToastProvider } from '../shared/context';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

interface RenderOptions {
  /** Initial history entry, e.g. `/courses/c1` for detail pages. */
  route?: string;
  /**
   * When provided, the ui is rendered against a matching route path so that
   * `useParams` works. Example: `[{ path: '/courses/:id', element: <Page /> }]`
   */
  routes?: { path: string; element: ReactElement }[];
}

/** Render a component wrapped in the app's providers (QueryClient + router + ToastProvider). */
export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const { route = '/', routes } = options;
  const queryClient = createQueryClient();

  const content: ReactNode = routes ? (
    <Routes>
      {routes.map((r) => (
        <Route key={r.path} path={r.path} element={r.element} />
      ))}
    </Routes>
  ) : (
    ui
  );

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );

  return { ...result, queryClient };
}

/** Default shape for a mocked react-query `useQuery` hook. */
export function queryMock<T = unknown>(data: T, overrides: Record<string, unknown> = {}) {
  return {
    data,
    isLoading: false,
    isError: false,
    isSuccess: true,
    isFetching: false,
    refetch: vi.fn().mockResolvedValue(data),
    ...overrides,
  };
}

/** Default shape for a mocked react-query `useMutation` hook. */
export function mutationMock(
  mutateAsync: (args?: unknown) => Promise<unknown> = vi.fn().mockResolvedValue({})
) {
  return {
    mutateAsync,
    mutate: vi.fn(),
    isPending: false,
    isLoading: false,
    isError: false,
    isSuccess: false,
    reset: vi.fn(),
  };
}

/** Mocked axios-style apiClient (for pages that call `apiClient.*` directly). */
export function createApiClientMock() {
  return {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
}

/** Reset a mocked auth store / apiClient between tests. */
export function resetAuthState() {
  window.localStorage.clear();
}
