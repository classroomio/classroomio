import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

const subscribe = (listener: () => void) => onlineManager.subscribe(listener);

/** True while React Query considers the device offline; the same state that pauses fetches and mutations. */
export function useIsOffline() {
  return !useSyncExternalStore(subscribe, () => onlineManager.isOnline());
}
