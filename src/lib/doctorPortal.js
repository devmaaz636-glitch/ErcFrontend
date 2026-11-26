import { auth } from './firebase';
import { api } from './api';
import { saveDocumentToDevice } from './patientPortal';

async function request(method, url, { data, params } = {}, fallback) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Please sign in again.');
    const headers = { Authorization: `Bearer ${await user.getIdToken()}` };
    const response = await api.request({ method, url, data, params, headers });
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error?.message || fallback);
  }
}

export const fetchDoctorDashboard = () =>
  request('get', '/api/doctor/dashboard', {}, 'Could not load your dashboard.');

export const fetchDoctorAppointments = async () =>
  (await request('get', '/api/doctor/appointments', {}, 'Could not load your appointments.')).items || [];

export const fetchDoctorAppointment = (id) =>
  request('get', `/api/doctor/appointments/${id}`, {}, 'Could not load this appointment.');

/** action: confirm | complete | cancel | reschedule */
export const updateDoctorAppointment = async (id, data) =>
  (await request('patch', `/api/doctor/appointments/${id}`, { data }, 'Could not update the appointment.')).item;

export const fetchDoctorPatients = async () =>
  (await request('get', '/api/doctor/patients', {}, 'Could not load your patients.')).items || [];

export const saveDoctorPatientMedical = async (uid, data) =>
  (await request('put', `/api/doctor/patients/${uid}/medical`, { data }, 'Could not save medical information.'))
    .medical;

export const fetchDoctorSchedule = () =>
  request('get', '/api/doctor/schedule', {}, 'Could not load your schedule.');

export const fetchDoctorSlots = async (date) =>
  (await request('get', '/api/doctor/availability', { params: { date } }, 'Could not load free times.')).slots || [];

export async function openDoctorDocument(appointmentId) {
  const data = await request(
    'get',
    `/api/doctor/appointments/${appointmentId}/document`,
    {},
    'Could not open this document.'
  );
  await saveDocumentToDevice(data);
}
