import { api } from './api';
import { auth } from './firebase';

export const DEFAULT_PREFERENCES = {
  channels: {
    push: false,
    email: true,
    inApp: true,
  },
  alerts: {
    profileChanges: true,
    passwordChanges: true,
    bookingUpdates: true,
    refund: true,
    accountRequests: false,
    appointmentsThreshold: false,
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

function mergePreferences(preferences) {
  return {
    channels: {
      ...DEFAULT_PREFERENCES.channels,
      ...(preferences?.channels || {}),
    },
    alerts: {
      ...DEFAULT_PREFERENCES.alerts,
      ...(preferences?.alerts || {}),
    },
  };
}

export async function fetchNotificationPreferences() {
  const headers = await authHeaders();
  const { data } = await api.get('/api/notifications/preferences', { headers });
  return mergePreferences(data.preferences);
}

export async function saveNotificationPreferences(preferences) {
  const headers = await authHeaders();
  const payload = mergePreferences(preferences);
  const { data } = await api.put('/api/notifications/preferences', payload, { headers });
  return mergePreferences(data.preferences);
}

export async function resetNotificationPreferences() {
  const headers = await authHeaders();
  const { data } = await api.post('/api/notifications/preferences/reset', null, { headers });
  return mergePreferences(data.preferences);
}

export async function fetchNotificationFeed() {
  const headers = await authHeaders();
  const { data } = await api.get('/api/notifications/feed', { headers });
  return data.items || [];
}

/** Mark feed items read. Omit ids (or pass []) to mark all. */
export async function markNotificationsRead(ids) {
  const headers = await authHeaders();
  const payload =
    Array.isArray(ids) && ids.length > 0 ? { ids: ids.map(String) } : {};
  const { data } = await api.post('/api/notifications/read', payload, { headers });
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

/** Fire a sample clinic alert so you can verify Push / Email / In-App delivery. */
export async function sendTestNotification(overrides = {}) {
  return publishNotificationEvent({
    type: overrides.type || 'refund',
    title: overrides.title || 'Test: Refund Spike Detected',
    body:
      overrides.body ||
      'This is a test notification from ERC. If you see this in-app, by email, or as a push, that channel is working.',
    meta: { test: true, at: new Date().toISOString(), ...(overrides.meta || {}) },
  });
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
