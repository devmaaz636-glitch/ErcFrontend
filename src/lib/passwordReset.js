import { api } from './api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Keep in sync with Backend/src/passwordReset.js passwordProblem(). */
export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Use at least 8 characters.';
  }
  if (password.length > 128) {
    return 'Use 128 characters or fewer.';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Use at least one letter and one number.';
  }
  return null;
}

export function isValidResetEmail(email) {
  return EMAIL_PATTERN.test(String(email || '').trim());
}

export async function requestResetCode(email) {
  const { data } = await api.post('/api/auth/password-reset/request', {
    email: String(email).trim(),
  });
  return data;
}

export async function verifyResetCode(email, code) {
  const { data } = await api.post('/api/auth/password-reset/verify', {
    email: String(email).trim(),
    code: String(code).trim(),
  });
  return data;
}

export async function confirmNewPassword(resetToken, password) {
  const { data } = await api.post('/api/auth/password-reset/confirm', {
    resetToken,
    password,
  });
  return data;
}

export function resetErrorMessage(error) {
  const body = error?.response?.data;
  if (typeof body?.message === 'string' && body.message) {
    return body.message;
  }
  if (typeof body?.error === 'string' && body.error) {
    return body.error;
  }
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'The server took too long. Check that the backend is running.';
  }
  if (error?.message === 'Network Error') {
    return 'Cannot reach the API. Start the backend and use the same Wi‑Fi.';
  }
  return error?.message || 'Something went wrong. Please try again.';
}
