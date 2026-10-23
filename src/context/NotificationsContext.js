import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  DEFAULT_PREFERENCES,
  fetchNotificationFeed,
  fetchNotificationPreferences,
  notificationErrorMessage,
  resetNotificationPreferences,
  saveNotificationPreferences,
  sendTestNotification,
} from '../lib/notifications';
import { openNotificationStream } from '../lib/notificationStream';
import {
  addNotificationReceivedListener,
  isExpoGoRuntime,
  registerPushDevice,
  unregisterPushDevice,
} from '../lib/pushNotifications';

const NotificationsContext = createContext(null);

const CACHE_KEY = '@erc/notify-cache';

/**
 * Zero-wait notification store:
 * 1. Hydrate prefs + feed from AsyncStorage instantly
 * 2. Sync from API in background after auth
 * 3. Keep live via SSE (poll fallback)
 * 4. Optimistic channel toggles → Redis
 * 5. Register Expo push token when Push is ON
 */
export function NotificationsProvider({ children }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [feed, setFeed] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [live, setLive] = useState(false);

  const pushTokenRef = useRef(null);
  const prefsRef = useRef(preferences);
  const stopStreamRef = useRef(null);
  const savingRef = useRef(false);

  useEffect(() => {
    prefsRef.current = preferences;
  }, [preferences]);

  const persistCache = useCallback(async (nextPrefs, nextFeed) => {
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          preferences: nextPrefs,
          feed: nextFeed,
          at: Date.now(),
        })
      );
    } catch {
      /* ignore */
    }
  }, []);

  const applyFeed = useCallback(
    (items) => {
      const list = Array.isArray(items) ? items : [];
      setFeed(list);
      setUnreadCount(list.filter((i) => !i.read).length);
      persistCache(prefsRef.current, list);
    },
    [persistCache]
  );

  const prependItem = useCallback(
    (item) => {
      if (!item?.id) return;
      setFeed((prev) => {
        if (prev.some((x) => x.id === item.id)) return prev;
        const next = [item, ...prev].slice(0, 50);
        setUnreadCount(next.filter((i) => !i.read).length);
        persistCache(prefsRef.current, next);
        return next;
      });
    },
    [persistCache]
  );

  // Instant UI from disk (zero loading).
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        const cached = JSON.parse(raw);
        if (cached.preferences) setPreferences(cached.preferences);
        if (Array.isArray(cached.feed)) {
          setFeed(cached.feed);
          setUnreadCount(cached.feed.filter((i) => !i.read).length);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const syncFromApi = useCallback(async () => {
    try {
      const [prefs, items] = await Promise.all([
        fetchNotificationPreferences(),
        fetchNotificationFeed().catch(() => []),
      ]);
      setPreferences(prefs);
      prefsRef.current = prefs;
      applyFeed(items);
      setError('');
      return prefs;
    } catch (err) {
      setError(notificationErrorMessage(err));
      return null;
    }
  }, [applyFeed]);

  const startRealtime = useCallback(() => {
    stopStreamRef.current?.();
    stopStreamRef.current = openNotificationStream({
      onEvent: (payload) => {
        setLive(true);
        if (payload?.type === 'snapshot' && Array.isArray(payload.items)) {
          applyFeed(payload.items);
          return;
        }
        if (payload?.type === 'notification' && payload.item) {
          prependItem(payload.item);
          return;
        }
        // Raw item from Redis publish (SSE notification wrapper may vary)
        if (payload?.id && payload?.title) {
          prependItem(payload);
        }
      },
      onError: () => setLive(false),
      pollMs: 6000,
    });
  }, [applyFeed, prependItem]);

  // Auth lifecycle: sync + live stream + push registration.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      stopStreamRef.current?.();
      stopStreamRef.current = null;
      setLive(false);

      if (!user) {
        setPreferences(DEFAULT_PREFERENCES);
        setFeed([]);
        setUnreadCount(0);
        return;
      }

      const prefs = await syncFromApi();
      startRealtime();

      // Never touch expo-notifications inside Expo Go (missing native module).
      if (prefs?.channels?.push && !isExpoGoRuntime()) {
        const result = await registerPushDevice().catch(() => ({ ok: false }));
        if (result?.ok) pushTokenRef.current = result.token;
      }
    });

    return () => {
      unsub();
      stopStreamRef.current?.();
    };
  }, [syncFromApi, startRealtime]);

  // Foreground: resume stream if app returns.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && auth.currentUser) {
        syncFromApi().catch(() => {});
        if (!live) startRealtime();
      }
    });
    return () => sub.remove();
  }, [live, syncFromApi, startRealtime]);

  // Reflect OS push receipts into the in-app feed — only when Push is enabled
  // (avoids loading expo-notifications native modules on cold start / Expo Go).
  useEffect(() => {
    if (!preferences.channels?.push || isExpoGoRuntime()) {
      return undefined;
    }
    const sub = addNotificationReceivedListener((notification) => {
      const content = notification?.request?.content;
      if (!content) return;
      prependItem({
        id: notification.request.identifier || `local-${Date.now()}`,
        title: content.title || 'Notification',
        body: content.body || '',
        type: content.data?.type || 'push',
        createdAt: new Date().toISOString(),
        read: false,
        channels: { push: true },
      });
    });
    return () => sub.remove();
  }, [preferences.channels?.push, prependItem]);

  const setChannel = useCallback(
    async (key, value) => {
      const previous = prefsRef.current;
      const next = {
        ...previous,
        channels: { ...previous.channels, [key]: value },
      };

      // Optimistic — UI updates with zero wait.
      setPreferences(next);
      prefsRef.current = next;
      persistCache(next, feed);
      setNotice('');
      setError('');

      try {
        const saved = await saveNotificationPreferences(next);
        setPreferences(saved);
        prefsRef.current = saved;
        persistCache(saved, feed);

        if (key === 'push') {
          if (value) {
            const result = await registerPushDevice();
            if (!result.ok) {
              setError(
                result.reason === 'denied'
                  ? 'Enable notification permission in system settings.'
                  : result.reason === 'simulator'
                    ? 'Push needs a physical device.'
                    : result.reason === 'native_unavailable'
                      ? 'Push needs a development build (not Expo Go). In-App and Email still work.'
                      : 'Could not register this device for push.'
              );
            } else {
              pushTokenRef.current = result.token;
              setNotice('Push notifications enabled.');
            }
          } else if (pushTokenRef.current) {
            await unregisterPushDevice(pushTokenRef.current);
            pushTokenRef.current = null;
            setNotice('Push notifications disabled.');
          }
        } else if (key === 'email' && value) {
          setNotice('Email notifications enabled.');
        } else if (key === 'inApp' && value) {
          setNotice('In-app notifications enabled.');
          startRealtime();
        }
      } catch (err) {
        setPreferences(previous);
        prefsRef.current = previous;
        persistCache(previous, feed);
        setError(notificationErrorMessage(err));
      }
    },
    [feed, persistCache, startRealtime]
  );

  const setAlert = useCallback(
    async (key, value) => {
      const previous = prefsRef.current;
      const next = {
        ...previous,
        alerts: { ...previous.alerts, [key]: value },
      };
      setPreferences(next);
      prefsRef.current = next;
      persistCache(next, feed);
      try {
        const saved = await saveNotificationPreferences(next);
        setPreferences(saved);
        prefsRef.current = saved;
        persistCache(saved, feed);
      } catch (err) {
        setPreferences(previous);
        prefsRef.current = previous;
        setError(notificationErrorMessage(err));
      }
    },
    [feed, persistCache]
  );

  const saveAll = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setError('');
    setNotice('');
    try {
      const saved = await saveNotificationPreferences(prefsRef.current);
      setPreferences(saved);
      prefsRef.current = saved;
      persistCache(saved, feed);
      setNotice('Preferences saved.');
    } catch (err) {
      setError(notificationErrorMessage(err));
    } finally {
      savingRef.current = false;
    }
  }, [feed, persistCache]);

  const resetAll = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setError('');
    setNotice('');
    try {
      const saved = await resetNotificationPreferences();
      setPreferences(saved);
      prefsRef.current = saved;
      persistCache(saved, feed);
      setNotice('Defaults restored.');
    } catch (err) {
      setError(notificationErrorMessage(err));
    } finally {
      savingRef.current = false;
    }
  }, [feed, persistCache]);

  const sendTest = useCallback(async () => {
    setError('');
    setNotice('');
    try {
      // Ensure at least one channel + refund alert so the test can deliver.
      const current = prefsRef.current;
      const patched = {
        ...current,
        channels: {
          push: current.channels?.push || false,
          email: current.channels?.email ?? true,
          inApp: current.channels?.inApp ?? true,
        },
        alerts: { ...current.alerts, refund: true },
      };
      if (!patched.channels.push && !patched.channels.email && !patched.channels.inApp) {
        patched.channels.inApp = true;
      }
      const saved = await saveNotificationPreferences(patched);
      setPreferences(saved);
      prefsRef.current = saved;

      if (saved.channels.push && !pushTokenRef.current && !isExpoGoRuntime()) {
        const reg = await registerPushDevice().catch(() => ({ ok: false }));
        if (reg?.ok) pushTokenRef.current = reg.token;
      }

      const result = await sendTestNotification();
      if (result?.item) prependItem(result.item);
      await syncFromApi();

      const d = result?.delivery || {};
      const parts = [
        d.inApp ? 'In-App ✓' : 'In-App —',
        d.email ? 'Email ✓' : 'Email —',
        d.push ? 'Push ✓' : 'Push —',
      ];
      if (!result?.delivered) {
        setError(result?.reason || 'Test was not delivered. Enable a channel and try again.');
      } else {
        setNotice(`Test sent · ${parts.join('  ')}`);
      }
      return result;
    } catch (err) {
      setError(notificationErrorMessage(err));
      return null;
    }
  }, [prependItem, syncFromApi]);

  const value = useMemo(
    () => ({
      ready,
      live,
      preferences,
      feed,
      unreadCount,
      error,
      notice,
      setNotice,
      setError,
      setChannel,
      setAlert,
      saveAll,
      resetAll,
      sendTest,
      refresh: syncFromApi,
      channels: preferences.channels,
    }),
    [
      ready,
      live,
      preferences,
      feed,
      unreadCount,
      error,
      notice,
      setChannel,
      setAlert,
      saveAll,
      resetAll,
      sendTest,
      syncFromApi,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}
