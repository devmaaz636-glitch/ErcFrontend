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
  role: '',
  region: '',
  photoUrl: null,
};

function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  if (role === 'admin' || role === 'regional_admin' || role === 'regionaladmin') return 'admin';
  if (role === 'clinic_manager' || role === 'clinicmanager' || role === 'manager') {
    return 'clinic_manager';
  }
  if (role === 'doctor' || role === 'clinic_doctor' || role === 'physician') return 'doctor';
  if (role === 'patient' || role === 'clinic_patient') return 'patient';
  return '';
}

export function roleLabel(value) {
  const role = normalizeRole(value);
  if (role === 'clinic_manager') return 'Clinic Manager';
  if (role === 'doctor') return 'Doctor';
  if (role === 'admin') return 'Regional Admin';
  if (role === 'patient') return 'Patient';
  return '';
}

function regionObjectFromName(name, previous = null) {
  const label = String(name || '').trim();
  if (!label) return previous;
  const lower = label.toLowerCase();
  const known = [
    { id: 'usa', name: 'USA', short: 'USA', code: '78690', flag: '🇺🇸' },
    { id: 'uae', name: 'UAE', short: 'UAE', code: '97100', flag: '🇦🇪' },
    { id: 'ksa', name: 'KSA', short: 'KSA', code: '96600', flag: '🇸🇦' },
    { id: 'om', name: 'Oman', short: 'Oman', code: '96800', flag: '🇴🇲' },
    { id: 'pk', name: 'Pakistan', short: 'Pakistan', code: '92000', flag: '🇵🇰' },
  ].find(
    (item) =>
      item.short.toLowerCase() === lower ||
      item.name.toLowerCase() === lower ||
      item.id === lower ||
      lower.includes(item.short.toLowerCase()) ||
      lower.includes(item.id)
  );
  if (known) {
    return { ...known, name: known.short };
  }
  if (previous?.name === label) return previous;
  return {
    id: lower.replace(/\s+/g, '-'),
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
      setRegionState(null);
      return;
    }

    let local = {};
    try {
      const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) local = JSON.parse(raw);
    } catch {
      /* ignore */
    }

    // These three sources are independent. Loading them serially made a slow
    // Firestore/API request delay the role and therefore the entire admin UI.
    const [claimResult, remoteResult, backendResult] = await Promise.allSettled([
      firebaseUser.getIdTokenResult(false),
      getUserProfile(firebaseUser.uid),
      getAuthenticatedUserProfile(),
    ]);

    let claims = claimResult.status === 'fulfilled' ? claimResult.value?.claims || {} : {};
    const remote = remoteResult.status === 'fulfilled' ? remoteResult.value : null;
    const backendUser = backendResult.status === 'fulfilled' ? backendResult.value : null;

    // A cached token can briefly pre-date an administrator role assignment.
    // Retry the claims once only when none of the sources identifies a role.
    if (!normalizeRole(claims.role) && !normalizeRole(backendUser?.role) && !normalizeRole(remote?.role)) {
      try {
        claims = (await firebaseUser.getIdTokenResult(true)).claims || claims;
      } catch {
        /* The next authenticated request will surface a real authorization error. */
      }
    }

    const sameUserCache = local.uid === firebaseUser.uid;
    const emailLower = String(firebaseUser.email || '').trim().toLowerCase();
    const authoritativeRole =
      normalizeRole(claims.role) ||
      normalizeRole(backendUser?.role) ||
      normalizeRole(remote?.role) ||
      (emailLower === 'ercdoctor@gmail.com' ? 'doctor' : '') ||
      (claims.branchId || claims.clinicId || backendUser?.branchId || backendUser?.clinicId
        ? 'clinic_manager'
        : '');
    const display =
      (sameUserCache && local.name) ||
      remote?.displayName ||
      remote?.name ||
      firebaseUser.displayName ||
      (authoritativeRole === 'doctor'
        ? 'Dr Zeeshan Forward'
        : firebaseUser.email
          ? firebaseUser.email.split('@')[0]
          : 'Admin');

    const nextRegion =
      authoritativeRole === 'clinic_manager' || authoritativeRole === 'doctor'
        ? backendUser?.region || remote?.region || claims.region || ''
        : (sameUserCache && local.region) || remote?.region || '';

    const branchId =
      claims.branchId ||
      claims.clinicId ||
      backendUser?.branchId ||
      backendUser?.clinicId ||
      (authoritativeRole === 'doctor' ? 'br-dubai' : null);

    setUser({
      uid: firebaseUser.uid,
      name: display,
      email: firebaseUser.email || backendUser?.email || remote?.email || '',
      role: authoritativeRole,
      branchId,
      clinicId: claims.clinicId || claims.branchId || backendUser?.clinicId || backendUser?.branchId || branchId,
      branchName:
        backendUser?.branch?.name ||
        backendUser?.branchName ||
        (authoritativeRole === 'doctor' ? 'Dubai Branch' : null),
      region: backendUser?.region || nextRegion || (authoritativeRole === 'doctor' ? 'UAE' : ''),
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
