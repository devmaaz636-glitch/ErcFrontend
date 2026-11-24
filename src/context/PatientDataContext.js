import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createPatientAppointment, fetchAvailability, fetchPatientPortal, updatePatientAppointment } from '../lib/patientPortal';
import { useSession } from './SessionContext';

const PatientDataContext = createContext(null);

const EMPTY = { treatments: [], doctors: [], appointments: [], documents: [] };

export function PatientDataProvider({ children }) {
  const { user, ready } = useSession();
  const isPatient = user?.role === 'patient';
  const key = `@erc/patient-portal/${user?.uid || 'anonymous'}`;
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const persist = useCallback(async (next) => {
    if (!isPatient) return;
    await AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
  }, [isPatient, key]);

  const refresh = useCallback(async () => {
    if (!isPatient) return EMPTY;
    setLoading(true);
    try {
      const next = await fetchPatientPortal();
      setData(next);
      setError('');
      persist(next);
      return next;
    } catch (nextError) {
      setError(nextError.message);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [isPatient, persist]);

  useEffect(() => {
    if (!ready || !isPatient) {
      setData(EMPTY);
      setError('');
      return undefined;
    }
    let alive = true;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!alive || !raw) return;
        const cached = JSON.parse(raw);
        if (cached?.treatments) setData({ ...EMPTY, ...cached });
      })
      .catch(() => {})
      .finally(() => {
        if (alive) refresh().catch(() => {});
      });
    return () => { alive = false; };
  }, [isPatient, key, ready, refresh]);

  const book = useCallback(async (payload) => {
    const item = await createPatientAppointment({ ...payload, branchId: user.branchId || user.clinicId || '' });
    setData((current) => {
      const next = { ...current, appointments: [item, ...current.appointments] };
      persist(next);
      return next;
    });
    return item;
  }, [persist, user.branchId, user.clinicId]);

  const changeAppointment = useCallback(async (id, payload) => {
    const item = await updatePatientAppointment(id, payload);
    setData((current) => {
      const next = { ...current, appointments: current.appointments.map((entry) => entry.id === id ? item : entry) };
      persist(next);
      return next;
    });
    return item;
  }, [persist]);

  const value = useMemo(() => ({
    ...data, loading, error, refresh, book, changeAppointment, fetchAvailability,
  }), [data, loading, error, refresh, book, changeAppointment]);

  return <PatientDataContext.Provider value={value}>{children}</PatientDataContext.Provider>;
}

export function usePatientData() {
  const context = useContext(PatientDataContext);
  if (!context) throw new Error('usePatientData must be used within PatientDataProvider.');
  return context;
}
