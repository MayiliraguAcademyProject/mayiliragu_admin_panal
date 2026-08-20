import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import GlobalErrorFallback from './GlobalErrorFallback';

export default function RouterErrorPage() {
  const error = useRouteError() as any;

  console.error('[RouterErrorPage caught route error]:', error);

  let is404 = false;
  let title = 'Unexpected Router Error';
  let message = 'An error occurred while loading this page route.';
  let errObj: Error | null = null;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      is404 = true;
      title = '404 - Page Not Found';
      message = 'The route you are looking for does not exist or has been moved.';
    } else {
      title = `${error.status} - ${error.statusText || 'Route Error'}`;
      message = error.data?.message || 'Failed to load route resource.';
    }
  } else if (error instanceof Error) {
    errObj = error;
    message = error.message;
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      title = 'Application Version Updated';
      message = 'A new version of the application is available. Please reload the page to load the latest components.';
    }
  }

  return (
    <GlobalErrorFallback
      error={errObj}
      is404={is404}
      title={title}
      message={message}
      resetErrorBoundary={() => {
        window.location.reload();
      }}
    />
  );
}
