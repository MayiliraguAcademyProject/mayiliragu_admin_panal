import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import PaymentSettingsPage from '../pages/PaymentSettingsPage';

const state = vi.hoisted(() => {
  let settings: unknown = null;
  let loading = false;

  const upsertMutation = vi.fn().mockResolvedValue({});

  function reset() {
    settings = null;
    loading = false;
    vi.clearAllMocks();
  }

  return {
    upsertMutation,
    reset,
    setSettings: (s: unknown) => {
      settings = s;
    },
    setLoading: (v: boolean) => {
      loading = v;
    },
    getSettings: () => settings,
    getLoading: () => loading,
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useGetPaymentSettings: () => ({ data: state.getSettings(), isLoading: state.getLoading() }),
  useUpsertPaymentSettings: () => ({
    mutateAsync: state.upsertMutation,
    mutate: state.upsertMutation,
    isPending: false,
  }),
}));

function renderPage() {
  return renderWithProviders(<PaymentSettingsPage />);
}

describe('PaymentSettingsPage', () => {
  beforeEach(() => {
    state.reset();
  });

  it('shows the loading state', () => {
    state.setLoading(true);
    renderPage();
    expect(screen.getByText('Loading payment settings...')).toBeTruthy();
  });

  it('renders the page header and form', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Global Payment Settings' })).toBeTruthy();
    expect(screen.getByText('UPI QR Code Image')).toBeTruthy();
    expect(screen.getByText('Upload QR Code')).toBeTruthy();
    expect(screen.getByText('Select Image')).toBeTruthy();
    expect(screen.getByText('Payment Instructions')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save Settings' })).toBeTruthy();
  });

  it('requires a QR image before saving', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText(/Scan the QR code using any UPI app/),
      'Scan and pay'
    );
    await user.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(screen.getByText('Please upload a UPI QR code image.')).toBeTruthy();
    expect(state.upsertMutation).not.toHaveBeenCalled();
  });

  it('requires payment instructions before saving', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['qr-data'], 'qr.png', { type: 'image/png' });
    await user.upload(fileInput, file);

    expect(screen.getByAltText('QR Preview')).toBeTruthy();
    expect(screen.getByText('Change QR Image')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(screen.getByText('Please enter payment instructions.')).toBeTruthy();
    expect(state.upsertMutation).not.toHaveBeenCalled();
  });

  it('saves existing settings without a file and shows a success message', async () => {
    state.setSettings({
      instructions: 'Scan and pay using any UPI app.',
      qrImageUrl: 'http://127.0.0.1:5000/qr/current.png',
    });
    const user = userEvent.setup();
    renderPage();

    const textarea = screen.getByPlaceholderText(/Scan the QR code using any UPI app/) as HTMLTextAreaElement;
    expect(textarea.value).toBe('Scan and pay using any UPI app.');
    expect(screen.getByAltText('QR Preview')).toBeTruthy();

    await user.clear(textarea);
    await user.type(textarea, 'Updated instructions.');
    await user.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(state.upsertMutation).toHaveBeenCalledWith({ instructions: 'Updated instructions.', file: undefined });
    expect(screen.getByText('Payment settings saved successfully.')).toBeTruthy();
  });

  it('saves with a newly uploaded QR file', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['qr-data'], 'qr.png', { type: 'image/png' });
    await user.upload(fileInput, file);
    await user.type(
      screen.getByPlaceholderText(/Scan the QR code using any UPI app/),
      'Scan, pay, and upload receipt.'
    );

    await user.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(state.upsertMutation).toHaveBeenCalledWith({ instructions: 'Scan, pay, and upload receipt.', file });
    expect(screen.getByText('Payment settings saved successfully.')).toBeTruthy();
  });
});
