import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
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
    // Catalog and appointments are essential. Documents and follow-ups are
    // extras: if either fails, the rest of the app must still show its data.
    const [catalog, appointments, documentsResult, followUpsResult] = await Promise.all([
      api.get('/api/patient/catalog', { headers }),
      api.get('/api/patient/appointments', { headers }),
      api.get('/api/patient/documents', { headers }).catch(() => null),
      api.get('/api/patient/followups', { headers }).catch(() => null),
    ]);
    const documents = documentsResult || { data: {} };
    const followUps = followUpsResult || { data: {} };
    return {
      treatments: catalog.data?.treatments || [],
      doctors: catalog.data?.doctors || [],
      categories: catalog.data?.categories || [],
      banners: catalog.data?.banners || [],
      popular: catalog.data?.popular || [],
      clinics: catalog.data?.clinics || [],
      regions: catalog.data?.regions || [],
      followUps: followUps.data?.items || [],
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

export async function savePatientProfile(profile) {
  try {
    const headers = await authHeaders();
    const { data } = await api.put('/api/patient/profile', profile, { headers });
    return data.profile;
  } catch (error) {
    throw new Error(message(error, 'Could not save your profile. Please try again.'));
  }
}

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

async function readFileBase64(file) {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(file.uri)).blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(new Error('Could not read the selected file.'));
      reader.readAsDataURL(blob);
    });
  }
  return FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
}

/** Attach a picked PDF/image to one of the patient's own appointments. */
export async function uploadAppointmentDocument(appointmentId, file) {
  try {
    const headers = await authHeaders();
    const data = await readFileBase64(file);
    const { data: res } = await api.post(
      '/api/patient/documents',
      {
        appointmentId,
        name: file.name || 'document',
        mimeType: file.mimeType || (String(file.name).toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        data,
      },
      { headers }
    );
    return res.item;
  } catch (error) {
    throw new Error(message(error, 'Could not upload your document.'));
  }
}

/** Download an appointment document and open the system share / save sheet. */
export async function openAppointmentDocument(documentId) {
  try {
    const headers = await authHeaders();
    const { data } = await api.get(`/api/patient/documents/${documentId}/content`, { headers });
    const safeName = String(data.name || 'document').replace(/[^\w.-]+/g, '_');
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = safeName;
      link.click();
      return;
    }
    const root = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const uri = `${root}${Date.now()}-${safeName}`;
    await FileSystem.writeAsStringAsync(uri, data.data, { encoding: FileSystem.EncodingType.Base64 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: data.mimeType, dialogTitle: data.name });
    }
  } catch (error) {
    throw new Error(message(error, 'Could not open this document.'));
  }
}
