import { api } from './api';
import { auth } from './firebase';

export const DEFAULT_PREFERENCES = {
  channels: {
    push: false,
    email: true,
    inApp: false,
  },
  alerts: {
    refund: true,
    accountRequests: false,
    revenueThreshold: false,
    capacityThreshold: false,
    booking: false,
  },
};

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error('Sign in required.');
    error.code = 'auth/required';
    throw error;
  }
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function fetchNotificationPreferences() {
  const headers = await authHeaders();
  const { data } = await api.get('/api/notifications/preferences', { headers });
  return data.preferences || DEFAULT_PREFERENCES;
}

export async function saveNotificationPreferences(preferences) {
  const headers = await authHeaders();
  const { data } = await api.put('/api/notifications/preferences', preferences, { headers });
  return data.preferences;
}

export async function resetNotificationPreferences() {
  const headers = await authHeaders();
  const { data } = await api.post('/api/notifications/preferences/reset', null, { headers });
  return data.preferences;
}

export async function fetchNotificationFeed() {
  const headers = await authHeaders();
  const { data } = await api.get('/api/notifications/feed', { headers });
  return data.items || [];
}

export async function publishNotificationEvent({ type, title, body, meta }) {
  const headers = await authHeaders();
  const { data } = await api.post(
    '/api/notifications/events',
    { type, title, body, meta },
    { headers }
  );
  return data;
}

export function notificationErrorMessage(error) {
  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  if (error?.code === 'auth/required') {
    return 'Sign in again to manage notifications.';
  }
  if (error?.message === 'Network Error') {
    return 'Cannot reach the API. Start the backend and use the same Wi‑Fi.';
  }
  return error?.message || 'Something went wrong. Please try again.';
}
