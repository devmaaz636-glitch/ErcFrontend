import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clinicErrorMessage,
  fetchAppointments,
  fetchBranches,
  fetchDashboard,
  fetchManagers,
  fetchManagerAppointments,
  fetchManagerAppointmentRequests,
  fetchManagerDashboard,
  managerClinicCacheKey,
  readManagerHomeCache,
  resetManagerTokenPrime,
  warmManagerHomeCache,
} from '../lib/clinic';
import { useSession } from './SessionContext';

const ClinicDataContext = createContext(null);

const EMPTY = {
  dashboard: null,
  appointments: { stats: [], items: [] },
  appointmentRequests: { items: [], counts: null },
  branches: { items: [] },
  managers: { stats: null, items: [] },
};

function normalizeRequestStatus(status) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'reschedule') return 'rescheduled';
  return value;
}

function buildRequestCounts(items) {
  const counts = { all: items.length, pending: 0, approved: 0, rescheduled: 0, rejected: 0 };
  for (const item of items) {
    const status = normalizeRequestStatus(item?.status);
    if (counts[status] != null) counts[status] += 1;
  }
  return counts;
}

/** Skip network on tab focus unless data is older than this. */
const STALE_MS = 2 * 60 * 1000;

function managerCacheKey(uid) {
  return managerClinicCacheKey(uid);
}

function buildManagerDashboard(dashboard) {
  if (!dashboard) return null;
  return {
    ...dashboard,
    appointmentRequests: dashboard.appointmentRequests || [],
    treatments: dashboard.treatments || [],
    doctors: dashboard.doctors || [],
  };
}

function managerPayload(dashboard, appointments, appointmentRequests, previousRequests) {
  const fromArg = Array.isArray(appointmentRequests?.items)
    ? appointmentRequests.items
    : Array.isArray(appointmentRequests)
      ? appointmentRequests
      : null;
  // Never clobber a fuller All/Pending/Approved/Reschedule list with pending-only dashboard cards.
  const previousItems = Array.isArray(previousRequests?.items) ? previousRequests.items : [];
  const dashboardPending = Array.isArray(dashboard?.appointmentRequests)
    ? dashboard.appointmentRequests
    : [];
  const requestItems = (fromArg || (previousItems.length ? previousItems : dashboardPending)).map(
    (item) => ({
      ...item,
      status: normalizeRequestStatus(item?.status),
    })
  );
  const counts =
    appointmentRequests?.counts ||
    previousRequests?.counts ||
    buildRequestCounts(requestItems);

  return {
    dashboard: buildManagerDashboard(dashboard),
    appointments: appointments || { stats: [], items: [] },
    appointmentRequests: { items: requestItems, counts },
    branches: { items: [] },
    managers: { stats: null, items: [] },
  };
}

