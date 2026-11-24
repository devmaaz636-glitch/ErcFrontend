import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createPatientAppointment,
  fetchAvailability,
  fetchPatientPortal,
  updatePatientAppointment,
} from '../lib/patientPortal';
import { useSession } from './SessionContext';

const PatientDataContext = createContext(null);

const EMPTY = {
  treatments: [],
  doctors: [],
  categories: [],
  banners: [],
  popular: [],
  appointments: [],
  documents: [],
};

function bumpPopular(popular = [], treatments = [], treatmentId) {
  const base = (popular?.length ? popular : treatments).map((item) => ({ ...item }));
  const hit = base.find((item) => item.id === treatmentId);
  if (hit) {
    hit.bookingCount = Number(hit.bookingCount || 0) + 1;
  } else {
    const fromCatalog = treatments.find((item) => item.id === treatmentId);
    if (fromCatalog) base.push({ ...fromCatalog, bookingCount: 1 });
  }
  return base.sort((a, b) => {
    const diff = Number(b.bookingCount || 0) - Number(a.bookingCount || 0);
    if (diff !== 0) return diff;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

export function PatientDataProvider({ children }) {
  const { user, ready } = useSession();
  const isPatient = user?.role === 'patient';
  const key = `@erc/patient-portal/${user?.uid || 'anonymous'}`;
  const [data, setData] = useState(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const hasCacheRef = useRef(false);

  const persist = useCallback(
    async (next) => {
      if (!isPatient) return;
      await AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
    },
    [isPatient, key]
  );

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!isPatient) return EMPTY;
      const showSpinner = !silent && !hasCacheRef.current;
      if (showSpinner) setLoading(true);
      else setRefreshing(true);
      try {
        const next = await fetchPatientPortal();
        hasCacheRef.current = true;
        setData(next);
        setError('');
        persist(next);
        return next;
      } catch (nextError) {
        setError(nextError.message);
        throw nextError;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isPatient, persist]
  );

  useEffect(() => {
    if (!ready || !isPatient) {
      setData(EMPTY);
      setError('');
      setHydrated(false);
      hasCacheRef.current = false;
      return undefined;
    }
    let alive = true;
    setHydrated(false);
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!alive || !raw) return;
        const cached = JSON.parse(raw);
        if (cached?.treatments || cached?.appointments) {
          hasCacheRef.current = true;
          setData({ ...EMPTY, ...cached });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!alive) return;
        setHydrated(true);
        // Silent when cache already paints the UI — no loading flash.
        refresh({ silent: hasCacheRef.current }).catch(() => {});
      });
    return () => {
      alive = false;
    };
  }, [isPatient, key, ready, refresh]);

  const book = useCallback(
    async (payload) => {
      const item = await createPatientAppointment({
        ...payload,
        branchId: user.branchId || user.clinicId || '',
      });
      setData((current) => {
        const next = {
          ...current,
          appointments: [item, ...current.appointments],
          popular: bumpPopular(current.popular, current.treatments, item.treatmentId),
        };
        persist(next);
        return next;
      });
      // Background sync — do not block booking success UI.
      refresh({ silent: true }).catch(() => {});
      return item;
    },
    [persist, refresh, user.branchId, user.clinicId]
  );

  const changeAppointment = useCallback(
    async (id, payload) => {
      const item = await updatePatientAppointment(id, payload);
      setData((current) => {
        const next = {
          ...current,
          appointments: current.appointments.map((entry) => (entry.id === id ? item : entry)),
        };
        persist(next);
        return next;
      });
      refresh({ silent: true }).catch(() => {});
      return item;
    },
    [persist, refresh]
  );

  const value = useMemo(
    () => ({
      ...data,
      hydrated,
      loading,
      refreshing,
      // True only on cold start with no cache — screens can show skeletons once.
      initialLoading: loading && !hasCacheRef.current && !data.treatments.length,
      error,
      refresh: () => refresh({ silent: false }),
      refreshSilent: () => refresh({ silent: true }),
      book,
      changeAppointment,
      fetchAvailability,
    }),
    [data, hydrated, loading, refreshing, error, refresh, book, changeAppointment]
  );

  return <PatientDataContext.Provider value={value}>{children}</PatientDataContext.Provider>;
}

export function usePatientData() {
  const context = useContext(PatientDataContext);
  if (!context) throw new Error('usePatientData must be used within PatientDataProvider.');
  return context;
}
