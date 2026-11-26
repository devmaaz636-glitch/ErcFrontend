import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useNotifications } from '../context/NotificationsContext';

/**
 * Load doctor data when a screen gains focus, and again when a live
 * notification arrives. `loader` must be stable (module function or useCallback).
 */
export function useDoctorQuery(loader) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);
  const lastJson = useRef('');
  const { subscribeLive } = useNotifications();

  const reload = useCallback(async () => {
    try {
      const next = await loader();
      if (!alive.current) return;
      const json = JSON.stringify(next);
      if (json !== lastJson.current) {
        lastJson.current = json;
        setData(next);
      }
      setError('');
    } catch (nextError) {
      if (alive.current) setError(nextError.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  useEffect(() => subscribeLive(() => reload()), [subscribeLive, reload]);

  return { data, error, loading, reload };
}
