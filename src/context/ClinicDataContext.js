import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  clinicErrorMessage,
  fetchAppointments,
  fetchBranches,
  fetchDashboard,
  fetchManagers,
} from '../lib/clinic';

const ClinicDataContext = createContext(null);

const EMPTY = {
  dashboard: null,
  appointments: { stats: [], items: [] },
  branches: { items: [] },
  managers: { stats: null, items: [] },
};

export function ClinicDataProvider({ children }) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedOnce, setLoadedOnce] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, appointments, branches, managers] = await Promise.all([
        fetchDashboard(),
        fetchAppointments(),
        fetchBranches(),
        fetchManagers(),
      ]);
      setData({
        dashboard: {
          stats: dashboard.stats || [],
          attention: dashboard.attention || [],
          branches: dashboard.branches || [],
          doctors: dashboard.doctors || [],
          managerPreview: dashboard.managerPreview || [],
        },
        appointments: {
          stats: appointments.stats || [],
          items: appointments.items || [],
        },
        branches: { items: branches.items || [] },
        managers: {
          stats: managers.stats || null,
          items: managers.items || [],
        },
      });
      setLoadedOnce(true);
    } catch (err) {
      setError(clinicErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      ...data,
      loading,
      error,
      loadedOnce,
      refresh,
    }),
    [data, loading, error, loadedOnce, refresh]
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
