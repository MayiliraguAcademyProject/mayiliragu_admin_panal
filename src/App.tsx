import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import AppProviders from './app/providers';
import { router } from './app/router';
import { useThemeStore } from './store/theme-store';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

export default function App() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}
