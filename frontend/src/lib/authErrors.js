const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/invalid-login-credentials': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/invalid-email': "That email address doesn't look right.",
  'auth/email-already-in-use':
    'An account with this email already exists. Sign in instead.',
  'auth/weak-password': 'Passwords need at least 6 characters.',
  'auth/missing-email': 'Enter your email address first.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/network-request-failed':
    'Network problem. Check your connection and try again.',
};

export function friendlyAuthError(error) {
  if (!error) return 'Something went wrong. Try again.';
  if (AUTH_ERROR_MESSAGES[error.code]) return AUTH_ERROR_MESSAGES[error.code];
  if (typeof error.message === 'string' && error.message.includes('auth/')) {
    return 'Something went wrong signing you in. Try again.';
  }
  return error.message || 'Something went wrong. Try again.';
}
