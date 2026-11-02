import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

import { THEME_PREFERENCE_STORAGE_KEY } from '@/feature/settings/constants/settings';
import type { ThemePreference } from '@/feature/settings/types/settings';

function parse(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

function apply(value: ThemePreference) {
  Appearance.setColorScheme(value === 'system' ? 'auto' : value);
}

let preference = parse(SecureStore.getItem(THEME_PREFERENCE_STORAGE_KEY));
apply(preference);

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getThemePreference() {
  return preference;
}

export function setThemePreference(next: ThemePreference) {
  preference = next;
  apply(next);
  SecureStore.setItem(THEME_PREFERENCE_STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

export function useThemePreference() {
  return useSyncExternalStore(subscribe, getThemePreference);
}
