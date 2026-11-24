import { auth } from './firebase';
import { api } from './api';

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in again.');
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

function message(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export async function fetchPatientPortal() {
  try {
    const headers = await authHeaders();
    const [catalog, appointments, documents] = await Promise.all([
      api.get('/api/patient/catalog', { headers }),
      api.get('/api/patient/appointments', { headers }),
      api.get('/api/patient/documents', { headers }),
    ]);
    return {
      treatments: catalog.data?.treatments || [],
      doctors: catalog.data?.doctors || [],
      categories: catalog.data?.categories || [],
      banners: catalog.data?.banners || [],
      popular: catalog.data?.popular || [],
      appointments: appointments.data?.items || [],
      documents: documents.data?.items || [],
    };
  } catch (error) {
    throw new Error(message(error, 'Could not load your patient information.'));
  }
}

export async function fetchAvailability(doctorId, date) {
  try {
    const headers = await authHeaders();
    const { data } = await api.get('/api/patient/availability', {
      headers,
      params: { doctorId, date },
    });
    return data?.slots || [];
  } catch (error) {
    throw new Error(message(error, 'Could not load available appointment times.'));
  }
}

export async function createPatientAppointment(payload) {
  try {
    const headers = await authHeaders();
    const { data } = await api.post('/api/patient/appointments', payload, { headers });
    return data.item;
  } catch (error) {
    throw new Error(message(error, 'Could not submit your appointment request.'));
  }
}

export async function updatePatientAppointment(id, payload) {
  try {
    const headers = await authHeaders();
    const { data } = await api.patch(`/api/patient/appointments/${id}`, payload, { headers });
    return data.item;
  } catch (error) {
    throw new Error(message(error, 'Could not update your appointment.'));
  }
}
