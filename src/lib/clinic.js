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
  try {
    const headers = await authHeaders();
    const { data } = await api.get(path, { headers });
    return data;
  } catch (error) {
    throw unwrap(error);
  }
}

export async function fetchDashboard() {
  return get('/api/clinic/dashboard');
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
