import * as Notifications from 'expo-notifications';
import { useSyncExternalStore } from 'react';
import { Linking } from 'react-native';

import type { PushPermission } from '@/feature/notifications/types/notifications';

let permission: PushPermission = 'undetermined';
const listeners = new Set<() => void>();

function emit(next: PushPermission) {
  if (next === permission) return;

  permission = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function toPermission(status: Notifications.NotificationPermissionsStatus): PushPermission {
  const provisional = status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (status.granted || provisional) return 'granted';
  if (status.status === 'denied' && !status.canAskAgain) return 'denied';

  return status.status === 'denied' ? 'denied' : 'undetermined';
}

export async function refreshPushPermission() {
  try {
    emit(toPermission(await Notifications.getPermissionsAsync()));
  } catch {
    emit('unavailable');
  }

  return permission;
}

/** Shows the system permission dialog when it can still appear, otherwise opens the app's system settings. */
export async function requestPushPermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted && !current.canAskAgain) {
      await Linking.openSettings();

      return permission;
    }

    emit(toPermission(await Notifications.requestPermissionsAsync()));
  } catch {
    emit('unavailable');
  }

  return permission;
}

export function usePushPermission() {
  return useSyncExternalStore(subscribe, () => permission);
}
