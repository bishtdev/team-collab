export const extractError = (err) =>
  err.response?.data?.error || err.message || 'An unexpected error occurred';
