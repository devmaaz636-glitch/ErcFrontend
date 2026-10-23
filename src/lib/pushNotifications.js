import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';
import { auth } from './firebase';

/**
 * Lazy + safe load of expo-notifications.
 * Expo Go can throw "Cannot find native module 'ExpoTopicSubscriptionModule'"
 * at import time — never import it at the top level so the app always opens.
 * In-App + Email keep working; Push registers only when the native module exists.
 */
let Notifications = null;
let Device = null;
let pushNativeReady = false;
let loadAttempted = false;

function loadPushNative() {
  if (loadAttempted) return pushNativeReady;
  loadAttempted = true;

  try {
    // Dynamic require — avoids crashing the whole app on startup in Expo Go.
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const notificationsMod = require('expo-notifications');
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const deviceMod = require('expo-device');

    Notifications = notificationsMod;
    Device = deviceMod;

    if (typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }

    pushNativeReady = true;
  } catch {
    Notifications = null;
    Device = null;
    pushNativeReady = false;
  }

  return pushNativeReady;
}

export function isPushNativeAvailable() {
  return loadPushNative();
}

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) return null;
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function ensurePushPermissions() {
  if (!loadPushNative()) {
    return { granted: false, reason: 'native_unavailable' };
  }
  if (Device && Device.isDevice === false) {
    return { granted: false, reason: 'simulator' };
  }

  try {
    const current = await Notifications.getPermissionsAsync();
    if (
      current.granted ||
      current.ios?.status === Notifications.IosAuthorizationStatus?.PROVISIONAL
    ) {
      return { granted: true };
    }

    const asked = await Notifications.requestPermissionsAsync();
    const granted =
      asked.granted ||
      asked.ios?.status === Notifications.IosAuthorizationStatus?.PROVISIONAL;
    return { granted, reason: granted ? undefined : 'denied' };
  } catch {
    return { granted: false, reason: 'native_unavailable' };
  }
}

export async function getExpoPushToken() {
  if (!loadPushNative()) return null;

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.extra?.projectId;

    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return tokenResponse?.data || null;
  } catch {
    return null;
  }
}

export async function registerPushDevice() {
  if (!loadPushNative()) {
    return { ok: false, reason: 'native_unavailable' };
  }

  const permission = await ensurePushPermissions();
  if (!permission.granted) {
    return { ok: false, ...permission };
  }

  const token = await getExpoPushToken();
  if (!token) return { ok: false, reason: 'no_token' };

  const headers = await authHeaders();
  if (!headers) return { ok: false, reason: 'auth' };

  await api.post(
    '/api/notifications/devices',
    { token, platform: Platform.OS },
    { headers }
  );
  return { ok: true, token };
}

export async function unregisterPushDevice(token) {
  const headers = await authHeaders();
  if (!headers || !token) return;
  try {
    await api.delete('/api/notifications/devices', {
      headers,
      data: { token },
    });
  } catch {
    /* ignore */
  }
}

export function addNotificationReceivedListener(handler) {
  if (!loadPushNative() || !Notifications?.addNotificationReceivedListener) {
    return { remove: () => {} };
  }
  try {
    return Notifications.addNotificationReceivedListener(handler);
  } catch {
    return { remove: () => {} };
  }
}

export function addNotificationResponseListener(handler) {
  if (!loadPushNative() || !Notifications?.addNotificationResponseReceivedListener) {
    return { remove: () => {} };
  }
  try {
    return Notifications.addNotificationResponseReceivedListener(handler);
  } catch {
    return { remove: () => {} };
  }
}
