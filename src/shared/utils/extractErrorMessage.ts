export function extractErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';
  
  if (typeof error === 'string') return error;

  const err = error as any;
  if (err?.response?.data?.message && typeof err.response.data.message === 'string') {
    return err.response.data.message;
  }
  
  if (err?.response?.data?.error && typeof err.response.data.error === 'string') {
    return err.response.data.error;
  }

  if (err?.message && typeof err.message === 'string') {
    if (err.message.includes('Network Error')) {
      return 'Network error. Please check your connection.';
    }
    return err.message;
  }

  return 'Something went wrong. Please try again.';
}
