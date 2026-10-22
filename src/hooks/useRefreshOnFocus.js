import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Optional background sync when a screen focuses.
 * Skips if data was loaded recently — tab switches stay instant (no spinner / wait).
 */
export function useRefreshOnFocus(refresh, { enabled = true } = {}) {
  const busy = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || busy.current || typeof refresh !== 'function') return undefined;
      busy.current = true;
      // Silent + stale-gated inside ClinicDataContext.refresh
      Promise.resolve(refresh({ silent: true }))
        .catch(() => {})
        .finally(() => {
          busy.current = false;
        });
      return undefined;
    }, [refresh, enabled])
  );
}
