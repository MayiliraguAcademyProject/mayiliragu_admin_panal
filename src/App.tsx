import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import AppProviders from './app/providers';
import { router } from './app/router';
import { useThemeStore } from './store/theme-store';

export default function App() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
