import { focusManager, useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/** Tells React Query the app is focused while it is in the foreground, so stale queries refetch when it returns. */
export function connectQueryAppFocus() {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (status) => setFocused(status === 'active'));

    return () => subscription.remove();
  });
}

/**
 * Refetches the queries of mounted screens that would refetch on focus, after each navigation, since stack and tab
 * screens stay mounted. Staleness and `refetchOnWindowFocus` apply as they do on app focus.
 */
export function useRefetchOnNavigation() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;
    void queryClient.refetchQueries({
      type: 'active',
      predicate: (query) => query.observers.some((observer) => observer.shouldFetchOnWindowFocus())
    });
  }, [pathname, queryClient]);
}