export function ClinicDataProvider({ children }) {
  const { user, ready } = useSession();
  const isManager = user.role === 'clinic_manager';
  const isAdmin = user.role === 'admin';
  const sessionKey = `${user.uid || 'signed-out'}:${user.role}`;
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedOnce, setLoadedOnce] = useState(false);

  const loadedOnceRef = useRef(false);
  const inFlightRef = useRef(null);
  const lastFetchAtRef = useRef(0);
  const requestGenerationRef = useRef(0);
  const dataRef = useRef(data);
  const prevIsManagerRef = useRef(isManager);
  /** Set when Verify Region confirms manager — avoids admin API 403 while session catches up. */
  const managerModeRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (isManager) managerModeRef.current = true;
  }, [isManager]);

  /**
   * Role flip handling (manager-only care):
   * - Becoming manager: DO NOT wipe to EMPTY (that caused home blink).
   * - Leaving manager → admin: clear so admin never sees manager payload.
   */
  useEffect(() => {
    const wasManager = prevIsManagerRef.current;
    prevIsManagerRef.current = isManager;

    if (wasManager && !isManager) {
      managerModeRef.current = false;
      requestGenerationRef.current += 1;
      inFlightRef.current = null;
      setData(EMPTY);
      loadedOnceRef.current = false;
      setLoadedOnce(false);
      lastFetchAtRef.current = 0;
      setError('');
      return;
    }

    if (!wasManager && isManager) {
      managerModeRef.current = true;
      requestGenerationRef.current += 1;
      inFlightRef.current = null;
      setError('');
    }
  }, [isManager]);

  const persistManagerCache = useCallback(async (uid, nextData) => {
    if (!uid || !nextData?.dashboard) return;
    try {
      await AsyncStorage.setItem(
        managerCacheKey(uid),
        JSON.stringify({
          dashboard: nextData.dashboard,
          appointments: nextData.appointments,
          appointmentRequests: nextData.appointmentRequests,
          at: Date.now(),
        })
      );
    } catch {
      /* ignore cache write failures */
    }
  }, []);

  const applyManagerData = useCallback(
    (nextData, { markFresh = false } = {}) => {
      setData(nextData);
      dataRef.current = nextData;
      loadedOnceRef.current = true;
      setLoadedOnce(true);
      setError('');
      if (markFresh) lastFetchAtRef.current = Date.now();
      persistManagerCache(user.uid, nextData);
    },
    [persistManagerCache, user.uid]
  );

  const readManagerCache = useCallback(async (uid) => {
    const cached = await readManagerHomeCache(uid);
    if (!cached?.dashboard) return null;
    return managerPayload(
      cached.dashboard,
      cached.appointments,
      cached.appointmentRequests,
      cached.appointmentRequests
    );
  }, []);

  // Clinic-manager only: hydrate from disk ASAP (no EMPTY flash).
  useEffect(() => {
    if (!ready || !user.uid || !(isManager || managerModeRef.current)) return undefined;
    let alive = true;
    readManagerCache(user.uid).then((cached) => {
      if (!alive || !cached) return;
      if (dataRef.current?.dashboard) return;
      applyManagerData(cached, { markFresh: false });
    });
    return () => {
      alive = false;
    };
  }, [ready, user.uid, isManager, readManagerCache, applyManagerData]);

  const refreshManagerHome = useCallback(async () => {
    const requestGeneration = requestGenerationRef.current;
    const dashboard = await fetchManagerDashboard();
    if (requestGeneration !== requestGenerationRef.current) return false;

    // Keep prior full request list visible while network catches up (no pending-only flash).
    const nextData = managerPayload(
      dashboard,
      dataRef.current.appointments || { stats: [], items: [] },
      null,
      dataRef.current.appointmentRequests
    );
    applyManagerData(nextData, { markFresh: true });

    Promise.all([
      fetchManagerAppointments().catch(() => null),
      fetchManagerAppointmentRequests().catch(() => null),
    ]).then(([appointments, requests]) => {
      if (requestGeneration !== requestGenerationRef.current) return;
      const merged = managerPayload(
        dataRef.current.dashboard || dashboard,
        {
          stats: appointments?.stats || dataRef.current.appointments?.stats || [],
          items: appointments?.items || dataRef.current.appointments?.items || [],
        },
        requests,
        dataRef.current.appointmentRequests
      );
      // Home approve cards stay pending-only; Appointments tab uses full appointmentRequests.
      if (merged.dashboard && Array.isArray(requests?.items)) {
        merged.dashboard = {
          ...merged.dashboard,
          appointmentRequests: requests.items.filter(
            (item) => normalizeRequestStatus(item.status) === 'pending'
          ),
        };
      }
      applyManagerData(merged, { markFresh: true });
    });

    return true;
  }, [applyManagerData]);

  const refresh = useCallback(
    async ({ silent = true, force = false } = {}) => {
      const useManager = isManager || managerModeRef.current;
      const now = Date.now();
      if (!force && loadedOnceRef.current && now - lastFetchAtRef.current < STALE_MS) {
        return;
      }
      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      if (!silent && !loadedOnceRef.current && !dataRef.current?.dashboard) {
        setLoading(true);
      }
      setError('');

      const job = (async () => {
        const requestGeneration = requestGenerationRef.current;
        try {
          if (useManager) {
            await refreshManagerHome();
            return;
          }

          // Wait until role is known — never hit admin APIs with a manager token.
          if (!isAdmin) {
            return;
          }

          const results = await Promise.allSettled([
            fetchDashboard(),
            fetchAppointments(),
            fetchBranches(),
            fetchManagers(),
          ]);
          const [dashboardResult, appointmentsResult, thirdResult, fourthResult] = results;
          const dashboard = dashboardResult.status === 'fulfilled' ? dashboardResult.value : null;
          const appointments =
            appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : null;
          const branches = thirdResult.status === 'fulfilled' ? thirdResult.value : null;
          const managers = fourthResult.status === 'fulfilled' ? fourthResult.value : null;
          const failed = results.filter((result) => result.status === 'rejected');

          if (failed.length === results.length) {
            throw failed[0].reason;
          }

          if (requestGeneration !== requestGenerationRef.current) return;

          setData({
            dashboard: {
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
          setError(failedCountMessage(err, loadedOnceRef.current || Boolean(dataRef.current?.dashboard)));
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
    },
    [sessionKey, isManager, isAdmin, refreshManagerHome]
  );

  /**
   * Zero-loading home for clinic manager:
   * 1) Use in-memory / disk cache if present (instant)
   * 2) Else join the warm promise started at Sign-In (usually already done on Verify Region)
   * 3) Soft-refresh in background after paint
   * Method: cache-first stale-while-revalidate
   */
  const ensureManagerHomeReady = useCallback(async () => {
    managerModeRef.current = true;

    if (dataRef.current?.dashboard) {
      refresh({ silent: true, force: false }).catch(() => {});
      return true;
    }

    const cached = await readManagerCache(user.uid);
    if (cached?.dashboard) {
      applyManagerData(cached, { markFresh: false });
      refresh({ silent: true, force: true }).catch(() => {});
      return true;
    }

    // Await the same warm started at login (no duplicate slow fetch).
    const warmed = await warmManagerHomeCache(user.uid);
    if (warmed?.dashboard) {
      applyManagerData(
        managerPayload(
          warmed.dashboard,
          warmed.appointments,
          warmed.appointmentRequests,
          warmed.appointmentRequests
        ),
        { markFresh: true }
      );
      return true;
    }

    try {
      await refreshManagerHome();
      return Boolean(dataRef.current?.dashboard);
    } catch (err) {
      setError(clinicErrorMessage(err));
      return Boolean(dataRef.current?.dashboard);
    }
  }, [user.uid, readManagerCache, applyManagerData, refresh, refreshManagerHome]);

  useEffect(() => {
    if (!ready) return undefined;

    if (!user.uid) {
      managerModeRef.current = false;
      resetManagerTokenPrime();
      setData(EMPTY);
      loadedOnceRef.current = false;
      setLoadedOnce(false);
      lastFetchAtRef.current = 0;
      setError('');
      setLoading(false);
      return undefined;
    }

    // Only fetch once role is known (or manager mode locked from Verify Region).
    if (!isManager && !isAdmin && !managerModeRef.current) {
      return undefined;
    }

    refresh({ silent: true, force: true }).catch(() => {});
    return undefined;
  }, [ready, sessionKey, user.uid, isManager, isAdmin, refresh]);

  /** Optimistic / real-time patch after approve · reject · reschedule. */
  const applyAppointmentRequestUpdate = useCallback(
    (updated) => {
      if (!updated?.id) return;
      const status = normalizeRequestStatus(updated.status);
      const prevItems = dataRef.current.appointmentRequests?.items || [];
      const nextItems = prevItems.some((item) => item.id === updated.id)
        ? prevItems.map((item) => (item.id === updated.id ? { ...item, ...updated, status } : item))
        : [{ ...updated, status }, ...prevItems];
      const nextRequests = {
        items: nextItems,
        counts: buildRequestCounts(nextItems),
      };
      const nextDashboard = dataRef.current.dashboard
        ? {
            ...dataRef.current.dashboard,
            appointmentRequests: nextItems.filter((item) => normalizeRequestStatus(item.status) === 'pending'),
            pendingApprovals: nextItems.filter((item) => normalizeRequestStatus(item.status) === 'pending')
              .length,
          }
        : dataRef.current.dashboard;
      applyManagerData(
        {
          ...dataRef.current,
          dashboard: nextDashboard,
          appointmentRequests: nextRequests,
        },
        { markFresh: true }
      );
    },
    [applyManagerData]
  );

  const value = useMemo(
    () => ({
      ...data,
      loading,
      error,
      loadedOnce,
      refresh,
      isManager,
      ensureManagerHomeReady,
      applyAppointmentRequestUpdate,
    }),
    [
      data,
      loading,
      error,
      loadedOnce,
      refresh,
      isManager,
      ensureManagerHomeReady,
      applyAppointmentRequestUpdate,
    ]
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
