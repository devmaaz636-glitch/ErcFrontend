import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getAuthenticatedUserProfile, getUserProfile } from '../lib/users';
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

function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  if (role === 'admin' || role === 'regional_admin' || role === 'regionaladmin') return 'admin';
  if (role === 'clinic_manager' || role === 'clinicmanager' || role === 'manager') {
    return 'clinic_manager';
  }
  return '';
}

export function roleLabel(value) {
  return normalizeRole(value) === 'clinic_manager' ? 'Clinic Manager' : 'Regional Admin';
}

function regionObjectFromName(name, previous = null) {
  const label = String(name || '').trim();
  if (!label) return previous;
  if (previous?.name === label) return previous;
  return {
    id: label.toLowerCase().replace(/\s+/g, '-'),
    name: label,
    code: previous?.code || '',
    flag: previous?.flag || '',
  };
}

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

    let claims = {};
    try {
      claims = (await firebaseUser.getIdTokenResult(true)).claims || {};
    } catch {
      /* Backend profile remains the source of truth when claims are unavailable. */
    }

    let remote = null;
    try {
      remote = await getUserProfile(firebaseUser.uid);
    } catch {
      /* Firestore optional at boot */
    }

    let backendUser = null;
    try {
      backendUser = await getAuthenticatedUserProfile();
    } catch {
      /* Backend profile is unavailable during offline startup. */
    }

    const sameUserCache = local.uid === firebaseUser.uid;
    const authoritativeRole =
      normalizeRole(claims.role) ||
      normalizeRole(backendUser?.role) ||
      normalizeRole(remote?.role) ||
      (claims.branchId || claims.clinicId || backendUser?.branchId || backendUser?.clinicId
        ? 'clinic_manager'
        : '') ||
      'admin';
    const display =
      (sameUserCache && local.name) ||
      remote?.displayName ||
      remote?.name ||
      firebaseUser.displayName ||
      (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Admin');

    const nextRegion = authoritativeRole === 'clinic_manager'
      ? backendUser.region || remote?.region || ''
      : (sameUserCache && local.region) || remote?.region || '';

    setUser({
      uid: firebaseUser.uid,
      name: display,
      email: firebaseUser.email || backendUser?.email || remote?.email || '',
      role: authoritativeRole,
      branchId: claims.branchId || claims.clinicId || backendUser?.branchId || backendUser?.clinicId || null,
      clinicId: claims.clinicId || claims.branchId || backendUser?.clinicId || backendUser?.branchId || null,
      region: backendUser?.region || nextRegion,
      photoUrl: (sameUserCache && local.photoUrl) || remote?.photoUrl || firebaseUser.photoURL || null,
    });

    if (nextRegion) {
      setRegionState((prev) => regionObjectFromName(nextRegion, prev));
    }
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
    const normalized =
      typeof next === 'string' ? regionObjectFromName(next) : next;
    setRegionState(normalized);
    setUser((prev) => ({
      ...prev,
      region: normalized?.name || prev.region,
    }));
    try {
      await AsyncStorage.setItem(REGION_KEY, JSON.stringify(normalized));
      const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      const profile = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({ ...profile, region: normalized?.name || profile.region || '' })
      );
    } catch {
      /* ignore */
    }
  }, []);

  const updateUser = useCallback(async (patch) => {
    let nextUser = null;
    setUser((prev) => {
      nextUser = { ...prev, ...patch };
      return nextUser;
    });

    if (patch?.region != null && String(patch.region).trim()) {
      const nextRegion = regionObjectFromName(patch.region);
      setRegionState(nextRegion);
      try {
        await AsyncStorage.setItem(REGION_KEY, JSON.stringify(nextRegion));
      } catch {
        /* ignore */
      }
    }

    try {
      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          uid: nextUser?.uid || '',
          name: nextUser?.name || '',
          region: nextUser?.region || '',
          photoUrl: nextUser?.photoUrl || null,
        })
      );
    } catch {
      /* ignore */
    }

    return nextUser;
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
      /** Prefer profile region; fall back to verify-region object. */
      displayRegion: user.region || region?.name || '',
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
