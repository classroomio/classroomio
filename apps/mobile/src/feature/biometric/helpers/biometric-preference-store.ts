import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

import { BIOMETRIC_PREFERENCE_KEY_PREFIX } from '@/feature/biometric/constants/biometric';
import type { BiometricPreference } from '@/feature/biometric/types/biometric';

const preferences = new Map<string, BiometricPreference | null>();
const listeners = new Set<() => void>();

function storageKey(userId: string) {
  return `${BIOMETRIC_PREFERENCE_KEY_PREFIX}.${userId}`;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** The user's biometric lock choice on this device, or null when they have not been asked yet. */
export function getBiometricPreference(userId: string): BiometricPreference | null {
  if (!preferences.has(userId)) {
    const stored = SecureStore.getItem(storageKey(userId));
    preferences.set(userId, stored === 'on' || stored === 'off' ? stored : null);
  }

  return preferences.get(userId) ?? null;
}

export function setBiometricPreference(userId: string, preference: BiometricPreference) {
  preferences.set(userId, preference);
  SecureStore.setItem(storageKey(userId), preference);
  emit();
}

export function useBiometricPreference(userId: string | null) {
  return useSyncExternalStore(subscribe, () => (userId ? getBiometricPreference(userId) : null));
}
