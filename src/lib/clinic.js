import { api } from './api';
import { auth } from './firebase';

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error('Sign in required.');
    error.code = 'auth/required';
    throw error;
  }
  const token = await user.getIdToken();
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

export async function fetchManagerDashboard() {
  return get('/api/manager/dashboard');
}

export async function fetchManagerAppointments() {
  return get('/api/manager/appointments');
}

export async function fetchManagerAppointmentRequests() {
  return get('/api/manager/appointment-requests');
}

export async function fetchManagerTreatments() {
  return get('/api/manager/treatments');
}

export async function fetchManagerDoctors() {
  return get('/api/manager/doctors');
}

export async function fetchManagerDoctor(id) {
  const data = await get(`/api/manager/doctors/${encodeURIComponent(id)}`);
  return data.item;
}

async function mutateDoctor(method, path, body) {
  const headers = await authHeaders();
  try {
    const { data } = await api.request({ method, url: path, data: body, headers });
    return data.item;
  } catch (error) {
    throw unwrap(error);
  }
}

export function createManagerDoctor(body) {
  return mutateDoctor('post', '/api/manager/doctors', body);
}

export function updateManagerDoctor(id, body) {
  return mutateDoctor('patch', `/api/manager/doctors/${encodeURIComponent(id)}`, body);
}

export function deleteManagerDoctor(id) {
  return mutateDoctor('delete', `/api/manager/doctors/${encodeURIComponent(id)}`);
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
