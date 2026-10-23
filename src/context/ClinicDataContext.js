import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  clinicErrorMessage,
  fetchAppointments,
  fetchBranches,
  fetchDashboard,
  fetchManagers,
} from '../lib/clinic';

const ClinicDataContext = createContext(null);

const EMPTY = {
  dashboard: null,
  appointments: { stats: [], items: [] },
  branches: { items: [] },
  managers: { stats: null, items: [] },
};

/** Skip network on tab focus unless data is older than this. */
const STALE_MS = 2 * 60 * 1000;

export function ClinicDataProvider({ children }) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedOnce, setLoadedOnce] = useState(false);

  const loadedOnceRef = useRef(false);
  const inFlightRef = useRef(null);
  const lastFetchAtRef = useRef(0);

  const refresh = useCallback(async ({ silent = true, force = false } = {}) => {
    const now = Date.now();
    if (!force && loadedOnceRef.current && now - lastFetchAtRef.current < STALE_MS) {
      return;
    }
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    // Never show a spinner after the first load — tab switches stay instant.
    if (!silent && !loadedOnceRef.current) {
      setLoading(true);
    }
    setError('');

    const job = (async () => {
      try {
        const [dashboard, appointments, branches, managers] = await Promise.all([
          fetchDashboard(),
          fetchAppointments(),
          fetchBranches(),
          fetchManagers(),
        ]);
        setData({
          dashboard: {
            stats: dashboard.stats || [],
            attention: dashboard.attention || [],
            branches: dashboard.branches || [],
            doctors: dashboard.doctors || [],
            managerPreview: dashboard.managerPreview || [],
          },
          appointments: {
            stats: appointments.stats || [],
            items: appointments.items || [],
          },
          branches: { items: branches.items || [] },
          managers: {
            stats: managers.stats || null,
            items: managers.items || [],
          },
        });
        loadedOnceRef.current = true;
        setLoadedOnce(true);
        lastFetchAtRef.current = Date.now();
      } catch (err) {
        setError(clinicErrorMessage(err));
      } finally {
        setLoading(false);
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = job;
    return job;
  }, []);

  // Prefetch once after sign-in so every tab already has data (no wait on switch).
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setData(EMPTY);
        loadedOnceRef.current = false;
        setLoadedOnce(false);
        lastFetchAtRef.current = 0;
        setError('');
        setLoading(false);
        return;
      }
      refresh({ silent: true, force: true }).catch(() => {});
    });
    return unsub;
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...data,
      loading,
      error,
      loadedOnce,
      refresh,
    }),
    [data, loading, error, loadedOnce, refresh]
  );

  return <ClinicDataContext.Provider value={value}>{children}</ClinicDataContext.Provider>;
}

export function useClinicData() {
  const ctx = useContext(ClinicDataContext);
  if (!ctx) {
    throw new Error('useClinicData must be used within ClinicDataProvider');
  }
  return ctx;
}
