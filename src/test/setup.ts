import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure RTL cleans the DOM after each test even if globals registration is missed
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  window.localStorage.clear();
});

beforeEach(() => {
  // ---- jsdom-safe stubs ------------------------------------------------
  // matchMedia (used by some responsive hooks / UI libs)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Native dialogs - jsdom logs "not implemented" noise and confirm/prompt
  // return undefined by default which breaks flows. Provide controllable stubs.
  Object.defineProperty(window, 'confirm', { writable: true, value: vi.fn(() => true) });
  Object.defineProperty(window, 'alert', { writable: true, value: vi.fn() });
  Object.defineProperty(window, 'prompt', { writable: true, value: vi.fn(() => null) });

  // Object URLs are not implemented in jsdom
  Object.defineProperty(URL, 'createObjectURL', { writable: true, value: vi.fn(() => 'blob:mock') });
  Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: vi.fn() });

  // navigator.clipboard is not implemented in jsdom
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});
