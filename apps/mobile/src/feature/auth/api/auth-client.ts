import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { APP_SCHEME, AUTH_COOKIE_PREFIX, AUTH_STORAGE_PREFIX } from '@/feature/auth/constants/auth';

export function createClassroomioAuthClient(serverUrl: string) {
  return createAuthClient({
    baseURL: serverUrl,
    plugins: [
      expoClient({
        scheme: APP_SCHEME,
        storagePrefix: AUTH_STORAGE_PREFIX,
        cookiePrefix: AUTH_COOKIE_PREFIX,
        storage: SecureStore
      })
    ]
  });
}

export type AuthClient = ReturnType<typeof createClassroomioAuthClient>;
