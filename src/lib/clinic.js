import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createAdminSeedAppointments,
  createAdminSeedBranches,
  createAdminSeedDashboard,
  createAdminSeedManagers,
} from './adminSeed';
import {
  createManagerSeedAppointments,
  createManagerSeedDashboard,
  createManagerSeedRequests,
} from './managerSeed';
import { api } from './api';
import { auth } from './firebase';

export function managerClinicCacheKey(uid) {
  // Bump version when seed/dashboard shape changes so managers never keep stale empty homes.
  return `@erc/manager-clinic-cache:v6:${uid}`;
}

export function adminClinicCacheKey(uid) {
  return `@erc/admin-clinic-cache:v3:${uid}`;
}

/** In-memory last-good payloads — survives re-renders; used offline / low net. */
let lastAdminHomePayloadMem = null;
let lastManagerHomePayloadMem = null;

export function peekAdminHomePayload() {
  return lastAdminHomePayloadMem;
}

export function peekManagerHomePayload() {
  return lastManagerHomePayloadMem;
}

export function rememberManagerHomePayload(payload) {
  if (!payload?.dashboard || payload?._shell) return;
  lastManagerHomePayloadMem = payload;
}

/** Instant full manager design so Get Started never waits on network. */
export function managerHomeShell() {
  return {
    _shell: true,
    dashboard: createManagerSeedDashboard(),
    appointments: createManagerSeedAppointments(),
    appointmentRequests: createManagerSeedRequests(),
  };
}

/** Instant full admin design seed so Home/tabs never paint empty while network catches up. */
export function adminHomeShell() {
  return {
    _shell: true,
    dashboard: createAdminSeedDashboard(),
    appointments: createAdminSeedAppointments(),
    branches: createAdminSeedBranches(),
    managers: createAdminSeedManagers(),
  };
}

export function isAdminShellPayload(payload) {
  return Boolean(payload?._shell);
}

export function hasRealAdminDashboard(payload) {
  const dash = payload?.dashboard;
  if (!dash) return false;
  return Boolean(
    dash.branches?.length ||
      dash.doctors?.length ||
      dash.managerPreview?.length ||
      dash.attention?.length ||
      dash.stats?.some((item) => item?.value != null && String(item.value) !== '—')
  );
}

export function rememberAdminHomePayload(payload) {
  if (!payload?.dashboard || isAdminShellPayload(payload)) return;
  lastAdminHomePayloadMem = payload;
}

/** After login we force-refresh once; later manager calls reuse the cached ID token. */
let managerTokenPrimed = false;

/** One in-flight warm per uid so Sign-In + Verify Region share the same fetch. */
const warmPromises = new Map();
const adminWarmPromises = new Map();

export function resetManagerTokenPrime() {
  managerTokenPrimed = false;
}

async function authHeaders({ forceRefresh = false } = {}) {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error('Sign in required.');
    error.code = 'auth/required';
    throw error;
  }
  const shouldForce = forceRefresh || !managerTokenPrimed;
  const token = await user.getIdToken(shouldForce);
  managerTokenPrimed = true;
  return { Authorization: `Bearer ${token}` };
}

function unwrap(error) {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    'Could not load clinic data.';
  const err = new Error(message);
  err.code = error?.response?.data?.error || error?.code || 'CLINIC_ERROR';
  err.status = error?.response?.status;
  return err;
}

async function get(path) {
  const headers = await authHeaders();
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { data } = await api.get(path, { headers });
      return data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      const retryable =
        !status || status >= 500 || error?.code === 'ECONNABORTED' || error?.message === 'Network Error';
      if (!retryable || attempt === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw unwrap(lastError);
}

export async function fetchDashboard() {
  return get('/api/clinic/dashboard');
}

async function getManager(path) {
  const headers = await authHeaders({ forceRefresh: false });
  try {
    const { data } = await api.get(path, { headers });
    return data;
  } catch (error) {
    throw unwrap(error);
  }
}

export async function fetchManagerDashboard() {
  return getManager('/api/manager/dashboard');
}

export async function fetchManagerAppointments() {
  return getManager('/api/manager/appointments');
}

export async function fetchManagerAppointmentRequests() {
  return getManager('/api/manager/appointment-requests');
}

export async function fetchManagerTreatments() {
  return getManager('/api/manager/treatments');
}

export async function fetchManagerTreatment(id) {
  const data = await get(`/api/manager/treatments/${encodeURIComponent(id)}`);
  return data.item;
}

export async function createManagerTreatment(body) {
  const headers = await authHeaders();
  try {
    const { data } = await api.post('/api/manager/treatments', body, { headers });
    return data.item;
  } catch (error) {
    throw unwrap(error);
  }
}

export async function fetchManagerDoctors() {
  return getManager('/api/manager/doctors');
}

export async function readManagerHomeCache(uid) {
  if (!uid) return null;
  try {
    const raw = await AsyncStorage.getItem(managerClinicCacheKey(uid));
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.dashboard) return null;
    return cached;
  } catch {
    return null;
  }
}

