import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createPatientAppointment,
  fetchAvailability,
  fetchPatientPortal,
  openAppointmentDocument,
  updatePatientAppointment,
  uploadAppointmentDocument,
} from '../lib/patientPortal';
import { setPatientClinics, setRegionFlags } from '../lib/patientClinic';
import { setRegionPricing } from '../lib/regionPricing';
import { useSession } from './SessionContext';

const PatientDataContext = createContext(null);

// A silent refresh (screen focus) is skipped if data was fetched this recently.
const SILENT_REFRESH_MIN_MS = 15000;

const EMPTY = {
  treatments: [],
  doctors: [],
  categories: [],
  banners: [],
  popular: [],
  clinics: [],
  regions: [],
  followUps: [],
  appointments: [],
  documents: [],
};

// Clinics, currencies and flags come from the backend; push them into the
// lookup helpers so every screen prices and labels from live data.
function applyCatalogRegistries(next) {
  setPatientClinics(next?.clinics);
  setRegionPricing(next?.regions);
  setRegionFlags(next?.regions);
}

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
  const dataRef = useRef(EMPTY);
  const lastFetchRef = useRef(0);
  const lastJsonRef = useRef('');

  const persist = useCallback(
    async (next) => {
      if (!isPatient) return;
      await AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
    },
    [isPatient, key]
  );

  const refresh = useCallback(
    async ({ silent = false, force = false } = {}) => {
      if (!isPatient) return EMPTY;
      // Focus-triggered refreshes are throttled; writes (book / cancel) pass force.
      if (
        silent &&
        !force &&
        hasCacheRef.current &&
        Date.now() - lastFetchRef.current < SILENT_REFRESH_MIN_MS
      ) {
        return dataRef.current;
      }
      const showSpinner = !silent && !hasCacheRef.current;
      if (showSpinner) setLoading(true);
      else setRefreshing(true);
      try {
        const next = await fetchPatientPortal();
        hasCacheRef.current = true;
        lastFetchRef.current = Date.now();
        // A refresh that returns the same data must not re-render every tab
        // (they all stay mounted) or rewrite the cache.
        const json = JSON.stringify(next);
        if (json !== lastJsonRef.current) {
          lastJsonRef.current = json;
          dataRef.current = next;
          applyCatalogRegistries(next);
          setData(next);
          persist(next);
        }
        setError('');
        return dataRef.current;
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
          applyCatalogRegistries(cached);
          dataRef.current = { ...EMPTY, ...cached };
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
      const { document: file, ...rest } = payload;
      const created = await createPatientAppointment({
        ...rest,
        branchId: user.branchId || user.clinicId || '',
      });
      // The booking is already saved; an upload problem must not undo it.
      let item = created;
      let documentError = '';
      if (file?.uri) {
        try {
          const doc = await uploadAppointmentDocument(created.id, file);
          item = {
            ...created,
            document: { id: doc.id, name: doc.name, mimeType: doc.mimeType, size: doc.size },
          };
        } catch (uploadError) {
          documentError = uploadError.message;
        }
      }
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
      refresh({ silent: true, force: true }).catch(() => {});
      return { ...item, documentError };
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
      refresh({ silent: true, force: true }).catch(() => {});
      return item;
    },
    [persist, refresh]
  );

  // Stable identities: screens pass these to focus effects, so a new function on
  // every data change would re-trigger a refresh and loop forever.
  const refreshLoud = useCallback(() => refresh({ silent: false }), [refresh]);
  const refreshQuiet = useCallback(() => refresh({ silent: true }), [refresh]);

  const value = useMemo(
    () => ({
      ...data,
      hydrated,
      loading,
      refreshing,
      // True only on cold start with no cache — screens can show skeletons once.
      initialLoading: loading && !hasCacheRef.current && !data.treatments.length,
      error,
      refresh: refreshLoud,
      refreshSilent: refreshQuiet,
      book,
      changeAppointment,
      fetchAvailability,
      openDocument: openAppointmentDocument,
    }),
    [data, hydrated, loading, refreshing, error, refreshLoud, refreshQuiet, book, changeAppointment]
  );

  return <PatientDataContext.Provider value={value}>{children}</PatientDataContext.Provider>;
}

export function usePatientData() {
  const context = useContext(PatientDataContext);
  if (!context) throw new Error('usePatientData must be used within PatientDataProvider.');
  return context;
}
