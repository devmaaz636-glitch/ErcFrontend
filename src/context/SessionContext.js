import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile } from '../lib/users';
import { PROFILE_STORAGE_KEY } from '../lib/profileStorage';

const SessionContext = createContext(null);

const REGION_KEY = '@erc/session-region';

const EMPTY_USER = {
  uid: null,
  name: '',
  email: '',
  role: 'Regional Admin',
  region: '',
  photoUrl: null,
};

export function SessionProvider({ children }) {
  const [user, setUser] = useState(EMPTY_USER);
  const [region, setRegionState] = useState(null);
  const [ready, setReady] = useState(false);

  const hydrateProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(EMPTY_USER);
      return;
    }

    let local = {};
    try {
      const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) local = JSON.parse(raw);
    } catch {
      /* ignore */
    }

    let remote = null;
    try {
      remote = await getUserProfile(firebaseUser.uid);
    } catch {
      /* Firestore optional at boot */
    }

    const display =
      local.name ||
      remote?.displayName ||
      remote?.name ||
      firebaseUser.displayName ||
      (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Admin');

    setUser({
      uid: firebaseUser.uid,
      name: display,
      email: local.email || firebaseUser.email || '',
      role: local.role || remote?.role || 'Regional Admin',
      region: local.region || remote?.region || '',
      photoUrl: local.photoUrl || remote?.photoUrl || firebaseUser.photoURL || null,
    });
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(REGION_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        try {
          setRegionState(JSON.parse(raw));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      hydrateProfile(firebaseUser).finally(() => {
        if (active) setReady(true);
      });
    });

    return () => {
      active = false;
      unsub();
    };
  }, [hydrateProfile]);

  const setRegion = useCallback(async (next) => {
    setRegionState(next);
    setUser((prev) => ({
      ...prev,
      region: next?.name || next?.id || prev.region,
    }));
    try {
      await AsyncStorage.setItem(REGION_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const updateUser = useCallback(async (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          name: next.name,
          email: next.email,
          role: next.role,
          region: next.region,
          photoUrl: next.photoUrl,
        })
      ).catch(() => {});
      return next;
    });
  }, []);

  const clearSession = useCallback(async () => {
    setUser(EMPTY_USER);
    setRegionState(null);
    try {
      await AsyncStorage.multiRemove([REGION_KEY, PROFILE_STORAGE_KEY]);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      region,
      setRegion,
      updateUser,
      clearSession,
      refreshProfile: () => hydrateProfile(auth.currentUser),
    }),
    [ready, user, region, setRegion, updateUser, clearSession, hydrateProfile]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}