async function writeManagerHomeCache(uid, payload) {
  if (!uid || !payload?.dashboard) return;
  rememberManagerHomePayload(payload);
  try {
    await AsyncStorage.setItem(
      managerClinicCacheKey(uid),
      JSON.stringify({ ...payload, at: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

/**
 * Warm disk cache as soon as a clinic manager signs in.
 * Returns any disk/memory cache immediately — network upgrades in the background.
 */
export function warmManagerHomeCache(uid) {
  if (!uid) return Promise.resolve(null);
  if (warmPromises.has(uid)) return warmPromises.get(uid);

  const job = (async () => {
    try {
      const existing = await readManagerHomeCache(uid);
      if (existing?.dashboard) {
        rememberManagerHomePayload(existing);
        // Soft network refresh while callers already navigate with cache.
        fetchManagerDashboard()
          .then(async (dashboard) => {
            if (!dashboard) return;
            const next = {
              dashboard,
              appointments: existing.appointments || { stats: [], items: [] },
              appointmentRequests: existing.appointmentRequests || {
                items: dashboard.appointmentRequests || [],
                counts: null,
              },
            };
            await writeManagerHomeCache(uid, next);
            const [appointments, requests] = await Promise.all([
              fetchManagerAppointments().catch(() => null),
              fetchManagerAppointmentRequests().catch(() => null),
            ]);
            await writeManagerHomeCache(uid, {
              dashboard: {
                ...dashboard,
                appointmentRequests: Array.isArray(requests?.items)
                  ? requests.items.filter((item) => item.status === 'pending')
                  : dashboard.appointmentRequests || [],
              },
              appointments: appointments
                ? { stats: appointments.stats || [], items: appointments.items || [] }
                : next.appointments,
              appointmentRequests: requests
                ? { items: requests.items || [], counts: requests.counts || null }
                : next.appointmentRequests,
            });
          })
          .catch(() => {});
        return existing;
      }

      const mem = peekManagerHomePayload();
      if (mem?.dashboard) {
        /* serve memory while fetching */
      }

      const dashboard = await fetchManagerDashboard();
      if (!dashboard) return existing || mem;
      const payload = {
        dashboard,
        appointments: existing?.appointments || mem?.appointments || { stats: [], items: [] },
        appointmentRequests: existing?.appointmentRequests || mem?.appointmentRequests || {
          items: dashboard.appointmentRequests || [],
          counts: null,
        },
      };
      await writeManagerHomeCache(uid, payload);

      Promise.all([
        fetchManagerAppointments().catch(() => null),
        fetchManagerAppointmentRequests().catch(() => null),
      ])
        .then(async ([appointments, requests]) => {
          await writeManagerHomeCache(uid, {
            dashboard: {
              ...dashboard,
              appointmentRequests: Array.isArray(requests?.items)
                ? requests.items.filter((item) => item.status === 'pending')
                : dashboard.appointmentRequests || [],
            },
            appointments: appointments
              ? {
                  stats: appointments.stats || [],
                  items: appointments.items || [],
                }
              : payload.appointments,
            appointmentRequests: requests
              ? {
                  items: requests.items || [],
                  counts: requests.counts || null,
                }
              : payload.appointmentRequests,
          });
        })
        .catch(() => {});

      return payload;
    } catch {
      return (await readManagerHomeCache(uid)) || peekManagerHomePayload();
    }
  })();

  warmPromises.set(uid, job);
  job.finally(() => {
    setTimeout(() => {
      if (warmPromises.get(uid) === job) warmPromises.delete(uid);
    }, 30_000);
  });
  return job;
}

export async function readAdminHomeCache(uid) {
  if (!uid) return null;
  try {
    const raw = await AsyncStorage.getItem(adminClinicCacheKey(uid));
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.dashboard) return null;
    return cached;
  } catch {
    return null;
  }
}

async function writeAdminHomeCache(uid, payload) {
  if (!uid || !payload?.dashboard) return;
  rememberAdminHomePayload(payload);
  try {
    await AsyncStorage.setItem(
      adminClinicCacheKey(uid),
      JSON.stringify({ ...payload, at: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

/**
 * Warm regional-admin home cache at Sign-In / Region Verify (same pattern as clinic manager).
 * Returns disk/memory immediately when fresh; network upgrades in the background.
 */
export function warmAdminHomeCache(uid) {
  if (!uid) return Promise.resolve(null);
  if (adminWarmPromises.has(uid)) return adminWarmPromises.get(uid);

  const job = (async () => {
    try {
      const existing = await readAdminHomeCache(uid);
      if (existing?.dashboard) {
        rememberAdminHomePayload(existing);
        if (existing.at && Date.now() - existing.at < 5 * 60 * 1000) {
          // Soft network refresh while callers use cache.
          fetchDashboard()
            .then(async (dashboard) => {
              if (!dashboard) return;
              const next = {
                dashboard: {
                  stats: dashboard.stats || [],
                  attention: dashboard.attention || [],
                  branches: dashboard.branches || [],
                  doctors: dashboard.doctors || [],
                  managerPreview: dashboard.managerPreview || [],
                },
                appointments: existing.appointments || { stats: [], items: [] },
                branches: existing.branches || { items: [] },
                managers: existing.managers || { stats: null, items: [] },
              };
              await writeAdminHomeCache(uid, next);
              const [appointments, branchList, managers] = await Promise.all([
                fetchAppointments().catch(() => null),
                fetchBranches().catch(() => null),
                fetchManagers().catch(() => null),
              ]);
              await writeAdminHomeCache(uid, {
                ...next,
                appointments: appointments
                  ? { stats: appointments.stats || [], items: appointments.items || [] }
                  : next.appointments,
                branches: branchList ? { items: branchList.items || [] } : next.branches,
                managers: managers
                  ? { stats: managers.stats || null, items: managers.items || [] }
                  : next.managers,
              });
            })
            .catch(() => {});
          return existing;
        }
      }

      const mem = peekAdminHomePayload();
      if (mem?.dashboard) {
        /* keep serving memory while we fetch */
      }

      const dashboard = await fetchDashboard();
      if (!dashboard) return existing || mem;

      const payload = {
        dashboard: {
          stats: dashboard.stats || [],
          attention: dashboard.attention || [],
          branches: dashboard.branches || [],
          doctors: dashboard.doctors || [],
          managerPreview: dashboard.managerPreview || [],
        },
        appointments: existing?.appointments || mem?.appointments || { stats: [], items: [] },
        branches: existing?.branches || mem?.branches || { items: [] },
        managers: existing?.managers || mem?.managers || { stats: null, items: [] },
      };
      await writeAdminHomeCache(uid, payload);

      Promise.all([
        fetchAppointments().catch(() => null),
        fetchBranches().catch(() => null),
        fetchManagers().catch(() => null),
      ])
        .then(async ([appointments, branches, managers]) => {
          await writeAdminHomeCache(uid, {
            dashboard: payload.dashboard,
            appointments: appointments
              ? { stats: appointments.stats || [], items: appointments.items || [] }
              : payload.appointments,
            branches: branches ? { items: branches.items || [] } : payload.branches,
            managers: managers
              ? { stats: managers.stats || null, items: managers.items || [] }
              : payload.managers,
          });
        })
        .catch(() => {});

      return payload;
    } catch {
      return (await readAdminHomeCache(uid)) || peekAdminHomePayload();
    }
  })();

  adminWarmPromises.set(uid, job);
  job.finally(() => {
    setTimeout(() => {
      if (adminWarmPromises.get(uid) === job) adminWarmPromises.delete(uid);
    }, 30_000);
  });
  return job;
}

export async function fetchManagerAppointmentRequest(id) {
  const data = await get(`/api/manager/appointment-requests/${encodeURIComponent(id)}`);
  return data.item;
}

export async function updateManagerAppointmentRequest(id, body) {
  const headers = await authHeaders();
  try {
    const { data } = await api.patch(
      `/api/manager/appointment-requests/${encodeURIComponent(id)}`,
      body,
      { headers }
    );
    return data.item;
  } catch (error) {
    throw unwrap(error);
  }
}

export async function fetchAppointments() {
  return get('/api/clinic/appointments');
}

export async function fetchAppointment(id) {
  const data = await get(`/api/clinic/appointments/${encodeURIComponent(id)}`);
  return data.item;
}

export async function fetchBranches() {
  return get('/api/clinic/branches');
}

export async function fetchBranch(id) {
  const data = await get(`/api/clinic/branches/${encodeURIComponent(id)}`);
  return data.item;
}

export async function fetchManagers() {
  return get('/api/clinic/managers');
}

export async function fetchManager(id) {
  const data = await get(`/api/clinic/managers/${encodeURIComponent(id)}`);
  return data.item;
}

export function clinicErrorMessage(error) {
  if (error?.code === 'auth/required' || error?.status === 401) {
    return 'Sign in again to load clinic data.';
  }
  return error?.message || 'Could not load clinic data.';
}
