import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import AppConfigPage from '../pages/AppConfigPage';
import { ApiConstants } from '../../../core/constants';

const state = vi.hoisted(() => {
  const defaultConfig = {
    apkDownloadUrl:
      'https://github.com/MayiliraguAcademyProject/mayiliragu_student/releases/download/v1.0.0-5/app-release.apk',
    releaseNotes: 'Bug fixes and performance improvements',
  };

  const defaultQuickActions = [
    { id: 'qa1', title: 'Mock Test Series', icon: 'Award', route: '/mock-tests', order: 1, isEnabled: true },
    { id: 'qa2', title: 'Current Affairs', icon: 'Newspaper', route: '/current-affairs', order: 2, isEnabled: false },
  ];

  let config: unknown = { ...defaultConfig };
  let quickActions: unknown[] = defaultQuickActions.map((a) => ({ ...a }));
  let configPending = false;
  let failPut = false;

  const apiClientMock = {
    get: vi.fn((url: string) => {
      if (url.includes('/app-config')) {
        if (configPending) return new Promise(() => {});
        return Promise.resolve({ data: { status: 'success', data: config } });
      }
      if (url.includes('/quick-actions')) {
        return Promise.resolve({ data: { status: 'success', data: quickActions } });
      }
      return Promise.resolve({ data: {} });
    }),
    put: vi.fn((url: string, body: any) => {
      if (failPut) {
        return Promise.reject({ response: { data: { message: 'Server rejected the configuration.' } } });
      }
      if (url.includes('/quick-actions/')) {
        return Promise.resolve({ data: { status: 'success' } });
      }
      return Promise.resolve({
        data: {
          status: 'success',
          message: 'App configuration updated successfully!',
          data: { apkDownloadUrl: body.apkDownloadUrl, releaseNotes: body.releaseNotes },
        },
      });
    }),
    post: vi.fn((_url: string, _body: any) => {
      return Promise.resolve({ data: { status: 'success' } });
    }),
    delete: vi.fn((_url: string) => {
      return Promise.resolve({ data: { status: 'success' } });
    }),
  };

  function reset() {
    config = { ...defaultConfig };
    quickActions = defaultQuickActions.map((a) => ({ ...a }));
    configPending = false;
    failPut = false;
    vi.clearAllMocks();
  }

  return {
    apiClientMock,
    reset,
    setConfigPending: (v: boolean) => {
      configPending = v;
    },
    setFailPut: (v: boolean) => {
      failPut = v;
    },
  };
});

vi.mock('../../../core/api/client', () => ({
  apiClient: state.apiClientMock,
}));

function renderPage() {
  return renderWithProviders(<AppConfigPage />);
}

describe('AppConfigPage', () => {
  beforeEach(() => {
    state.reset();
  });

  it('renders the header, pre-loaded config and quick actions', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'App Configuration' })).toBeTruthy();

    expect(await screen.findByText('Mock Test Series')).toBeTruthy();
    expect(screen.getByText('/mock-tests')).toBeTruthy();
    expect(screen.getByText('Current Affairs')).toBeTruthy();
    expect(screen.getByText('/current-affairs')).toBeTruthy();

    await waitFor(() => {
      expect(state.apiClientMock.get).toHaveBeenCalledTimes(2);
    });
    expect(state.apiClientMock.get).toHaveBeenCalledWith(ApiConstants.appConfig.base);
    expect(state.apiClientMock.get).toHaveBeenCalledWith('/quick-actions');
  });

  it('shows the loading spinner while the config is loading', async () => {
    state.setConfigPending(true);
    const { container } = renderPage();
    await waitFor(() => {
      expect(container.querySelectorAll('.animate-spin').length).toBeGreaterThan(0);
    });
  });

  it.skip('requires an APK Download URL before saving', async () => {
    // App config form is commented out
  });

  it.skip('requires a semantic version in the release tag', async () => {
    // Release tag is commented out in UI
  });

  it.skip('shows the "None" detected version hint for an invalid tag', async () => {
    // Release tag is commented out in UI
  });

  it.skip('saves the configuration with custom APK download URL', async () => {
    // App config form is commented out
  });

  it.skip('saves a version tag that has no leading v', async () => {
    // Release tag is commented out in UI
  });

  it.skip('shows the server error message when the save fails', async () => {
    // App config form is commented out
  });

  it('updates the quick action order', async () => {
    renderPage();
    const orderInputs = await waitFor(() => {
      const inputs = document.querySelectorAll('input[type="number"]');
      expect(inputs.length).toBe(2);
      return inputs;
    });

    fireEvent.change(orderInputs[0], { target: { value: '3' } });

    await waitFor(() => {
      expect(state.apiClientMock.put).toHaveBeenCalledWith('/quick-actions/qa1', { order: 3 });
    });
  });

  it('toggles a quick action enabled state', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Mock Test Series');

    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toHaveTextContent('Add Quick Action');
    await user.click(buttons[2]);

    await waitFor(() => {
      expect(state.apiClientMock.put).toHaveBeenCalledWith('/quick-actions/qa1', { isEnabled: false });
    });
  });

  it('creates a new quick action', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Mock Test Series');

    // Click Add Quick Action
    await user.click(screen.getByRole('button', { name: 'Add Quick Action' }));

    // Modal fields should be visible
    const titleInput = screen.getByPlaceholderText('e.g. Current Affairs');
    const iconInput = screen.getByPlaceholderText('e.g. Newspaper, Award, BookOpen');
    const routeInput = screen.getByPlaceholderText('e.g. /current-affairs');

    await user.type(titleInput, 'New Practice Test');
    await user.type(iconInput, 'Award');
    await user.type(routeInput, '/new-practice');

    // Click Create Action button
    await user.click(screen.getByRole('button', { name: 'Create Action' }));

    await waitFor(() => {
      expect(state.apiClientMock.post).toHaveBeenCalledWith('/quick-actions', {
        title: 'New Practice Test',
        icon: 'Award',
        route: '/new-practice',
        order: 3,
        isEnabled: true,
      });
    });
  });

  it('updates a quick action details via modal', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Mock Test Series');

    // Find and click edit button for qa1
    const editButtons = screen.getAllByTitle('Edit');
    await user.click(editButtons[0]);

    // Fields should be pre-populated
    const titleInput = screen.getByPlaceholderText('e.g. Current Affairs');
    expect(titleInput).toHaveValue('Mock Test Series');

    // Edit title
    fireEvent.change(titleInput, { target: { value: 'Updated Test Series' } });

    // Click Save Changes
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(state.apiClientMock.put).toHaveBeenCalledWith('/quick-actions/qa1', {
        title: 'Updated Test Series',
        icon: 'Award',
        route: '/mock-tests',
        order: 1,
        isEnabled: true,
      });
    });
  });

  it('deletes a quick action via confirm modal', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Mock Test Series');

    // Find and click delete button for qa1
    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    // ConfirmModal should be shown
    expect(screen.getByText('Delete Quick Action')).toBeTruthy();

    // Click Confirm/Delete in modal
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(state.apiClientMock.delete).toHaveBeenCalledWith('/quick-actions/qa1');
    });
  });
});
