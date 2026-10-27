import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  clinicErrorMessage,
  fetchAppointments,
  fetchBranches,
  fetchDashboard,
  fetchManagers,
  fetchManagerAppointments,
  fetchManagerAppointmentRequests,
  fetchManagerDashboard,
  fetchManagerDoctors,
  fetchManagerTreatments,
} from '../lib/clinic';
import { useSession } from './SessionContext';

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
  const { user, ready } = useSession();
  const isManager = user.role === 'clinic_manager';
  const sessionKey = `${user.uid || 'signed-out'}:${user.role}`;
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedOnce, setLoadedOnce] = useState(false);

  const loadedOnceRef = useRef(false);
  const inFlightRef = useRef(null);
  const lastFetchAtRef = useRef(0);
  const requestGenerationRef = useRef(0);

  useEffect(() => {
    requestGenerationRef.current += 1;
    inFlightRef.current = null;
    setData(EMPTY);
    loadedOnceRef.current = false;
    setLoadedOnce(false);
    lastFetchAtRef.current = 0;
    setError('');
  }, [isManager]);

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
      const requestGeneration = requestGenerationRef.current;
      try {
        const results = isManager
          ? await Promise.allSettled([
              fetchManagerDashboard(),
              fetchManagerAppointments(),
              fetchManagerAppointmentRequests(),
              fetchManagerTreatments(),
              fetchManagerDoctors(),
            ])
          : await Promise.allSettled([
              fetchDashboard(),
              fetchAppointments(),
              fetchBranches(),
              fetchManagers(),
            ]);
        const [dashboardResult, appointmentsResult, thirdResult, fourthResult, fifthResult] = results;
        const dashboard = dashboardResult.status === 'fulfilled' ? dashboardResult.value : null;
        const appointments =
          appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : null;
        const branches = isManager ? null : thirdResult.status === 'fulfilled' ? thirdResult.value : null;
        const managers = isManager ? null : fourthResult.status === 'fulfilled' ? fourthResult.value : null;
        const failed = results.filter((result) => result.status === 'rejected');

        if (failed.length === results.length) {
          throw failed[0].reason;
        }

        if (requestGeneration !== requestGenerationRef.current) return;

        setData({
          dashboard: isManager
            ? {
                ...dashboard,
                appointmentRequests:
                  dashboard?.appointmentRequests || thirdResult.value?.items || [],
                treatments: dashboard?.treatments || fourthResult.value?.items || [],
                doctors: dashboard?.doctors || fifthResult.value?.items || [],
              }
            : {
                stats: dashboard?.stats || [],
                attention: dashboard?.attention || [],
                branches: dashboard?.branches || [],
                doctors: dashboard?.doctors || [],
                managerPreview: dashboard?.managerPreview || [],
            },
          appointments: {
            stats: appointments?.stats || [],
            items: appointments?.items || [],
          },
          branches: { items: branches?.items || [] },
          managers: {
            stats: managers?.stats || null,
            items: managers?.items || [],
          },
        });
        if (failed.length > 0) {
          setError('Some clinic data could not be refreshed. Pull to retry.');
        }
        loadedOnceRef.current = true;
        setLoadedOnce(true);
        lastFetchAtRef.current = Date.now();
      } catch (err) {
        if (requestGeneration !== requestGenerationRef.current) return;
        setError(
          failedCountMessage(err, loadedOnceRef.current)
        );
      } finally {
        setLoading(false);
        if (requestGeneration === requestGenerationRef.current) {
          inFlightRef.current = null;
        }
      }

      function failedCountMessage(error, hasExistingData) {
        const message = clinicErrorMessage(error);
        if (hasExistingData && message === 'Could not load clinic data.') {
          return 'Some clinic data could not be refreshed. Pull to retry.';
        }
        return message;
      }
    })();

    inFlightRef.current = job;
    return job;
  }, [sessionKey]);

  // SessionContext is the single source of truth for the authenticated role.
  useEffect(() => {
    if (!ready) return undefined;

    if (!user.uid) {
      setData(EMPTY);
      loadedOnceRef.current = false;
      setLoadedOnce(false);
      lastFetchAtRef.current = 0;
      setError('');
      setLoading(false);
      return undefined;
    }

    refresh({ silent: true, force: true }).catch(() => {});
    return undefined;
  }, [ready, sessionKey, user.uid, refresh]);

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
