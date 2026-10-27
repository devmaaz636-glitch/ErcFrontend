import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { auth } from './firebase';

export function managerClinicCacheKey(uid) {
  // Bump version when seed/dashboard shape changes so managers never keep stale empty homes.
  return `@erc/manager-clinic-cache:v5:${uid}`;
}

/** After login we force-refresh once; later manager calls reuse the cached ID token. */
let managerTokenPrimed = false;

/** One in-flight warm per uid so Sign-In + Verify Region share the same fetch. */
const warmPromises = new Map();

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
 * Deduped per uid — Verify Region can await the same promise (zero extra wait).
 */
export function warmManagerHomeCache(uid) {
  if (!uid) return Promise.resolve(null);
  if (warmPromises.has(uid)) return warmPromises.get(uid);

  const job = (async () => {
    try {
      const existing = await readManagerHomeCache(uid);
      // Fresh enough (< 5 min): reuse disk, refresh quietly later from context.
      if (existing?.dashboard && existing.at && Date.now() - existing.at < 5 * 60 * 1000) {
        return existing;
      }

      const dashboard = await fetchManagerDashboard();
      if (!dashboard) return existing;
      const payload = {
        dashboard,
        appointments: existing?.appointments || { stats: [], items: [] },
        appointmentRequests: existing?.appointmentRequests || {
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
      return readManagerHomeCache(uid);
    }
  })();

  warmPromises.set(uid, job);
  job.finally(() => {
    // Keep resolved promise briefly so concurrent callers reuse result.
    setTimeout(() => {
      if (warmPromises.get(uid) === job) warmPromises.delete(uid);
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
