import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  adminClinicCacheKey,
  adminHomeShell,
  clinicErrorMessage,
  fetchAppointments,
  fetchBranches,
  fetchDashboard,
  fetchManagers,
  fetchManagerAppointments,
  fetchManagerAppointmentRequests,
  fetchManagerDashboard,
  hasRealAdminDashboard,
  isAdminShellPayload,
  managerClinicCacheKey,
  peekAdminHomePayload,
  readAdminHomeCache,
  readManagerHomeCache,
  rememberAdminHomePayload,
  resetManagerTokenPrime,
  warmAdminHomeCache,
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

function adminCacheKey(uid) {
  return adminClinicCacheKey(uid);
}

function adminPayload({
  dashboard,
  appointments,
  branches,
  managers,
} = {}) {
  return {
    dashboard: dashboard
      ? {
          stats: dashboard.stats || [],
          attention: dashboard.attention || [],
          branches: dashboard.branches || [],
          doctors: dashboard.doctors || [],
          managerPreview: dashboard.managerPreview || [],
        }
      : null,
    appointments: appointments || { stats: [], items: [] },
    appointmentRequests: { items: [], counts: null },
    branches: branches || { items: [] },
    managers: managers || { stats: null, items: [] },
  };
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
  /** Set when Verify Region confirms admin — hydrate cache before MainTabs paints. */
  const adminModeRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (isManager) managerModeRef.current = true;
    if (isAdmin) adminModeRef.current = true;
  }, [isManager, isAdmin]);

  /**
   * Role flip handling:
   * - Becoming manager/admin: DO NOT wipe to EMPTY (that caused home blink).
   * - Leaving manager → admin: clear manager payload, then admin cache hydrates.
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
      adminModeRef.current = false;
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

  const persistAdminCache = useCallback(async (uid, nextData) => {
    if (!uid || !nextData?.dashboard) return;
    const payload = {
      dashboard: nextData.dashboard,
      appointments: nextData.appointments,
      branches: nextData.branches,
      managers: nextData.managers,
      at: Date.now(),
    };
    rememberAdminHomePayload(payload);
    try {
      await AsyncStorage.setItem(adminCacheKey(uid), JSON.stringify(payload));
    } catch {
      /* ignore */
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

  const applyAdminData = useCallback(
    (nextData, { markFresh = false } = {}) => {
      // Never replace a painted full home with another seed shell.
      if (isAdminShellPayload(nextData) && hasRealAdminDashboard(dataRef.current)) {
        return;
      }

      const prev = dataRef.current;
      const incomingShell = isAdminShellPayload(nextData);

      // Live API always wins section-by-section; seed fills any gap so design never goes blank.
      const merged = incomingShell
        ? nextData
        : {
            ...nextData,
            dashboard: nextData.dashboard
              ? {
                  stats: nextData.dashboard.stats?.length
                    ? nextData.dashboard.stats
                    : prev.dashboard?.stats || [],
                  attention: nextData.dashboard.attention?.length
                    ? nextData.dashboard.attention
                    : prev.dashboard?.attention || [],
                  branches: nextData.dashboard.branches?.length
                    ? nextData.dashboard.branches
                    : prev.dashboard?.branches || [],
                  doctors: nextData.dashboard.doctors?.length
                    ? nextData.dashboard.doctors
                    : prev.dashboard?.doctors || [],
                  managerPreview: nextData.dashboard.managerPreview?.length
                    ? nextData.dashboard.managerPreview
                    : prev.dashboard?.managerPreview || [],
                }
              : prev.dashboard,
            appointments: {
              stats: nextData.appointments?.stats?.length
                ? nextData.appointments.stats
                : prev.appointments?.stats || [],
              items: nextData.appointments?.items?.length
                ? nextData.appointments.items
                : prev.appointments?.items || [],
            },
            appointmentRequests: nextData.appointmentRequests || prev.appointmentRequests,
            branches: {
              items: nextData.branches?.items?.length
                ? nextData.branches.items
                : prev.branches?.items || [],
            },
            managers: {
              stats: nextData.managers?.stats || prev.managers?.stats || null,
              items: nextData.managers?.items?.length
                ? nextData.managers.items
                : prev.managers?.items || [],
            },
          };

      setData(merged);
      dataRef.current = merged;
      loadedOnceRef.current = true;
      setLoadedOnce(true);
      setError('');
      if (markFresh) lastFetchAtRef.current = Date.now();
      if (!incomingShell) {
        persistAdminCache(user.uid, merged);
      }
    },
    [persistAdminCache, user.uid]
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

  const readAdminCache = useCallback(async (uid) => {
    const cached = await readAdminHomeCache(uid);
    if (!cached?.dashboard) return null;
    return adminPayload(cached);
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

  // Regional admin: hydrate from disk / memory / shell ASAP (never paint empty skeleton).
  useEffect(() => {
    if (!ready || !user.uid || !(isAdmin || adminModeRef.current) || isManager) return undefined;
    let alive = true;
    (async () => {
      if (dataRef.current?.dashboard) return;
      try {
        const cached = await readAdminCache(user.uid);
        if (!alive || dataRef.current?.dashboard) return;
        if (cached?.dashboard) {
          applyAdminData(cached, { markFresh: false });
          return;
        }
      } catch {
        /* ignore */
      }
      if (!alive || dataRef.current?.dashboard) return;
      const mem = peekAdminHomePayload();
      if (mem?.dashboard) {
        applyAdminData(adminPayload(mem), { markFresh: false });
        return;
      }
      applyAdminData(adminPayload(adminHomeShell()), { markFresh: false });
    })();
    return () => {
      alive = false;
    };
  }, [ready, user.uid, isAdmin, isManager, readAdminCache, applyAdminData]);

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
          if (!isAdmin && !adminModeRef.current) {
            return;
          }

          // Dashboard-first: paint home fast on low internet; tabs fill in behind.
          let dashboard = null;
          try {
            dashboard = await fetchDashboard();
          } catch (dashErr) {
            if (!dataRef.current?.dashboard) throw dashErr;
          }

          if (requestGeneration !== requestGenerationRef.current) return;

          if (dashboard) {
            applyAdminData(
              adminPayload({
                dashboard: {
                  stats: dashboard.stats || dataRef.current.dashboard?.stats || [],
                  attention: dashboard.attention || dataRef.current.dashboard?.attention || [],
                  branches: dashboard.branches || dataRef.current.dashboard?.branches || [],
                  doctors: dashboard.doctors || dataRef.current.dashboard?.doctors || [],
                  managerPreview:
                    dashboard.managerPreview || dataRef.current.dashboard?.managerPreview || [],
                },
                appointments: dataRef.current.appointments,
                branches: dataRef.current.branches,
                managers: dataRef.current.managers,
              }),
              { markFresh: true }
            );
          }

          Promise.allSettled([
            fetchAppointments(),
            fetchBranches(),
            fetchManagers(),
          ]).then((results) => {
            if (requestGeneration !== requestGenerationRef.current) return;
            const [appointmentsResult, branchesResult, managersResult] = results;
            const appointments =
              appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : null;
            const branches =
              branchesResult.status === 'fulfilled' ? branchesResult.value : null;
            const managers =
              managersResult.status === 'fulfilled' ? managersResult.value : null;

            applyAdminData(
              adminPayload({
                dashboard: dataRef.current.dashboard,
                appointments: {
                  stats: appointments?.stats || dataRef.current.appointments?.stats || [],
                  items: appointments?.items || dataRef.current.appointments?.items || [],
                },
                branches: {
                  items: branches?.items || dataRef.current.branches?.items || [],
                },
                managers: {
                  stats: managers?.stats ?? dataRef.current.managers?.stats ?? null,
                  items: managers?.items || dataRef.current.managers?.items || [],
                },
              }),
              { markFresh: true }
            );
          });
        } catch (err) {
          if (requestGeneration !== requestGenerationRef.current) return;
          // Keep prior design visible — only surface error when nothing useful is on screen.
          if (!dataRef.current?.dashboard?.stats?.length) {
            setError(clinicErrorMessage(err));
          } else {
            setError('');
          }
        } finally {
          setLoading(false);
          if (requestGeneration === requestGenerationRef.current) {
            inFlightRef.current = null;
          }
        }
      })();

      inFlightRef.current = job;
      return job;
    },
    [sessionKey, isManager, isAdmin, refreshManagerHome, applyAdminData]
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

    try {
      const cached = await readManagerCache(user.uid);
      if (cached?.dashboard) {
        applyManagerData(cached, { markFresh: false });
        refresh({ silent: true, force: true }).catch(() => {});
        return true;
      }
    } catch {
      /* disk cache optional */
    }

    try {
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
    } catch {
      /* network warm optional */
    }

    try {
      await refreshManagerHome();
    } catch (err) {
      setError(clinicErrorMessage(err));
    }

    // Never block Get Started on flaky network — home can retry on focus.
    return true;
  }, [user.uid, readManagerCache, applyManagerData, refresh, refreshManagerHome]);

  /**
   * Instant admin home for Verify Region / MainTabs:
   * memory → disk → in-memory last-good → UI shell, then network in background.
   * Never awaits the network — no skeleton / blink on low internet.
   */
  const ensureAdminHomeReady = useCallback(async () => {
    adminModeRef.current = true;
    managerModeRef.current = false;

    if (dataRef.current?.dashboard) {
      refresh({ silent: true, force: false }).catch(() => {});
      return true;
    }

    const mem = peekAdminHomePayload();
    if (mem?.dashboard) {
      applyAdminData(adminPayload(mem), { markFresh: false });
    }

    try {
      const cached = await readAdminCache(user.uid);
      if (cached?.dashboard) {
        applyAdminData(cached, { markFresh: false });
      }
    } catch {
      /* disk cache optional */
    }

    // Guarantee a paintable dashboard before navigation (no skeleton).
    if (!dataRef.current?.dashboard) {
      applyAdminData(adminPayload(adminHomeShell()), { markFresh: false });
    }

    // Network upgrade — fire and forget.
    warmAdminHomeCache(user.uid)
      .then((warmed) => {
        if (!warmed?.dashboard) return;
        applyAdminData(adminPayload(warmed), { markFresh: true });
      })
      .catch(() => {});
    refresh({ silent: true, force: true }).catch(() => {});

    return true;
  }, [user.uid, readAdminCache, applyAdminData, refresh]);

  useEffect(() => {
    if (!ready) return undefined;

    if (!user.uid) {
      managerModeRef.current = false;
      adminModeRef.current = false;
      resetManagerTokenPrime();
      setData(EMPTY);
      loadedOnceRef.current = false;
      setLoadedOnce(false);
      lastFetchAtRef.current = 0;
      setError('');
      setLoading(false);
      return undefined;
    }

    // Only fetch once role is known (or mode locked from Verify Region).
    if (!isManager && !isAdmin && !managerModeRef.current && !adminModeRef.current) {
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
      ensureAdminHomeReady,
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
      ensureAdminHomeReady,
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
