import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/** Load clinic/API data when a screen gains focus (skips back-to-back double fire). */
export function useRefreshOnFocus(refresh, { enabled = true } = {}) {
  const refreshing = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || refreshing.current) return undefined;
      refreshing.current = true;
      Promise.resolve(refresh())
        .catch(() => {})
        .finally(() => {
          refreshing.current = false;
        });
      return undefined;
    }, [refresh, enabled])
  );
}
