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
    { id: 'qa1', title: 'Mock Test Series', route: '/mock-tests', order: 1, isEnabled: true },
    { id: 'qa2', title: 'Current Affairs', route: '/current-affairs', order: 2, isEnabled: false },
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
    expect(await screen.findByDisplayValue('v1.0.0-5')).toBeTruthy();
    expect(screen.getByDisplayValue('Bug fixes and performance improvements')).toBeTruthy();
    expect(screen.getByText('1.0.0')).toBeTruthy();

    expect(screen.getByText('Mock Test Series')).toBeTruthy();
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

  it('requires a release tag before saving', async () => {
    const user = userEvent.setup();
    renderPage();

    const tagInput = await screen.findByDisplayValue('v1.0.0-5');
    fireEvent.change(tagInput, { target: { value: '' } });

    await user.click(screen.getByRole('button', { name: 'Save Configuration' }));

    expect(screen.getByText('Release Tag is required.')).toBeTruthy();
    expect(state.apiClientMock.put).not.toHaveBeenCalled();
  });

  it('requires a semantic version in the release tag', async () => {
    const user = userEvent.setup();
    renderPage();

    const tagInput = await screen.findByDisplayValue('v1.0.0-5');
    fireEvent.change(tagInput, { target: { value: 'not-a-version' } });

    await user.click(screen.getByRole('button', { name: 'Save Configuration' }));

    expect(
      screen.getByText('Release tag must contain a semantic version (e.g. v1.0.0-5 or 1.0.0)')
    ).toBeTruthy();
    expect(state.apiClientMock.put).not.toHaveBeenCalled();
  });

  it('shows the "None" detected version hint for an invalid tag', async () => {
    renderPage();
    const tagInput = await screen.findByDisplayValue('v1.0.0-5');
    fireEvent.change(tagInput, { target: { value: 'invalid' } });
    expect(screen.getByText('None (must contain version like v1.0.0)')).toBeTruthy();
  });

  it('saves the configuration building the full APK download URL', async () => {
    const user = userEvent.setup();
    renderPage();

    const tagInput = await screen.findByDisplayValue('v1.0.0-5');
    fireEvent.change(tagInput, { target: { value: 'v2.0.0-3' } });
    const notesInput = screen.getByDisplayValue('Bug fixes and performance improvements');
    fireEvent.change(notesInput, { target: { value: 'Added new mock test categories' } });

    await user.click(screen.getByRole('button', { name: 'Save Configuration' }));

    await waitFor(() => {
      expect(state.apiClientMock.put).toHaveBeenCalledWith(ApiConstants.appConfig.base, {
        requiredVersion: '2.0.0',
        apkDownloadUrl:
          'https://github.com/MayiliraguAcademyProject/mayiliragu_student/releases/download/v2.0.0-3/app-release.apk',
        releaseNotes: 'Added new mock test categories',
      });
    });
    expect(await screen.findByText('App configuration updated successfully!')).toBeTruthy();
  });

  it('saves a version tag that has no leading v', async () => {
    const user = userEvent.setup();
    renderPage();

    const tagInput = await screen.findByDisplayValue('v1.0.0-5');
    fireEvent.change(tagInput, {
      target: { value: '3.1.2-beta' },
    });

    await user.click(screen.getByRole('button', { name: 'Save Configuration' }));

    await waitFor(() => {
      expect(state.apiClientMock.put).toHaveBeenCalledWith(ApiConstants.appConfig.base, {
        requiredVersion: '3.1.2',
        apkDownloadUrl:
          'https://github.com/MayiliraguAcademyProject/mayiliragu_student/releases/download/3.1.2-beta/app-release.apk',
        releaseNotes: expect.any(String),
      });
    });
  });

  it('shows the server error message when the save fails', async () => {
    state.setFailPut(true);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Save Configuration' }));

    expect(await screen.findByText('Server rejected the configuration.')).toBeTruthy();
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
    expect(buttons[0]).toHaveTextContent('Save Configuration');
    await user.click(buttons[1]);

    await waitFor(() => {
      expect(state.apiClientMock.put).toHaveBeenCalledWith('/quick-actions/qa1', { isEnabled: false });
    });
  });
});
