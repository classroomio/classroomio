import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { useApi } from '@/feature/common/components/api-provider';
import { registerDeviceToken, unregisterDeviceToken } from '@/feature/notifications/api/device-token';
import { easProjectId } from '@/feature/notifications/helpers/push-project';
import { usePushPermission } from '@/feature/notifications/helpers/push-permission-store';
import { setRegisteredPushToken } from '@/feature/notifications/helpers/push-registration-store';
import { appVersionOf } from '@/feature/settings/helpers/app-version';

// A token request can hang on flaky networks, so it gets a deadline.
const TOKEN_TIMEOUT_MS = 10_000;

function deviceLocale() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}

function expoPushToken(projectId: string) {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), TOKEN_TIMEOUT_MS));
  const token = Notifications.getExpoPushTokenAsync({ projectId }).then((result) => result.data);

  return Promise.race([token, timeout]);
}

/**
 * Registers this device's Expo push token with the API on launch, on sign-in, and when notifications become allowed.
 * Builds without an EAS project id skip registration.
 */
export function usePushRegistration() {
  const api = useApi();
  const { userId } = useAuth();
  const permission = usePushPermission();

  useEffect(() => {
    const projectId = easProjectId();
    if (!userId || permission !== 'granted' || !projectId) return;

    let cancelled = false;

    const register = async () => {
      const token = await expoPushToken(projectId);
      if (cancelled || !token) return;

      await registerDeviceToken(api, {
        token,
        platform: Platform.OS === 'android' ? 'android' : 'ios',
        appVersion: appVersionOf(),
        deviceName: Device.deviceName ?? Device.modelName ?? undefined,
        locale: deviceLocale()
      });
      setRegisteredPushToken(token, async () => {
        await unregisterDeviceToken(api, token);
      });
    };

    void register().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [api, userId, permission]);
}
